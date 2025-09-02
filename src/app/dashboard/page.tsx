'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { Auth } from '@/components/auth'
import { Projects } from '@/components/projects'
import { Button } from '@/components/ui/button'
import { TEXTS, type ActionType } from '@/lib/utils'
import { ArrowLeft, Download, Share2, FolderOpen } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { createProject, createAudit, updateAuditResult, addAuditHistory } from '@/lib/database'

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [view, setView] = useState<'auth' | 'projects' | 'analysis'>('auth')
  const [currentProject, setCurrentProject] = useState<string | null>(null)
  const [currentAudit, setCurrentAudit] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null)
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null)

  const handleUpload = async (data: { url?: string; screenshot?: string }) => {
    if (!user || !currentProject) {
      alert('Пожалуйста, выберите проект для сохранения результатов')
      return
    }

    setIsLoading(true)
    try {
      // Сохраняем скриншот и URL для отображения
      if (data.screenshot) {
        setUploadedScreenshot(data.screenshot)
        setAnalysisUrl(null)
      } else if (data.url) {
        setAnalysisUrl(data.url)
        setUploadedScreenshot(null)
      }

      // Создаем аудит в базе данных
      const auditName = data.url ? `Анализ ${data.url}` : 'Анализ скриншота'
      const audit = await createAudit(
        currentProject,
        auditName,
        'research',
        data
      )
      setCurrentAudit(audit.id)

      // Выполняем анализ через API
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...data, auditId: audit.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const { result } = await response.json()
      setResult(result)

      // Сохраняем результат в базу данных
      await updateAuditResult(audit.id, { result }, 85) // примерный confidence
      await addAuditHistory(audit.id, 'research', data, { result })

    } catch (error) {
      console.error(error)
      setResult(TEXTS.error)
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
      setResult(actionResult)

      // Сохраняем действие в историю
      if (currentAudit) {
        await addAuditHistory(currentAudit, action, { context: result }, { result: actionResult })
      }
    } catch (error) {
      console.error('Error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Произошла ошибка при выполнении действия'
      alert(errorMessage + '. Попробуйте еще раз.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAuthChange = (newUser: User | null) => {
    setUser(newUser)
    if (newUser) {
      setView('projects')
    } else {
      setView('auth')
      setCurrentProject(null)
      setCurrentAudit(null)
      setResult(null)
    }
  }

  const handleStartAnalysis = () => {
    if (!currentProject) {
      alert('Сначала создайте проект или выберите существующий')
      return
    }
    setView('analysis')
  }

  return (
    <Layout title="UX Audit Dashboard">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Аутентификация */}
        {view === 'auth' && (
          <div className="max-w-md mx-auto py-12">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">UX Audit Platform</h1>
              <p className="text-slate-600">Войдите для доступа к своим проектам и истории анализов</p>
            </div>
            <Auth onAuthChange={handleAuthChange} />
          </div>
        )}

        {/* Управление проектами */}
        {view === 'projects' && user && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold text-slate-900">UX Audit Platform</h1>
              <Button
                onClick={handleStartAnalysis}
                disabled={!currentProject}
                className="flex items-center gap-2"
              >
                <span>🎯</span>
                Начать анализ
              </Button>
            </div>
            
            {currentProject && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-800">
                  <strong>Выбранный проект:</strong> Результаты анализа будут сохранены в этот проект
                </p>
              </div>
            )}
            
            <Projects 
              user={user} 
              onProjectSelect={(projectId) => setCurrentProject(projectId)} 
            />
          </div>
        )}

        {/* Анализ */}
        {view === 'analysis' && user && (
          <>
            {!result ? (
              <>
                {/* Навигация */}
                <div className="flex items-center justify-between">
                  <Button
                    onClick={() => setView('projects')}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <FolderOpen className="w-4 h-4" />
                    К проектам
                  </Button>
                  {currentProject && (
                    <div className="text-sm text-slate-600">
                      Анализ сохранится в выбранный проект
                    </div>
                  )}
                </div>

                {/* Hero секция */}
                <div className="text-center py-12 px-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl border border-white/20 shadow-soft relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10 animate-pulse"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center mb-6">
                      <div className="flex items-center justify-center w-20 h-20 bg-gradient-primary rounded-3xl shadow-lg">
                        <span className="text-3xl">🎯</span>
                      </div>
                    </div>
                    
                    <h1 className="text-4xl font-bold text-gradient mb-6 leading-tight">
                      UX Анализ с GPT-4
                    </h1>
                    <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                      Профессиональный анализ пользовательского опыта. 
                      Результаты сохранятся в вашем проекте.
                    </p>
                  
                    {/* Ключевые преимущества */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft">
                        <div className="text-3xl mb-3">🎯</div>
                        <h3 className="font-semibold text-slate-800 mb-2">Экспертный анализ</h3>
                        <p className="text-sm text-slate-600">Детальная оценка UX с профессиональными рекомендациями</p>
                      </div>
                      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft">
                        <div className="text-3xl mb-3">⚡</div>
                        <h3 className="font-semibold text-slate-800 mb-2">Быстрый результат</h3>
                        <p className="text-sm text-slate-600">Анализ готов за 2-3 минуты благодаря GPT-4</p>
                      </div>
                      <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft">
                        <div className="text-3xl mb-3">💾</div>
                        <h3 className="font-semibold text-slate-800 mb-2">Сохранение истории</h3>
                        <p className="text-sm text-slate-600">Все анализы сохраняются в вашем проекте</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Форма загрузки */}
                <UploadForm onSubmit={handleUpload} isLoading={isLoading} />
              </>
            ) : (
              <div className="space-y-8 animate-fade-in">
                {/* Заголовок результата */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setView('projects')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <FolderOpen className="w-4 h-4" />
                      К проектам
                    </Button>
                    <Button
                      onClick={() => {
                        setResult(null)
                        setIsLoading(false)
                        setUploadedScreenshot(null)
                        setAnalysisUrl(null)
                        setCurrentAudit(null)
                      }}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Новый анализ
                    </Button>
                  </div>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4 mr-2" />
                      Поделиться
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Скачать PDF
                    </Button>
                  </div>
                </div>

                {/* Результат анализа */}
                <AnalysisResult 
                  result={result}
                  screenshot={uploadedScreenshot}
                  url={analysisUrl}
                />
                
                {/* Панель действий */}
                <ActionPanel onAction={handleAction} />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
