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
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Section } from '@/components/ui/section'
import { HeroSection } from '@/components/ui/hero-section'
import { type ActionType } from '@/lib/utils'
import { ArrowLeft, Download, Share2, Plus } from 'lucide-react'
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
  const [pendingUploadData, setPendingUploadData] = useState<{ url?: string; screenshot?: string } | null>(null)

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

  const handleContextSubmit = async (context: string, uploadData?: { url?: string; screenshot?: string }) => {
    if (!user) return

    const data = uploadData || pendingUploadData
    if (!data) return

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

      // Отправляем запрос на анализ (используем JSON API)
      const response = await fetch('/api/research-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          auditId: audit.id,
          context
        })
      })

      if (!response.ok) {
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
      <PageContent maxWidth="7xl">
        <div className="space-y-8">
          {/* Если пользователь авторизован */}
          {user && !result && (
            <>
              {/* Навигация */}
              <PageHeader 
                title="Быстрый анализ"
                description="Результат будет автоматически сохранен в ваши проекты"
              />

              {/* Hero секция */}
              <HeroSection
                title="UX Анализ с GPT-4"
                description="Профессиональный анализ пользовательского опыта на основе эвристик Нильсена, WCAG 2.2 и современных UX-методологий"
                variant="gradient"
                size="lg"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="flex items-center justify-center w-20 h-20 bg-slate-900 rounded-3xl shadow-lg">
                    <span className="text-3xl">🎯</span>
                  </div>
                </div>
              </HeroSection>

              {/* Форма загрузки */}
              <Section>
                <PageContent maxWidth="2xl">
                  <UploadForm
                    onSubmit={handleUpload}
                    isLoading={isLoading}
                  />
                </PageContent>
              </Section>
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
              <PageHeader 
                title="Результаты анализа"
                description="Детальный отчет по UX-анализу вашего интерфейса"
              >
                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleNewAnalysis}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Новый анализ
                  </Button>
                  
                  <Button variant="outline" className="flex items-center gap-2">
                    <Download className="w-4 h-4" />
                    Скачать отчет
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Share2 className="w-4 h-4" />
                    Поделиться
                  </Button>
                </div>
              </PageHeader>

              {/* Отображение результатов */}
              <Section>
                <AnalysisResult 
                  result={result}
                  screenshot={uploadedScreenshot}
                  url={analysisUrl}
                  auditId={currentAudit || undefined}
                />
              </Section>

              {/* Панель дополнительных действий */}
              <Section>
                <ActionPanel onAction={handleAction} />
              </Section>
            </>
          )}
        </div>
      </PageContent>
    </SidebarDemo>
  )
}