'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { Auth } from '@/components/auth'
import { Projects } from '@/components/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TEXTS, type ActionType } from '@/lib/utils'
import { ArrowLeft, Download, Share2, FolderOpen } from 'lucide-react'
import { User } from '@supabase/supabase-js'
import { createProject, createAudit, updateAuditResult, addAuditHistory } from '@/lib/database'

export default function HomePage() {
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
    <Layout title="UX Audit - Главная">
      <div className="max-w-5xl mx-auto space-y-8">
        {!result ? (
          <>
            {/* Красивая вводная секция */}
            <div className="text-center mb-12 animate-slide-up">
              <h1 className="text-5xl font-bold text-gradient mb-6">
                UX Audit Platform
              </h1>
              <p className="text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                Получите профессиональный анализ пользовательского опыта 
                с помощью искусственного интеллекта
              </p>
              
              {/* Ключевые преимущества */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft animate-slide-up" style={{animationDelay: '0.1s'}}>
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="font-semibold text-slate-800 mb-2">Экспертный анализ</h3>
                  <p className="text-sm text-slate-600">Детальная оценка UX с профессиональными рекомендациями</p>
                </div>
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft animate-slide-up" style={{animationDelay: '0.2s'}}>
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="font-semibold text-slate-800 mb-2">Быстрый результат</h3>
                  <p className="text-sm text-slate-600">Анализ готов за 2-3 минуты благодаря GPT-4</p>
                </div>
                <div className="p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-white/20 shadow-soft animate-slide-up" style={{animationDelay: '0.3s'}}>
                  <div className="text-3xl mb-3">💾</div>
                  <h3 className="font-semibold text-slate-800 mb-2">Сохранение данных</h3>
                  <p className="text-sm text-slate-600">Все анализы сохраняются в ваших проектах</p>
                </div>
              </div>

              {/* CTA кнопки */}
              <div className="flex gap-4 justify-center mt-12">
                <Button
                  onClick={() => window.location.href = '/dashboard'}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <span>🚀</span>
                  Перейти к платформе
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    // Сброс всех состояний для demo режима
                    setResult(null)
                    setUploadedScreenshot(null)
                    setAnalysisUrl(null)
                    // Показываем форму загрузки
                  }}
                >
                  Попробовать демо
                </Button>
              </div>
            </div>

            {/* Форма загрузки (демо режим) */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <p className="text-yellow-800 text-center">
                <strong>Демо режим:</strong> Результаты не будут сохранены. 
                <a href="/dashboard" className="text-blue-600 hover:underline ml-1">
                  Перейдите к платформе
                </a> для полного функционала.
              </p>
            </div>
            <UploadForm onSubmit={handleUpload} isLoading={isLoading} />
          </>
        ) : (
          <div className="space-y-8 animate-fade-in">
            {/* Заголовок результата */}
            <div className="flex items-center justify-between mb-8">
              <Button
                onClick={() => {
                  setResult(null)
                  setIsLoading(false)
                  setUploadedScreenshot(null)
                  setAnalysisUrl(null)
                }}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Новый анализ
              </Button>
              
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
      </div>
    </Layout>
  )
}

