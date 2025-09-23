'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { SidebarDemo } from '@/components/sidebar-demo'
import { UploadForm } from '@/components/upload-form'
import { AnalysisResult } from '@/components/analysis-result'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisModal } from '@/components/analysis-modal'
import { ContextForm } from '@/components/context-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  updateProjectContext,
  updateProjectTargetAudience
} from '@/lib/database'
import { 
  Plus, 
  Trash2,
  ExternalLink,
  BarChart3,
  Eye
} from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { type ActionType } from '@/lib/utils'
import { getAuditDisplayTitle } from '@/lib/audit-utils'

interface Project {
  id: string
  name: string
  description: string | null
  context: string | null
  target_audience: string | null
  created_at: string
}

interface Audit {
  id: string
  name: string
  type: string
  status: string
  input_data: any
  result_data: any
  confidence: number | null
  created_at: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const t = useTranslations()

  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [currentAudit, setCurrentAudit] = useState<Audit | null>(null)
  const [result, setResult] = useState<string | StructuredAnalysisResponse | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [uploadedScreenshot, setUploadedScreenshot] = useState<string | null>(null)
  const [analysisUrl, setAnalysisUrl] = useState<string | null>(null)
  const [showContextForm, setShowContextForm] = useState(false)
  const [pendingUploadData, setPendingUploadData] = useState<{ url?: string; screenshot?: string; provider?: string; openrouterModel?: string } | null>(null)
  const [editContext, setEditContext] = useState('')
  const [editTargetAudience, setEditTargetAudience] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [hasAnyChanges, setHasAnyChanges] = useState(false)

  useEffect(() => {
    checkAuthAndLoadProject()
  }, [projectId])

  const checkAuthAndLoadProject = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/dashboard')
        return
      }

      setUser(user)
      await loadProjectData()
    } catch (error) {
      console.error('Error loading project:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadProjectData = async () => {
    try {
      const [projectData, auditsData] = await Promise.all([
        getProject(projectId),
        getProjectAudits(projectId)
      ])

      if (!projectData) {
        throw new Error('Project not found')
      }

      setProject(projectData)
      setEditContext(projectData.context || '')
      setEditTargetAudience(projectData.target_audience || '')
      setHasAnyChanges(false)
      setAudits(auditsData)
    } catch (error) {
      console.error('Error loading project data:', error)
      throw error
    }
  }

  const handleCreateAudit = async (data: { url?: string; screenshot?: string; context?: string }) => {
    console.log('🚀 handleCreateAudit ВЫЗВАНА!')
    console.log('🚀 Данные:', data)
    console.log('🚀 context:', data.context)
    console.log('🚀 url:', data.url)
    console.log('🚀 screenshot:', !!data.screenshot)
    console.log('🚀 user:', !!user)
    console.log('🚀 project:', !!project)
    
    if (!user || !project) {
      console.log('❌ Ранний выход из handleCreateAudit: нет user или project')
      return
    }

    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)

    console.log('✅ Вызываем handleContextSubmit из handleCreateAudit')
    // Сразу запускаем анализ с контекстом
    await handleContextSubmit(data.context || '', data)
  }

  const handleContextSubmit = async (context: string, uploadData?: { url?: string; screenshot?: string; provider?: string; openrouterModel?: string }) => {
    console.log('🚀 handleContextSubmit ВЫЗВАНА!')
    console.log('🚀 context:', context)
    console.log('🚀 uploadData:', uploadData)
    console.log('🚀 user:', !!user)
    console.log('🚀 project:', !!project)
    
    if (!user || !project) {
      console.log('❌ Ранний выход: нет user или project')
      return
    }

    const data = uploadData || pendingUploadData
    if (!data) {
      console.log('❌ Ранний выход: нет данных')
      return
    }

    console.log('✅ Продолжаем выполнение handleContextSubmit')
    setIsAnalyzing(true)
    setShowContextForm(false)

    try {
      let screenshotUrl: string | null = null
      
      // Загружаем скриншот в Supabase Storage если он есть
      if (data.screenshot) {
        console.log('Uploading screenshot to Supabase Storage...')
        screenshotUrl = await uploadScreenshotFromBase64(data.screenshot, user.id)
        console.log('Screenshot uploaded:', screenshotUrl)
      }

      // ВОССТАНАВЛИВАЕМ НОРМАЛЬНУЮ ЛОГИКУ - БЕЗ ТЕСТОВЫХ ИЗМЕНЕНИЙ
      console.log('🔍 Оригинальные данные:', { url: data.url, screenshot: !!data.screenshot })
      
      // ТЕСТИРУЕМ БЕЗ КОНТЕКСТА - ПОЛНОСТЬЮ ОТКЛЮЧАЕМ
      console.log('🔍 ТЕСТ: ПОЛНОСТЬЮ ОТКЛЮЧАЕМ КОНТЕКСТ ДЛЯ ДИАГНОСТИКИ')
      
      const projectContext = project?.context || ''
      const projectTargetAudience = project?.target_audience || ''
      const auditContext = context || ''
      
      console.log('🔍 КОМПОНЕНТЫ КОНТЕКСТА (отключены):')
      console.log('🔍 projectContext:', projectContext)
      console.log('🔍 projectTargetAudience:', projectTargetAudience)
      console.log('🔍 auditContext:', auditContext)
      
      // ПРИНУДИТЕЛЬНО УБИРАЕМ КОНТЕКСТ
      const combinedContext = ''
      
      console.log('🔍 ИТОГОВЫЙ КОНТЕКСТ ДЛЯ GPT (ОТКЛЮЧЕН):', combinedContext)
      console.log('🔍 Длина контекста:', combinedContext.length, 'символов')

      // Создаем новый аудит с нормальными данными
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

      setCurrentAudit(audit)
      setShowCreateForm(false)

      // Используем API с проверкой кредитов
      console.log('🔍 Отправляем запрос на анализ через /api/research-with-credits')
      console.log('🔍 Данные запроса:', {
        url: data.url,
        hasScreenshot: !!data.screenshot,
        auditId: audit.id,
        context: combinedContext?.substring(0, 100) + '...'
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
          context: combinedContext,
          locale: params.locale
        })
      })
      
      console.log('🔍 Ответ от API:', response.status, response.statusText)

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов:', errorData)
            alert(`Недостаточно кредитов для проведения аудита!\nТребуется: ${errorData.required_credits || 2} кредитов\nДоступно: ${errorData.current_balance || 0} кредитов\n\nПополните баланс кредитов для продолжения.`)
            setIsAnalyzing(false)
            setLoading(false)
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
        //       context: combinedContext
        //     })
        //   })
        //   
        //   if (!fallbackResponse.ok) {
        //     throw new Error(`Ошибка ${fallbackResponse.status}: ${fallbackResponse.statusText}`)
        //   }
        //   
        //   const fallbackData = await fallbackResponse.json()
        //   if (fallbackData.success) {
        //     // Перенаправляем на страницу аудита
        //     router.push(`/audit/${audit.id}`)
        //     return
        //   }
        // }
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const responseData = await response.json()
      
      if (responseData.success) {
        // Перенаправляем на страницу аудита
        window.location.href = `/audit/${audit.id}`
        return
      } else {
        // Fallback на текстовый формат
        const analysisResult = responseData.data || responseData.rawResponse
        setResult(analysisResult)
        
        // Сохраняем результат в базу данных
        console.log('Updating audit result with screenshot URL:', screenshotUrl)
        await updateAuditResult(audit.id, { 
          analysis_result: typeof analysisResult === 'object' ? JSON.stringify(analysisResult) : analysisResult,
          screenshot_url: screenshotUrl 
        })
        
        // Добавляем в историю
        await addAuditHistory(audit.id, 'research', { 
          ...data, 
          screenshotUrl 
        }, { result: typeof analysisResult === 'object' ? JSON.stringify(analysisResult) : analysisResult })
      }

      // Обновляем список аудитов
      await loadProjectData()

    } catch (error) {
      console.error('Error creating audit:', error)
      alert(`Ошибка при создании аудита: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsAnalyzing(false)
      setPendingUploadData(null)
    }
  }

  const handleContextSkip = () => {
    if (pendingUploadData) {
      handleContextSubmit('')
    }
  }


  const handleContextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setEditContext(newValue)
    // Обновляем состояние изменений после изменения контекста
    const targetAudienceChanged = editTargetAudience !== (project?.target_audience || '')
    setHasAnyChanges(newValue !== (project?.context || '') || targetAudienceChanged)
  }

  const handleTargetAudienceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setEditTargetAudience(newValue)
    // Обновляем состояние изменений после изменения целевой аудитории
    const contextChanged = editContext !== (project?.context || '')
    setHasAnyChanges(contextChanged || newValue !== (project?.target_audience || ''))
  }

  const handleSaveAll = async () => {
    if (!project || !hasAnyChanges) return

    setIsUpdating(true)
    try {
      // Сохраняем контекст если изменился
      if (editContext !== (project.context || '')) {
        await updateProjectContext(project.id, editContext)
      }
      
      // Сохраняем целевую аудиторию если изменилась
      if (editTargetAudience !== (project.target_audience || '')) {
        await updateProjectTargetAudience(project.id, editTargetAudience)
      }

      // Обновляем проект
      setProject({ 
        ...project, 
        context: editContext,
        target_audience: editTargetAudience
      })
      setHasAnyChanges(false)
    } catch (error) {
      console.error('Error updating project data:', error)
      alert('Ошибка при обновлении данных проекта')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelAll = () => {
    setEditContext(project?.context || '')
    setEditTargetAudience(project?.target_audience || '')
    setHasAnyChanges(false)
  }

  const handleAction = async (action: ActionType) => {
    if (!currentAudit || !result) return

    setIsAnalyzing(true)
    try {
      // Формируем данные на основе текущего состояния
      const data = {
        url: analysisUrl,
        screenshot: uploadedScreenshot,
        context: result
      }

      const response = await fetch(`/api/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error(`Ошибка ${response.status}: ${response.statusText}`)
      }

      const { result: actionResult } = await response.json()
      
      // Добавляем результат действия к основному результату
      const newResult = typeof result === 'string' 
        ? result + '\n\n---\n\n' + actionResult
        : JSON.stringify(result) + '\n\n---\n\n' + actionResult
      setResult(newResult)

      // Обновляем результат в базе данных
      await updateAuditResult(currentAudit.id, { 
        analysis_result: typeof newResult === 'object' ? JSON.stringify(newResult) : newResult,
        [`${action}_result`]: actionResult 
      })
      
      // Добавляем в историю
      await addAuditHistory(currentAudit.id, action, data, { result: actionResult })

    } catch (error) {
      console.error('Error performing action:', error)
      alert(`Ошибка при выполнении действия: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    } finally {
      setIsAnalyzing(false)
    }
  }


  const handleViewAudit = (audit: Audit) => {
    setCurrentAudit(audit)
    
    // Пытаемся распарсить JSON результат, если не получается - используем как строку
    let analysisResult = audit.result_data?.analysis_result || 'Результат анализа не найден'
    try {
      if (typeof analysisResult === 'string') {
        const parsed = JSON.parse(analysisResult)
        setResult(parsed)
      } else {
        setResult(analysisResult)
      }
    } catch {
      setResult(analysisResult)
    }
    
    // Показываем сохраненный скриншот из Supabase Storage или исходный base64
    const screenshotUrl = audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url
    console.log('Viewing audit:', audit.id)
    console.log('Screenshot URL from input_data:', audit.input_data?.screenshotUrl)
    console.log('Screenshot URL from result_data:', audit.result_data?.screenshot_url)
    console.log('Final screenshot URL:', screenshotUrl)
    
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
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

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
          <Link href={`/${params.locale}/projects`}>
            <BackArrow />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="p-8 space-y-6">
        {/* Хедер проекта */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/${params.locale}/projects`}>
              <BackArrow />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
              {project.description && (
                <p className="text-slate-600 mt-1">{project.description}</p>
              )}
              <p className="text-sm text-slate-500 mt-1">
                Создан {formatDate(project.created_at)}
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {t('projectDetail.newAudit')}
          </Button>
        </div>

        {/* Статистика убрана - отображается только в разделе "Мои проекты" */}

        {/* Основной контент */}
        {!currentAudit ? (
          <>
            {/* Форма создания аудита */}
            {showCreateForm && (
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
            )}

            {/* Двухколоночный макет: История аудитов (слева) + Контекст и Целевая аудитория (справа) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Левая колонка - Список аудитов */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('projectDetail.auditHistory')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {audits.length === 0 ? (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-slate-600 mb-4">
                        В этом проекте пока нет аудитов
                      </p>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Создать первый аудит
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {audits.map((audit) => (
                        <div
                          key={audit.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-slate-900">{getAuditDisplayTitle(audit)}</h3>
                              <Badge className={getStatusColor(audit.status)}>
                                {audit.status === 'completed' ? t('projectDetail.completed') : 
                                 audit.status === 'in_progress' ? t('projectDetail.inProgress') : 
                                 audit.status === 'failed' ? t('projectDetail.failed') : t('projectDetail.draft')}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-600">
                              {formatDate(audit.created_at)}
                              {audit.input_data?.url && (
                                <span className="ml-4 inline-flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {t('projectDetail.urlAnalysis')}
                                </span>
                              )}
                              {audit.input_data?.hasScreenshot && (
                                <span className="ml-4">📸 {t('projectDetail.screenshot')}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Link href={`/audit/${audit.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                {t('projectDetail.view')}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Правая колонка - Контекст проекта и Целевая аудитория */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('projectDetail.contextAndAudience')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Контекст проекта */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">{t('projectDetail.projectContext')}</h4>
                      <textarea
                        value={editContext}
                        onChange={handleContextChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows={4}
                        placeholder="Например: Мобильное приложение для заказа еды. Основные функции: каталог, корзина, оплата, история заказов..."
                      />
                    </div>

                    {/* Разделитель */}
                    <div className="border-t border-gray-200"></div>

                    {/* Целевая аудитория */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">{t('projectDetail.targetAudience')}</h4>
                      <textarea
                        value={editTargetAudience}
                        onChange={handleTargetAudienceChange}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        rows={4}
                        placeholder="Например: Молодые люди 18-35 лет, активные пользователи смартфонов, ценят удобство и скорость, готовы платить за качественный сервис..."
                      />
                    </div>

                    {/* Общая подсказка */}
                    <p className="text-sm text-slate-500">
                      {t('projectDetail.aiHelpText')}
                    </p>

                    {/* Единые кнопки управления */}
                    <div className="flex gap-2 pt-4">
                      <Button
                        onClick={handleSaveAll}
                        disabled={!hasAnyChanges || isUpdating}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isUpdating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : null}
                        {t('common.save')}
                      </Button>
                      {hasAnyChanges && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCancelAll}
                          disabled={isUpdating}
                        >
                          Отмена
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Просмотр аудита */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-900">
                {currentAudit.name}
              </h2>
            </div>

            {/* Результаты анализа */}
            {result && (
              <AnalysisResult 
                result={result}
                screenshot={uploadedScreenshot}
                url={analysisUrl}
                auditId={currentAudit?.id}
              />
            )}

            {/* Панель дополнительных действий */}
            <ActionPanel
              onAction={handleAction}
            />
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

      </div>
    </SidebarDemo>
  )
}