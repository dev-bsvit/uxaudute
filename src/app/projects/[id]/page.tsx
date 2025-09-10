'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { SidebarDemo } from '@/components/sidebar-demo'
import { UploadForm } from '@/components/upload-form'
import { AnalysisResult } from '@/components/analysis-result'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisModal } from '@/components/analysis-modal'
import { ContextForm } from '@/components/context-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Section } from '@/components/ui/section'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import { 
  getProject, 
  getProjectAudits, 
  createAudit, 
  updateAuditResult, 
  addAuditHistory,
  uploadScreenshotFromBase64,
  updateProjectContext
} from '@/lib/database'
import { 
  ArrowLeft, 
  Plus, 
  Trash2,
  ExternalLink,
  BarChart3,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { type ActionType } from '@/lib/utils'

interface Project {
  id: string
  name: string
  description: string | null
  context: string | null
  created_at: string
}

interface Audit {
  id: string
  name: string
  status: string
  confidence: number | null
  created_at: string
  input_data?: {
    url?: string
    hasScreenshot?: boolean
    screenshotUrl?: string
  } | null
  result_data?: any
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentAudit, setCurrentAudit] = useState<string | null>(null)
  const [result, setResult] = useState<string | StructuredAnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null)
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null)
  const [showEditContext, setShowEditContext] = useState(false)
  const [editContext, setEditContext] = useState('')
  const [isUpdatingContext, setIsUpdatingContext] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/dashboard')
          return
        }

        setUser(user)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/dashboard')
        return
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const loadProjectData = async () => {
    try {
      const projectData = await getProject(projectId)
      if (!projectData) {
        throw new Error('Project not found')
      }

      setProject(projectData)
      const auditsData = await getProjectAudits(projectId)
      setAudits(auditsData)
    } catch (error) {
      console.error('Error loading project data:', error)
      throw error
    }
  }

  const handleCreateAudit = async (data: { url?: string; screenshot?: string; context?: string }) => {
    if (!user || !project) return

    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)
    await handleContextSubmit(data.context || '', data)
  }

  const handleContextSubmit = async (context: string, uploadData?: { url?: string; screenshot?: string }) => {
    if (!user || !project) return

    const data = uploadData
    if (!data) return

    setIsAnalyzing(true)
    try {
      // Загружаем скриншот в Supabase Storage если есть
      let screenshotUrl = null
      if (data.screenshot) {
        screenshotUrl = await uploadScreenshotFromBase64(data.screenshot, user.id)
        console.log('Screenshot uploaded:', screenshotUrl)
      }

      // Объединяем контекст проекта и контекст аудита
      const projectContext = project.context || ''
      const auditContext = context || ''
      const combinedContext = [projectContext, auditContext]
        .filter(Boolean)
        .join('\n\n---\n\n')

      // Создаем новый аудит
      const audit = await createAudit(
        projectId,
        `Анализ ${new Date().toLocaleDateString('ru-RU')}`,
        'research',
        {
          url: data.url,
          hasScreenshot: !!data.screenshot,
          screenshotUrl: screenshotUrl,
          timestamp: new Date().toISOString()
        },
        combinedContext
      )

      setCurrentAudit(audit.id)

      // Отправляем запрос на анализ
      const response = await fetch('/api/research-json', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          auditId: audit.id,
          context: combinedContext
        })
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      if (responseData.success) {
        const analysisResult = responseData.data
        setResult(analysisResult)
        
        // Добавляем в историю
        await addAuditHistory(audit.id, 'research', {
          url: data.url,
          screenshot: data.screenshot,
          screenshotUrl 
        }, { result: typeof analysisResult === 'object' ? JSON.stringify(analysisResult) : analysisResult })
      }

      // Обновляем список аудитов
      const updatedAudits = await getProjectAudits(projectId)
      setAudits(updatedAudits)
      
      setShowCreateForm(false)
      setIsAnalyzing(false)
      setUploadedScreenshot(null)
      setAnalysisUrl(null)
    } catch (error) {
      console.error('Error:', error)
      alert(`Ошибка при анализе: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      setIsAnalyzing(false)
    }
  }

  const handleContextSkip = () => {
    if (uploadedScreenshot || analysisUrl) {
      handleContextSubmit('')
    }
  }

  const handleEditContext = () => {
    setEditContext(project?.context || '')
    setShowEditContext(true)
  }

  const handleUpdateContext = async () => {
    if (!project) return
    setIsUpdatingContext(true)
    try {
      await updateProjectContext(project.id, editContext)
      setProject({ ...project, context: editContext })
      setShowEditContext(false)
      alert('Контекст проекта обновлен')
    } catch (error) {
      console.error('Error updating context:', error)
      alert('Ошибка при обновлении контекста')
    } finally {
      setIsUpdatingContext(false)
    }
  }

  const handleAction = async (action: ActionType) => {
    if (!result || !currentAudit) return
    
    setIsAnalyzing(true)
    try {
      const response = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: analysisUrl,
          screenshot: uploadedScreenshot,
          context: result
        }),
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const { result: actionResult } = await response.json()
      
      // Добавляем результат действия к основному результату
      const newResult = result + '\n\n---\n\n' + actionResult
      setResult(newResult)

      // Обновляем результат в базе данных
      await updateAuditResult(currentAudit, { 
        [`${action}_result`]: actionResult 
      })
      
      // Добавляем в историю
      await addAuditHistory(currentAudit, action, { context: result }, { result: actionResult })

    } catch (error) {
      console.error('Error:', error)
      alert(`Ошибка при выполнении действия: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAuditClick = async (audit: Audit) => {
    try {
      const analysisResult = audit.result_data
      if (analysisResult) {
        setResult(analysisResult)
        setCurrentAudit(audit.id)
        
        // Показываем сохраненный скриншот из Supabase Storage или исходный base64
        const screenshotUrl = audit.input_data?.screenshotUrl
        setUploadedScreenshot(screenshotUrl || null)
        setAnalysisUrl(audit.input_data?.url || null)
      }
    } catch {
      setResult(audit.result_data)
    }
    
    // Показываем сохраненный скриншот из Supabase Storage или исходный base64
    const screenshotUrl = audit.input_data?.screenshotUrl
    setUploadedScreenshot(screenshotUrl || null)
    setAnalysisUrl(audit.input_data?.url || null)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  useEffect(() => {
    if (user && projectId) {
      loadProjectData().catch(console.error)
    }
  }, [user, projectId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!project || !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center py-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Проект не найден</h2>
          <Link href="/projects">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              К проектам
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <PageContent maxWidth="7xl">
        <div className="space-y-8">
          {/* Хедер проекта */}
          <PageHeader 
            title={project.name}
            description={project.description || `Создан ${formatDate(project.created_at)}`}
          >
            <Link href="/projects">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                К проектам
              </Button>
            </Link>
          </PageHeader>
          
          {/* Контекст проекта */}
          <Section>
            {project.context && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm text-blue-900">Контекст проекта</CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditContext}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Редактировать
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800">{project.context}</p>
                </CardContent>
              </Card>
            )}
            
            {!project.context && (
              <Card className="border-gray-200 bg-gray-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm text-gray-700">Контекст проекта не указан</CardTitle>
                      <p className="text-xs text-gray-500 mt-1">Добавьте контекст для более точного анализа</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditContext}
                    >
                      Добавить контекст
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            )}
          </Section>
          
          {/* Кнопка создания аудита */}
          <Section>
            <div className="flex justify-end">
              <Button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Новый аудит
              </Button>
            </div>
          </Section>

          {/* Основной контент */}
          {!currentAudit ? (
            <>
              {/* Форма создания аудита */}
              {showCreateForm && (
                <Section>
                  <Card>
                    <CardHeader>
                      <CardTitle>Создать новый аудит</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <UploadForm
                        onSubmit={handleCreateAudit}
                        isLoading={isAnalyzing}
                      />
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="outline"
                          onClick={() => setShowCreateForm(false)}
                        >
                          Отмена
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Section>
              )}

              {/* Список аудитов */}
              <Section>
                <Card>
                  <CardHeader>
                    <CardTitle>История аудитов</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audits.length === 0 ? (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Нет аудитов</h3>
                        <p className="text-slate-600 mb-4">Создайте первый аудит для этого проекта</p>
                        <Button onClick={() => setShowCreateForm(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Создать аудит
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {audits.map((audit) => (
                          <div
                            key={audit.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                            onClick={() => handleAuditClick(audit)}
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-medium text-slate-900">{audit.name}</h3>
                                <Badge className={getStatusColor(audit.status)}>
                                  {audit.status === 'completed' ? 'Завершен' : 
                                   audit.status === 'in_progress' ? 'В процессе' : 
                                   audit.status === 'failed' ? 'Ошибка' : 'Черновик'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {formatDate(audit.created_at)}
                                {audit.input_data?.url && (
                                  <span className="ml-4 inline-flex items-center gap-1">
                                    <ExternalLink className="w-3 h-3" />
                                    URL анализ
                                  </span>
                                )}
                                {audit.input_data?.hasScreenshot && (
                                  <span className="ml-4">📸 Скриншот</span>
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  // TODO: Добавить функциональность редактирования
                                }}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Section>
            </>
          ) : (
            <>
              {/* Результаты анализа */}
              <Section>
                <div className="flex items-center justify-between mb-6">
                  <Button
                    onClick={() => {
                      setCurrentAudit(null)
                      setResult(null)
                      setUploadedScreenshot(null)
                      setAnalysisUrl(null)
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    К проекту
                  </Button>
                </div>
                
                {result && (
                  <AnalysisResult 
                    result={result}
                    screenshot={uploadedScreenshot}
                    url={analysisUrl}
                    auditId={currentAudit}
                  />
                )}
              </Section>

              {/* Панель дополнительных действий */}
              <Section>
                <ActionPanel onAction={handleAction} />
              </Section>
            </>
          )}

          {/* Модальное окно редактирования контекста */}
          {showEditContext && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Редактировать контекст проекта</h3>
                <textarea
                  value={editContext}
                  onChange={(e) => setEditContext(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={6}
                  placeholder="Например: Мобильное приложение для заказа еды. Основная аудитория - молодые люди 18-35 лет. Ключевые цели: быстрое оформление заказа, удобная навигация по меню, прозрачная система оплаты..."
                />
                <p className="text-sm text-slate-500 mt-2">
                  Этот контекст будет применяться ко всем аудитам в проекте
                </p>
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleUpdateContext}
                    disabled={isUpdatingContext}
                    className="flex items-center gap-2"
                  >
                    {isUpdatingContext ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : null}
                    Сохранить
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditContext(false)}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Модальное окно прогресса анализа */}
          <AnalysisModal
            isOpen={isAnalyzing}
            onClose={() => setIsAnalyzing(false)}
            screenshot={uploadedScreenshot}
            url={analysisUrl}
            canClose={false}
          />
        </div>
      </PageContent>
    </SidebarDemo>
  )
}
