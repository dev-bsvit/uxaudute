'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AnalysisResultDisplay } from '@/components/analysis-result-display'
import { ABTestDisplay } from '@/components/ab-test-display'
import { HypothesesDisplay } from '@/components/hypotheses-display'
import { BusinessTextDisplay } from '@/components/business-text-display'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Download, Share2, RefreshCw } from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { ABTestResponse, HypothesisResponse } from '@/lib/analysis-types'
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
  projects?: {
    id: string
    name: string
  }
}

export default function AuditPage() {
  const params = useParams()
  const auditId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [abTestData, setAbTestData] = useState<ABTestResponse | null>(null)
  const [abTestLoading, setAbTestLoading] = useState(false)
  const [hypothesesData, setHypothesesData] = useState<HypothesisResponse | null>(null)
  const [hypothesesLoading, setHypothesesLoading] = useState(false)
  const [businessAnalyticsData, setBusinessAnalyticsData] = useState<{ result: string } | null>(null)
  const [businessAnalyticsLoading, setBusinessAnalyticsLoading] = useState(false)
  const [publicUrl, setPublicUrl] = useState<string | null>(null)
  const [publicUrlLoading, setPublicUrlLoading] = useState(false)

  // Функция для создания публичной ссылки
  const createPublicLink = async () => {
    if (!audit) return
    
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
    } catch (error) {
      console.error('❌ Ошибка создания публичной ссылки:', error)
      alert('Ошибка создания публичной ссылки')
    } finally {
      setPublicUrlLoading(false)
    }
  }

  // Функция для отключения публичной ссылки
  const disablePublicLink = async () => {
    if (!audit) return
    
    setPublicUrlLoading(true)
    try {
      const response = await fetch(`/api/audits/${auditId}/public-link`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to disable public link')
      }

      setPublicUrl(null)
      console.log('✅ Публичная ссылка отключена')
    } catch (error) {
      console.error('❌ Ошибка отключения публичной ссылки:', error)
      alert('Ошибка отключения публичной ссылки')
    } finally {
      setPublicUrlLoading(false)
    }
  }

  // Функция для копирования ссылки
  const copyPublicLink = async () => {
    if (!publicUrl) return
    
    try {
      await navigator.clipboard.writeText(publicUrl)
      alert('Ссылка скопирована в буфер обмена!')
    } catch (error) {
      console.error('❌ Ошибка копирования ссылки:', error)
      alert('Ошибка копирования ссылки')
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
      // Подготавливаем контекст для бизнес анализа
      const context = JSON.stringify(audit.result_data, null, 2)
      
      const response = await fetch('/api/business-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ 
          context,
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
      // Бизнес аналитика возвращает текст, а не JSON объект
      setBusinessAnalyticsData({ result: data.result } as any)
      
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

  const handleRefresh = () => {
    loadAudit()
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
          <Link href={`/${params.locale}/dashboard`}>
            <BackArrow />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        {/* Навигация */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={audit?.project_id ? `/projects/${audit.project_id}` : '/dashboard'}>
              <BackArrow />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{audit.name}</h1>
              <p className="text-sm text-slate-600">
                Создан: {new Date(audit.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Скачать отчет
            </Button>
            {/* Кнопка публичного доступа */}
            {!publicUrl ? (
              <Button 
                variant="outline" 
                onClick={createPublicLink}
                disabled={publicUrlLoading}
                className="flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {publicUrlLoading ? 'Создание...' : 'Поделиться'}
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={copyPublicLink}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Копировать ссылку
                </Button>
                <Button 
                  variant="outline" 
                  onClick={disablePublicLink}
                  disabled={publicUrlLoading}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  Отключить
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Результаты анализа */}
        {audit.result_data ? (
          <Tabs defaultValue="ux-analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 h-16 relative z-10 p-1">
              <TabsTrigger 
                value="ux-analysis" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                UX Анализ
              </TabsTrigger>
              <TabsTrigger 
                value="ab-test" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                AB тест
              </TabsTrigger>
              <TabsTrigger 
                value="hypotheses" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Гипотезы
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Продуктовая аналитика
              </TabsTrigger>
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
                    console.log('Парсим content как JSON...')
                    let contentToParse = result.content
                    
                    // Умное восстановление JSON
                    const tryParseJSON = (jsonString: string) => {
                      try {
                        return JSON.parse(jsonString)
                      } catch (error) {
                        return null
                      }
                    }

                    // Сначала пробуем парсить как есть
                    let parsedResult = tryParseJSON(contentToParse)
                    
                    if (!parsedResult) {
                      console.log('⚠️ JSON невалиден, пытаемся восстановить...')
                      
                      // Алгоритм восстановления JSON
                      const fixTruncatedJSON = (jsonStr: string) => {
                        // Убираем лишние пробелы в конце
                        let fixed = jsonStr.trim()
                        
                        // Если строка не заканчивается на } или ], ищем последнюю валидную позицию
                        if (!fixed.endsWith('}') && !fixed.endsWith(']')) {
                          // Ищем последнюю закрывающую скобку
                          let lastBrace = fixed.lastIndexOf('}')
                          let lastBracket = fixed.lastIndexOf(']')
                          let lastComplete = Math.max(lastBrace, lastBracket)
                          
                          if (lastComplete > 0) {
                            // Обрезаем до последней валидной позиции
                            fixed = fixed.substring(0, lastComplete + 1)
                          } else {
                            // Если нет закрывающих скобок, добавляем их
                            const openBraces = (fixed.match(/\{/g) || []).length
                            const closeBraces = (fixed.match(/\}/g) || []).length
                            const openBrackets = (fixed.match(/\[/g) || []).length
                            const closeBrackets = (fixed.match(/\]/g) || []).length
                            
                            // Добавляем недостающие закрывающие скобки
                            for (let i = 0; i < openBraces - closeBraces; i++) {
                              fixed += '}'
                            }
                            for (let i = 0; i < openBrackets - closeBrackets; i++) {
                              fixed += ']'
                            }
                          }
                        }
                        
                        return fixed
                      }
                      
                      // Пробуем восстановить JSON
                      const fixedJSON = fixTruncatedJSON(contentToParse)
                      parsedResult = tryParseJSON(fixedJSON)
                      
                      if (parsedResult) {
                        console.log('✅ JSON восстановлен успешно')
                        contentToParse = fixedJSON
                      } else {
                        console.log('❌ Не удалось восстановить JSON, используем fallback')
                        // Fallback: создаем минимальную структуру
                        parsedResult = {
                          screenDescription: { screenType: "Неизвестно", confidence: 0 },
                          uxSurvey: { questions: [], overallConfidence: 0 },
                          audience: { targetAudience: "Не удалось загрузить", mainPain: "Ошибка парсинга" },
                          behavior: { userScenarios: {}, behavioralPatterns: "Ошибка парсинга" },
                          problemsAndSolutions: [],
                          selfCheck: { checklist: {}, varietyCheck: {}, confidence: { analysis: 0 } }
                        }
                      }
                    }
                    
                    result = parsedResult
                    console.log('Результат распарсен:', Object.keys(result || {}))
                  } catch (parseError) {
                    console.error('Ошибка парсинга content:', parseError)
                    console.log('Используем оригинальные данные без парсинга')
                    result = audit.result_data
                  }
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
                onShare={createPublicLink}
                publicUrl={publicUrl}
                publicUrlLoading={publicUrlLoading}
              />
            </TabsContent>
            
            <TabsContent value="hypotheses">
              <HypothesesDisplay 
                data={hypothesesData}
                isLoading={hypothesesLoading}
                onGenerate={audit?.status === 'completed' ? generateHypotheses : undefined}
                onShare={createPublicLink}
                publicUrl={publicUrl}
                publicUrlLoading={publicUrlLoading}
              />
            </TabsContent>
            
            <TabsContent value="analytics">
              <BusinessTextDisplay 
                data={businessAnalyticsData}
                isLoading={businessAnalyticsLoading}
                onGenerate={audit?.status === 'completed' ? generateBusinessAnalytics : undefined}
                onShare={createPublicLink}
                publicUrl={publicUrl}
                publicUrlLoading={publicUrlLoading}
              />
            </TabsContent>
          </Tabs>
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
      </div>
    </SidebarDemo>
  )
}