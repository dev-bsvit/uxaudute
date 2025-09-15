'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { AnalysisModal } from '@/components/analysis-modal'
import { ContextForm } from '@/components/context-form'
import { Auth } from '@/components/auth'
import InsufficientCreditsModal from '@/components/InsufficientCreditsModal'
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

export default function DashboardPage() {
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
  const [showInsufficientCredits, setShowInsufficientCredits] = useState(false)
  const [creditsError, setCreditsError] = useState<{ required: number; available: number } | null>(null)

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
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
    if (!user) {
      alert('Пожалуйста, войдите в систему для выполнения анализа')
      return
    }

    // Сохраняем данные для отображения
    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)

    // Сразу запускаем анализ с контекстом
    await handleContextSubmit(data.context || '', data)
  }

  const handleContextSubmit = async (context: string, uploadData?: { url?: string; screenshot?: string; provider?: string; openrouterModel?: string }) => {
    if (!user) return

    const data = uploadData || pendingUploadData
    if (!data) return

    setIsLoading(true)
    setIsAnalyzing(true)
    setShowContextForm(false)
    
    // Выбираем API endpoint в зависимости от провайдера и модели
    const apiEndpoint = data.provider === 'openrouter' && data.openrouterModel === 'sonoma' 
      ? '/api/research-sonoma'
      : data.provider === 'openrouter' 
      ? '/api/research-stable'
      : '/api/research-json'
    
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
      
      // Отправляем запрос на анализ
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          auditId: audit.id,
          context,
          userId: user.id // Передаем ID пользователя для проверки кредитов
        })
      })

      if (!response.ok) {
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
      
      // Проверяем, является ли это ошибкой недостатка кредитов
      if (error instanceof Error && error.message.includes('402')) {
        try {
          // Пытаемся получить детали ошибки из response
          const errorResponse = await fetch(apiEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              url: data.url, 
              context, 
              userId: user.id 
            })
          })
          
          if (errorResponse.status === 402) {
            const errorData = await errorResponse.json()
            setCreditsError({
              required: errorData.required || 2,
              available: errorData.available || 0
            })
            setShowInsufficientCredits(true)
            return
          }
        } catch (fetchError) {
          console.error('Error fetching error details:', fetchError)
        }
        
        // Fallback если не удалось получить детали
        setCreditsError({ required: 2, available: 0 })
        setShowInsufficientCredits(true)
      } else {
        alert(`Ошибка при анализе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
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
              Добро пожаловать в UX Audit
            </h2>
            <p className="text-lg text-slate-600">
              Войдите в систему для начала профессионального анализа пользовательского опыта
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
                <h1 className="text-3xl font-bold text-slate-900">Быстрый анализ</h1>
              </div>
              
              <div className="text-sm text-slate-600">
                Результат будет автоматически сохранен в ваши проекты
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
                  UX Анализ с GPT-4
                </h2>
                
                <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                  Профессиональный анализ пользовательского опыта на основе эвристик Нильсена, WCAG 2.2 и современных UX-методологий
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
                  Скачать отчет
                </Button>
                <Button variant="outline" className="flex items-center gap-2">
                  <Share2 className="w-4 h-4" />
                  Поделиться
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

        {/* Модальное окно недостатка кредитов */}
        {creditsError && (
          <InsufficientCreditsModal
            isOpen={showInsufficientCredits}
            onClose={() => {
              setShowInsufficientCredits(false)
              setCreditsError(null)
            }}
            required={creditsError.required}
            available={creditsError.available}
            onPurchaseComplete={() => {
              setShowInsufficientCredits(false)
              setCreditsError(null)
            }}
          />
        )}
      </div>
    </SidebarDemo>
  )
}