'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { AnalysisModal } from '@/components/analysis-modal'
import { ContextForm } from '@/components/context-form'
import { Auth } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ActionType } from '@/lib/utils'
import { Download, Share2, Plus } from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { User } from '@supabase/supabase-js'
import { createProject, createAudit, updateAuditResult, addAuditHistory, uploadScreenshotFromBase64 } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import Link from 'next/link'
// import { useTranslation } from '@/hooks/use-translation' // Временно отключено

// Функция для проверки и создания профиля пользователя
async function ensureUserProfileAndBalance(user: User) {
  try {
    console.log('🔍 Проверяем профиль для пользователя:', user.email, user.id)
    
    // Проверяем, есть ли профиль
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Ошибка проверки профиля:', profileError)
      return
    }

    // Если профиля нет, создаем его
    if (!profile) {
      console.log('👤 Создаем профиль для Google пользователя:', user.email)
      
      const { error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
        })

      if (createProfileError) {
        console.error('❌ Ошибка создания профиля:', createProfileError)
        return
      }

      console.log('✅ Профиль создан')
    } else {
      console.log('✅ Профиль уже существует')
    }

    // Проверяем, есть ли баланс
    const { data: balance, error: balanceError } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Ошибка проверки баланса:', balanceError)
      return
    }

    // Если баланса нет, создаем его
    if (!balance) {
      console.log('💰 Создаем баланс с 5 кредитами для Google пользователя')
      
      const { error: createBalanceError } = await supabase
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: 5,
          grace_limit_used: false
        })

      if (createBalanceError) {
        console.error('❌ Ошибка создания баланса:', createBalanceError)
        return
      }

      // Создаем транзакцию
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'credit',
          amount: 5,
          balance_after: 5,
          source: 'google_oauth',
          description: 'Google авторизация - начальные 5 кредитов'
        })

      if (transactionError) {
        console.error('❌ Ошибка создания транзакции:', transactionError)
        return
      }

      console.log('✅ Баланс и транзакция созданы для Google пользователя')
    } else {
      console.log('✅ Баланс уже существует:', balance.balance)
    }

  } catch (error) {
    console.error('❌ Ошибка ensureUserProfileAndBalance:', error)
  }
}

export default function DashboardPage() {
  console.log('🔍 DashboardPage компонент загружен')
  
  // Простые переводы без системы
  const currentLanguage = 'ru'
  const t = (key: string, params?: any) => {
    const translations: Record<string, string> = {
      'dashboard.auth.pleaseSignIn': 'Пожалуйста, войдите в систему',
      'dashboard.errors.notEnoughCredits': `Недостаточно кредитов. Требуется: ${params?.required || 2}, доступно: ${params?.available || 0}`,
      'dashboard.welcome.title': 'Добро пожаловать в UX Audit',
      'dashboard.welcome.subtitle': 'Анализируйте пользовательский опыт с помощью ИИ',
      'dashboard.title': 'Быстрый анализ',
      'dashboard.subtitle': 'Загрузите скриншот или URL для анализа',
      'dashboard.hero.title': 'Анализ UX с помощью ИИ',
      'dashboard.hero.description': 'Загрузите скриншот интерфейса или укажите URL сайта для получения детального анализа пользовательского опыта',
      'dashboard.actions.downloadReport': 'Скачать отчет',
      'dashboard.actions.share': 'Поделиться'
    }
    return translations[key] || key
  }
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<string | StructuredAnalysisResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null)
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null)
  const [currentAudit, setCurrentAudit] = useState<string | null>(null)
  const [showContextForm, setShowContextForm] = useState(false)
  const [pendingUploadData, setPendingUploadData] = useState<{ url?: string; screenshot?: string; provider?: string; openrouterModel?: string } | null>(null)

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      
      // Если пользователь есть, проверяем и создаем профиль
      if (user) {
        await ensureUserProfileAndBalance(user)
      }
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
      
      // Если пользователь авторизовался, проверяем и создаем профиль
      if (session?.user) {
        await ensureUserProfileAndBalance(session.user)
      }
    })

    // Проверяем данные из localStorage (с главной страницы) только после загрузки пользователя
    const checkPendingAnalysis = () => {
      const pendingAnalysis = localStorage.getItem('pendingAnalysis')
      if (pendingAnalysis && user) {
        try {
          const data = JSON.parse(pendingAnalysis)
          if (data.type === 'url') {
            setAnalysisUrl(data.data)
            // Автоматически запускаем анализ
            setTimeout(() => {
              handleUpload({ url: data.data })
            }, 1000)
          } else if (data.type === 'screenshot') {
            setUploadedScreenshot(data.data)
            // Автоматически запускаем анализ
            setTimeout(() => {
              handleUpload({ screenshot: data.data })
            }, 1000)
          }
          // Очищаем данные из localStorage
          localStorage.removeItem('pendingAnalysis')
        } catch (error) {
          console.error('Error parsing pending analysis:', error)
        }
      }
    }

    // Проверяем pending analysis после загрузки пользователя
    if (user) {
      checkPendingAnalysis()
    }

    return () => subscription.unsubscribe()
  }, [])

  // Отдельный useEffect для проверки pending analysis при изменении пользователя
  useEffect(() => {
    if (user && !loading) {
      const pendingAnalysis = localStorage.getItem('pendingAnalysis')
      if (pendingAnalysis) {
        try {
          const data = JSON.parse(pendingAnalysis)
          if (data.type === 'url') {
            setAnalysisUrl(data.data)
            // Автоматически запускаем анализ
            setTimeout(() => {
              handleUpload({ url: data.data })
            }, 1000)
          } else if (data.type === 'screenshot') {
            setUploadedScreenshot(data.data)
            // Автоматически запускаем анализ
            setTimeout(() => {
              handleUpload({ screenshot: data.data })
            }, 1000)
          }
          // Очищаем данные из localStorage
          localStorage.removeItem('pendingAnalysis')
        } catch (error) {
          console.error('Error parsing pending analysis:', error)
        }
      }
    }
  }, [user, loading])

  const handleUpload = async (data: { url?: string; screenshot?: string; context?: string }) => {
    console.log('🔍 handleUpload вызвана с данными:', data)
    
    if (!user) {
      console.log('❌ Пользователь не авторизован')
      alert(t('dashboard.auth.pleaseSignIn'))
      return
    }

    console.log('✅ Пользователь авторизован:', user.email)

    // Сохраняем данные для отображения
    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)

    // Сразу запускаем анализ с контекстом
    await handleContextSubmit(data.context || '', data)
  }

  const handleContextSubmit = async (context: string, uploadData?: { url?: string; screenshot?: string; provider?: string; openrouterModel?: string }) => {
    console.log('🔍 handleContextSubmit вызвана с контекстом:', context?.substring(0, 100) + '...')
    console.log('🔍 uploadData:', uploadData)
    
    if (!user) {
      console.log('❌ Пользователь не авторизован в handleContextSubmit')
      return
    }

    const data = uploadData || pendingUploadData
    if (!data) {
      console.log('❌ Нет данных для анализа')
      return
    }

    console.log('✅ Начинаем анализ с данными:', data)
    setIsLoading(true)
    setIsAnalyzing(true)
    setShowContextForm(false)
    try {
      // Создаем временный проект если у пользователя его нет
      const tempProject = await createProject(
        `Быстрый анализ ${new Date().toLocaleDateString('ru-RU')}`,
        'Анализ через Dashboard'
      )

      // Загружаем скриншот в Supabase Storage если есть
      let screenshotUrl = null
      if (data.screenshot) {
        screenshotUrl = await uploadScreenshotFromBase64(data.screenshot, user.id)
      }

      // Создаем новый аудит
      const audit = await createAudit(
        tempProject.id,
        `Анализ ${new Date().toLocaleDateString('ru-RU')} ${new Date().toLocaleTimeString('ru-RU')}`,
        'research',
        {
          url: data.url,
          hasScreenshot: !!data.screenshot,
          screenshotUrl,
          timestamp: new Date().toISOString()
        },
        context
      )

      setCurrentAudit(audit.id)

      // Используем API с кредитами
      console.log('🔍 Отправляем запрос на анализ через /api/research-with-credits')
      console.log('🔍 Данные запроса:', {
        url: data.url,
        hasScreenshot: !!data.screenshot,
        auditId: audit.id,
        context: context?.substring(0, 100) + '...'
      })
      
      // Отправляем запрос на анализ
      const response = await fetch('/api/research-with-credits', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          ...data,
          auditId: audit.id,
          context,
          language: currentLanguage
        })
      })
      
      console.log('🔍 Ответ от API:', response.status, response.statusText)

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов:', errorData)
            alert(t('dashboard.errors.notEnoughCredits', { 
              required: errorData.required || 2, 
              available: errorData.available || 0 
            }))
            setIsAnalyzing(false)
            setIsLoading(false)
            return
          } catch (parseError) {
            console.error('Ошибка парсинга ответа:', parseError)
          }
        }
        
        // ВРЕМЕННО ОТКЛЮЧЕН: Fallback на старый API если экспериментальный не работает
        // if (data.provider === 'openrouter') {
        //   console.log('OpenRouter API не работает, переключаемся на OpenAI...')
        //   const fallbackResponse = await fetch('/api/research-json', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //       url: data.url,
        //       screenshot: data.screenshot,
        //       auditId: audit.id,
        //       context
        //     })
        //   })
        //   
        //   if (!fallbackResponse.ok) {
        //     throw new Error(`Ошибка ${fallbackResponse.status}: ${fallbackResponse.statusText}`)
        //   }
        //   
        //   const fallbackData = await fallbackResponse.json()
        //   if (fallbackData.success) {
        //     setResult(fallbackData.result)
        //     setAnalysisUrl(data.url || '')
        //     setUploadedScreenshot(data.screenshot || '')
        //     setIsAnalyzing(false)
        //     setIsLoading(false)
        //     return
        //   }
        // }
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      if (responseData.success) {
        // Используем структурированные данные
        setResult(responseData.data)
        
        // Также перенаправляем на страницу аудита через 2 секунды
        setTimeout(() => {
          window.location.href = `/audit/${audit.id}`
        }, 2000)
      } else {
        // Fallback на текстовый формат
        setResult(responseData.rawResponse || 'Ошибка анализа')
      }

      // Результат уже сохранен в API endpoint
      console.log('✅ Результат анализа получен и сохранен')
      
      // Добавляем в историю
      await addAuditHistory(audit.id, 'research', data, { result })

    } catch (error) {
      console.error('Error:', error)
      alert(`Ошибка при анализе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
      setIsAnalyzing(false)
      setPendingUploadData(null)
    }
  }

  const handleContextSkip = () => {
    if (pendingUploadData) {
      handleContextSubmit('')
    }
  }

  const handleAction = async (action: ActionType) => {
    if (!result || !currentAudit) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ context: result }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform action')
      }

      const { result: actionResult } = await response.json()
      
      // Добавляем результат действия к основному результату
      const newResult = result + '\n\n---\n\n' + actionResult
      setResult(newResult)

      // Обновляем результат в базе данных
      await updateAuditResult(currentAudit, { 
        // Результат теперь сохраняется в analysis_results
        [`${action}_result`]: actionResult 
      })
      
      // Добавляем в историю
      await addAuditHistory(currentAudit, action, { context: result }, { result: actionResult })

    } catch (error) {
      console.error('Error:', error)
      alert(`Ошибка при выполнении действия: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNewAnalysis = () => {
    setResult(null)
    setCurrentAudit(null)
    setUploadedScreenshot(null)
    setAnalysisUrl(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('dashboard.welcome.title')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('dashboard.welcome.subtitle')}
            </p>
          </div>
          <Auth onAuthChange={setUser} />
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">

        {/* Если пользователь авторизован */}
        {user && !result && (
          <>
            {/* Навигация */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900">{t('dashboard.title')}</h1>
              </div>
              
              <div className="text-sm text-slate-600">
                {t('dashboard.subtitle')}
              </div>
            </div>

            {/* Hero секция */}
            <div className="text-center py-12 px-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-white/20 shadow-soft relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
                
                <h2 className="text-4xl font-bold text-gradient mb-6 leading-tight">
                  {t('dashboard.hero.title')}
                </h2>
                
                <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  {t('dashboard.hero.description')}
                </p>
              </div>
            </div>

            {/* Форма загрузки */}
            <div className="max-w-2xl mx-auto">
              <UploadForm
                onSubmit={handleUpload}
                isLoading={isLoading}
              />
            </div>
          </>
        )}

        {/* Модальное окно прогресса анализа */}
        <AnalysisModal
          isOpen={isAnalyzing}
          onClose={() => setIsAnalyzing(false)}
          screenshot={uploadedScreenshot}
          url={analysisUrl}
          canClose={false}
        />

        {/* Результаты анализа */}
        {user && result && (
          <>
            <div className="flex items-center justify-between">
              <BackArrow onClick={handleNewAnalysis} />
              
              <div className="flex items-center gap-3">
                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t('dashboard.actions.downloadReport')}
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  {t('dashboard.actions.share')}
                </Button>
              </div>
            </div>

            {/* Отображение результатов */}
            <AnalysisResult 
              result={result}
              screenshot={uploadedScreenshot}
              url={analysisUrl}
              auditId={currentAudit || undefined}
            />

            {/* Панель дополнительных действий */}
            <ActionPanel onAction={handleAction} />
          </>
        )}
      </div>
    </SidebarDemo>
  )
}