'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AnalysisResultDisplay } from '@/components/analysis-result-display'
import { ABTestDisplay } from '@/components/ab-test-display'
import { HypothesesDisplay } from '@/components/hypotheses-display'
import { BusinessAnalyticsModern } from '@/components/business-analytics-modern'
import { AuditDebugPanel } from '@/components/audit-debug-panel'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Share2, RefreshCw } from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { PageHeader } from '@/components/page-header'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { ABTestResponse, HypothesisResponse, BusinessAnalyticsResponse } from '@/lib/analysis-types'
import { safeParseJSON } from '@/lib/json-parser'
import { safeAdaptAnalysisData } from '@/lib/analysis-data-adapter'
import { useTranslation } from '@/hooks/use-translation'
import Link from 'next/link'

interface Audit {
  id: string
  name: string
  type: string
  status: string
  input_data: any
  result_data: any
  created_at: string
  updated_at: string
  project_id: string
  user_id: string
  projects?: {
    id: string
    name: string
  }
}

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string
  const { t, currentLanguage, isLoading } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abTestData, setAbTestData] = useState<ABTestResponse | null>(null)
  const [abTestLoading, setAbTestLoading] = useState(false)
  const [hypothesesData, setHypothesesData] = useState<HypothesisResponse | null>(null)
  const [hypothesesLoading, setHypothesesLoading] = useState(false)
  const [businessAnalyticsData, setBusinessAnalyticsData] = useState<BusinessAnalyticsResponse | null>(null)
  const [businessAnalyticsLoading, setBusinessAnalyticsLoading] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [publicUrlLoading, setPublicUrlLoading] = useState(false)
  const [shareStatus, setShareStatus] = useState<'idle' | 'loading' | 'copied'>('idle')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const tabItems = useMemo(() => {
    // Fallback значения на время загрузки переводов
    const fallbacks = currentLanguage === 'en'
      ? ['UX Analysis', 'A/B Tests', 'Hypotheses', 'Business Analytics']
      : ['UX анализ', 'A/B тест', 'Гипотезы', 'Бизнес-аналитика']

    return [
      { id: 'ux-analysis', label: t('analysis.tabs.uxAnalysis') || fallbacks[0] },
      { id: 'ab-test', label: t('analysis.tabs.abTests') || fallbacks[1] },
      { id: 'hypotheses', label: t('analysis.tabs.hypotheses') || fallbacks[2] },
      { id: 'analytics', label: t('analysis.tabs.analytics') || fallbacks[3] }
    ]
  }, [t, currentLanguage, isLoading])

  // Функция обновления страницы
  const handleRefresh = () => {
    router.refresh()
  }

  // Функция для создания публичной ссылки
  const createPublicLink = async (): Promise<string | null> => {
    if (!audit) return null
    
    setPublicUrlLoading(true)
    try {
      const response = await fetch(`/api/audits/${auditId}/public-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to create public link')
      }

      const data = await response.json()
      setPublicUrl(data.publicUrl)
      console.log('✅ Публичная ссылка создана:', data.publicUrl)
      return data.publicUrl
    } catch (error) {
      console.error('❌ Ошибка создания публичной ссылки:', error)
      alert('Ошибка создания публичной ссылки')
      return null
    } finally {
      setPublicUrlLoading(false)
    }
  }

  const handleShareClick = async () => {
    if (publicUrlLoading || shareStatus === 'loading') return

    setShareStatus('loading')
    try {
      let url = publicUrl
      if (!url) {
        url = await createPublicLink() || null
      }

      if (!url) {
        setShareStatus('idle')
        return
      }

      await navigator.clipboard.writeText(url)
      setShareStatus('copied')
      setTimeout(() => setShareStatus('idle'), 2000)
    } catch (error) {
      console.error('❌ Ошибка копирования ссылки:', error)
      alert('Ошибка копирования ссылки')
      setShareStatus('idle')
    }
  }


  // Функция для генерации AB тестов
  const generateABTests = async () => {
    if (!audit) return
    
    setAbTestLoading(true)
    try {
      const response = await fetch('/api/ab-test-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ auditId: audit.id }),
      })

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов для AB теста:', errorData)
            alert(`Недостаточно кредитов для генерации AB тестов!\nТребуется: ${errorData.required_credits || 3} кредитов\nДоступно: ${errorData.current_balance || 0} кредитов\n\nПополните баланс кредитов для продолжения.`)
            setAbTestLoading(false)
            return
          } catch (parseError) {
            console.error('Ошибка парсинга ответа:', parseError)
          }
        }
        throw new Error('Failed to generate AB tests')
      }

      const data = await response.json()
      setAbTestData(data.data)
      
      // Обновляем данные аудита
      setAudit(prev => prev ? {
        ...prev,
        result_data: {
          ...prev.result_data,
          ab_tests: data.data
        }
      } : null)
    } catch (error) {
      console.error('Error generating AB tests:', error)
    } finally {
      setAbTestLoading(false)
    }
  }

  // Функция для генерации гипотез
  const generateHypotheses = async () => {
    if (!audit) return
    
    setHypothesesLoading(true)
    try {
      const response = await fetch('/api/hypotheses-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ auditId: audit.id }),
      })

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов для гипотез:', errorData)
            alert(`Недостаточно кредитов для генерации гипотез!\nТребуется: ${errorData.required_credits || 1} кредит\nДоступно: ${errorData.current_balance || 0} кредитов\n\nПополните баланс кредитов для продолжения.`)
            setHypothesesLoading(false)
            return
          } catch (parseError) {
            console.error('Ошибка парсинга ответа:', parseError)
          }
        }
        throw new Error('Failed to generate hypotheses')
      }

      const data = await response.json()
      setHypothesesData(data.data)
      
      // Обновляем данные аудита
      setAudit(prev => prev ? {
        ...prev,
        result_data: {
          ...prev.result_data,
          hypotheses: data.data
        }
      } : null)
    } catch (error) {
      console.error('Error generating hypotheses:', error)
    } finally {
      setHypothesesLoading(false)
    }
  }

  // Функция для генерации бизнес аналитики
  const generateBusinessAnalytics = async () => {
    if (!audit) return

    setBusinessAnalyticsLoading(true)
    try {
      const response = await fetch('/api/business-analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          auditId: audit.id
        }),
      })

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов для бизнес аналитики:', errorData)
            alert(`Недостаточно кредитов для генерации бизнес аналитики!\nТребуется: ${errorData.required_credits || 4} кредита\nДоступно: ${errorData.current_balance || 0} кредитов\n\nПополните баланс кредитов для продолжения.`)
            setBusinessAnalyticsLoading(false)
            return
          } catch (parseError) {
            console.error('Ошибка парсинга ответа:', parseError)
          }
        }
        throw new Error('Failed to generate business analytics')
      }

      const data = await response.json()
      setBusinessAnalyticsData(data.data)
      
      // Обновляем данные аудита
      setAudit(prev => prev ? {
        ...prev,
        result_data: {
          ...prev.result_data,
          business_analytics: { result: data.result }
        }
      } : null)
    } catch (error) {
      console.error('Error generating business analytics:', error)
    } finally {
      setBusinessAnalyticsLoading(false)
    }
  }

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (auditId && user) {
      loadAudit()
    }
  }, [auditId, user])

  // Проверяем pending audit analysis из localStorage
  useEffect(() => {
    if (audit && user) {
      checkPendingAuditAnalysis()
    }
  }, [audit, user])

  const checkPendingAuditAnalysis = async () => {
    const pendingData = localStorage.getItem('pendingAuditAnalysis')
    if (!pendingData || !audit || !user) return

    try {
      const data = JSON.parse(pendingData)
      console.log('🔍 Обнаружен pendingAuditAnalysis:', data)

      // Проверяем что это наш аудит
      if (data.auditId !== audit.id) {
        console.log('⚠️ pendingAuditAnalysis для другого аудита, пропускаем')
        return
      }

      // ВАЖНО: Проверяем что аудит принадлежит текущему пользователю
      if (audit.user_id !== user.id) {
        console.log('🚨 SECURITY: Обнаружена попытка запустить аудит другого пользователя!')
        console.log('🚨 Audit user_id:', audit.user_id)
        console.log('🚨 Current user_id:', user.id)
        localStorage.removeItem('pendingAuditAnalysis')
        return
      }

      // Дополнительная проверка userId из pendingData
      if (data.userId && data.userId !== user.id) {
        console.log('🚨 SECURITY: userId в pendingData не совпадает с текущим пользователем!')
        console.log('🚨 Pending userId:', data.userId)
        console.log('🚨 Current user_id:', user.id)
        localStorage.removeItem('pendingAuditAnalysis')
        return
      }

      // Очищаем localStorage
      localStorage.removeItem('pendingAuditAnalysis')

      // Показываем fullscreen loading
      if (data.autoStart) {
        setIsAnalyzing(true)
      }

      // Запускаем анализ автоматически
      console.log('🚀 Автозапуск анализа для аудита', audit.id)

      const response = await fetch('/api/research-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          url: data.type === 'url' ? data.data : undefined,
          screenshot: data.type === 'screenshot' ? data.data : undefined,
          auditId: audit.id,
          language: currentLanguage
        })
      })

      if (!response.ok) {
        console.error('❌ Ошибка анализа:', response.status, response.statusText)
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ Детали ошибки:', errorData)
        setIsAnalyzing(false)

        // Обновляем статус аудита на failed
        await supabase
          .from('audits')
          .update({ status: 'failed' })
          .eq('id', audit.id)

        if (response.status === 402) {
          alert(`Недостаточно кредитов!\nТребуется: ${errorData.required_credits || 2}\nДоступно: ${errorData.current_balance || 0}`)
        } else if (response.status === 400) {
          alert(`Ошибка запроса: ${errorData.error || 'Проверьте данные'}`)
        }

        // Перезагружаем аудит чтобы показать ошибку
        await loadAudit()
        return
      }

      const result = await response.json()
      console.log('✅ Анализ завершен:', result)

      // Обновляем название аудита на основе screenType
      if (result.data) {
        const analysisData = result.data
        const screenType = analysisData.screenDescription?.screenType ||
                          analysisData.interface_analysis?.screen_type || null

        if (screenType && typeof screenType === 'string' && screenType.trim() !== '') {
          // Ограничиваем название до 3 слов
          const truncateScreenType = (text: string, maxWords: number = 3): string => {
            if (!text || text.trim() === '') return ''
            const words = text.trim().split(/\s+/)
            if (words.length <= maxWords) return text
            return words.slice(0, maxWords).join(' ') + '...'
          }

          const newAuditName = truncateScreenType(screenType)
          console.log('🏷️ Обновляем название аудита:', newAuditName)

          // Обновляем в базе
          const { error: updateError } = await supabase
            .from('audits')
            .update({ name: newAuditName })
            .eq('id', audit.id)

          if (updateError) {
            console.error('Ошибка обновления названия:', updateError)
          } else {
            console.log('✅ Название аудита обновлено')
          }
        }
      }

      // Перезагружаем аудит для отображения результата
      await loadAudit()

      // Скрываем fullscreen loading
      setIsAnalyzing(false)

    } catch (error) {
      console.error('❌ Ошибка checkPendingAuditAnalysis:', error)
      localStorage.removeItem('pendingAuditAnalysis')
      setIsAnalyzing(false)
    }
  }

  const loadAudit = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Загружаем аудит с ID:', auditId)
      
      const { data: auditData, error: auditError } = await supabase
        .from('audits')
        .select(`
          *,
          projects!inner(id, name)
        `)
        .eq('id', auditId)
        .single()

      if (auditError) {
        console.error('Ошибка загрузки аудита:', auditError)
        setError('Аудит не найден')
        return
      }

      console.log('Аудит загружен:', auditData)
      setAudit(auditData)

      // Проверяем наличие результата
      if (auditData.result_data && Object.keys(auditData.result_data).length > 0) {
        console.log('✅ Результат найден в audits:', auditData.result_data)
        
        // Загружаем AB тесты если они есть
        if (auditData.result_data.ab_tests) {
          setAbTestData(auditData.result_data.ab_tests)
        }
        
        // Загружаем гипотезы если они есть
        if (auditData.result_data.hypotheses) {
          setHypothesesData(auditData.result_data.hypotheses)
        }
        
        // Загружаем бизнес аналитику если она есть
        if (auditData.result_data.business_analytics) {
          setBusinessAnalyticsData(auditData.result_data.business_analytics)
        }
      } else {
        console.log('⚠️ Результат не найден в audits, аудит может быть в процессе')
      }
    } catch (err) {
      console.error('Ошибка загрузки аудита:', err)
      setError('Ошибка загрузки аудита')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Аудит не найден
          </h2>
          <p className="text-slate-600 mb-6">
            {error || 'Аудит с указанным ID не существует'}
          </p>
          <BackArrow onClick={() => router.push('/home')} />
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      {/* Fullscreen loading state во время анализа */}
      {isAnalyzing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
          <div className="text-center max-w-md px-6">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-blue-100"></div>
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Анализируем интерфейс
            </h2>
            <p className="text-slate-600 mb-6">
              Пожалуйста, подождите. Это займет 30-60 секунд
            </p>
            <div className="space-y-2 text-sm text-slate-500">
              <p>🔍 Изучаем элементы интерфейса</p>
              <p>📊 Анализируем UX-метрики</p>
              <p>💡 Формируем рекомендации</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Хедер аудита */}
          <div className="px-8">
            <PageHeader
              breadcrumbs={[
                { label: 'Главная', href: '/home' },
                { label: 'Мои проекты', href: '/projects' },
                ...(audit.project_id ? [{ label: audit.projects?.name || 'Проект', href: `/projects/${audit.project_id}` }] : []),
                { label: audit.name }
              ]}
              title={audit.name}
              subtitle={`Создан: ${new Date(audit.created_at).toLocaleDateString('ru-RU')}`}
              showBackButton={true}
              onBack={() => router.push(audit?.project_id ? `/projects/${audit.project_id}` : '/home')}
              showShareButton={true}
              onShare={handleShareClick}
              shareButtonLabel={currentLanguage === 'en' ? 'Share' : 'Поделиться'}
            />
          </div>

        {/* Результаты анализа */}
        {audit.result_data ? (
          <Tabs defaultValue="ux-analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 h-16 relative z-10 p-1">
              {tabItems.map((tab) => (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="ux-analysis">
              {(() => {
                console.log('Отображаем результат аудита:', audit.result_data)
                console.log('Ключи result_data:', Object.keys(audit.result_data))
                console.log('analysis_result:', audit.result_data.analysis_result)
                console.log('Весь result_data:', JSON.stringify(audit.result_data, null, 2))
                
                // Парсим результат если он в формате {content: "JSON_STRING"}
                let result = audit.result_data
                if (result && typeof result === 'object' && 'content' in result) {
                  try {
                    console.log('Парсим content как JSON с улучшенным парсером...')
                    
                    // Используем улучшенный парсер
                    const parsedResult = safeParseJSON(result.content)
                    
                    if (parsedResult) {
                      result = parsedResult
                      console.log('✅ JSON успешно распарсен с улучшенным парсером')
                      console.log('Результат распарсен:', Object.keys(result || {}))
                    } else {
                      console.log('❌ Не удалось распарсить JSON даже с улучшенным парсером')
                      result = audit.result_data
                    }
                  } catch (parseError) {
                    console.error('Ошибка парсинга content:', parseError)
                    console.log('Используем оригинальные данные без парсинга')
                    result = audit.result_data
                  }
                }
                
                // Адаптируем данные к новому формату
                console.log('🔄 Attempting to adapt data format...')
                const adaptedResult = safeAdaptAnalysisData(result)
                
                if (adaptedResult) {
                  console.log('✅ Data successfully adapted:', Object.keys(adaptedResult))
                  result = adaptedResult
                } else {
                  console.log('⚠️ Could not adapt data, using original format')
                }
                
                console.log('Результат для AnalysisResultDisplay:', result)
                return (
                  <AnalysisResultDisplay 
                    analysis={result}
                    screenshot={audit.input_data?.screenshotUrl}
                    url={audit.input_data?.url}
                    auditId={audit.id}
                    showDetails={true}
                  />
                )
              })()}
            </TabsContent>
            
            <TabsContent value="ab-test">
              <ABTestDisplay 
                data={abTestData}
                isLoading={abTestLoading}
                onGenerate={audit?.status === 'completed' ? generateABTests : undefined}
              />
            </TabsContent>
            
            <TabsContent value="hypotheses">
              <HypothesesDisplay 
                data={hypothesesData}
                isLoading={hypothesesLoading}
                onGenerate={audit?.status === 'completed' ? generateHypotheses : undefined}
              />
            </TabsContent>
            
            <TabsContent value="analytics">
              <BusinessAnalyticsModern
                data={businessAnalyticsData}
                isLoading={businessAnalyticsLoading}
                onGenerate={audit?.status === 'completed' ? generateBusinessAnalytics : undefined}
              />
            </TabsContent>
          </Tabs>
        ) : audit.status === 'failed' ? (
          <Card className="border-red-200">
            <CardContent className="text-center py-12">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Ошибка анализа
              </h3>
              <p className="text-slate-600 mb-4">
                Анализ не удалось выполнить. Возможно, недостаточно кредитов.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={() => router.push('/credits')} variant="default">
                  Пополнить кредиты
                </Button>
                <Button onClick={() => router.push(`/projects/${audit.project_id}`)} variant="outline">
                  Вернуться к проекту
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Анализ в процессе
              </h3>
              <p className="text-slate-600 mb-4">
                Результаты анализа будут доступны через несколько минут
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </CardContent>
          </Card>
        )}

          {/* Debug Panel */}
          <AuditDebugPanel auditId={auditId} auditData={audit} />
        </div>
      )}
    </SidebarDemo>
  )
}
