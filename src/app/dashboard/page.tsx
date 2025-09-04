'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { Auth } from '@/components/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { type ActionType } from '@/lib/utils'
import { ArrowLeft, Download, Share2, FolderOpen, Plus } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { createProject, createAudit, updateAuditResult, addAuditHistory, uploadScreenshotFromBase64 } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null)
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null)
  const [currentAudit, setCurrentAudit] = useState<string | null>(null)

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

    return () => subscription.unsubscribe()
  }, [])

  const handleUpload = async (data: { url?: string; screenshot?: string }) => {
    if (!user) {
      alert('Пожалуйста, войдите в систему для выполнения анализа')
      return
    }

    // Сохраняем данные для отображения
    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)

    setIsLoading(true)
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
        }
      )

      setCurrentAudit(audit.id)

      // Отправляем запрос на анализ
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const { result } = await response.json()
      setResult(result)

      // Сохраняем результат в базу данных
      await updateAuditResult(audit.id, { analysis_result: result })
      
      // Добавляем в историю
      await addAuditHistory(audit.id, 'research', data, { result })

    } catch (error) {
      console.error('Error:', error)
      alert(`Ошибка при анализе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsLoading(false)
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
        analysis_result: newResult,
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
      <Layout title="Dashboard">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="UX Audit Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Если пользователь не авторизован */}
        {!user && (
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Добро пожаловать в UX Audit
              </h2>
              <p className="text-slate-600">
                Войдите в систему для начала профессионального анализа пользовательского опыта
              </p>
            </div>
            <Auth onAuthChange={setUser} />
          </div>
        )}

        {/* Если пользователь авторизован */}
        {user && !result && (
          <>
            {/* Навигация */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold text-slate-900">Быстрый анализ</h1>
                <Link href="/projects">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Мои проекты
                  </Button>
                </Link>
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

        {/* Результаты анализа */}
        {user && result && (
          <>
            <div className="flex items-center justify-between">
              <Button
                onClick={handleNewAnalysis}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Новый анализ
              </Button>
              
              <div className="flex items-center gap-3">
                <Link href="/projects">
                  <Button variant="outline" className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Мои проекты
                  </Button>
                </Link>
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
            />

            {/* Панель дополнительных действий */}
            <ActionPanel onAction={handleAction} />
          </>
        )}
      </div>
    </Layout>
  )
}