'use client'

import { useEffect, useRef, useState } from 'react'
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
import { ImageUpload } from '@/components/ui/image-upload'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
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
  updateProjectTargetAudience,
  updateAuditName,
  deleteAudit,
  getProjectSurveys,
  deleteSurvey
} from '@/lib/database'
import type { Survey } from '@/types/survey'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import {
  Plus,
  ExternalLink,
  BarChart3,
  Eye,
  Settings,
  Share2,
  Trash2,
  MoreVertical,
  Link as LinkIcon,
  Upload,
  Sparkles,
  TestTube2,
  Lightbulb,
  TrendingUp,
  Info,
  FileText
} from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { type ActionType } from '@/lib/utils'
import { PageHeader } from '@/components/page-header'
import { FolderOpen } from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  context: string | null
  target_audience: string | null
  type?: 'audit' | 'survey' // Опциональное поле для обратной совместимости
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

// Функция для обрезания длинного названия на основе screenType
function truncateScreenType(screenType: string, maxWords: number = 3): string {
  if (!screenType || screenType.trim() === '') {
    return ''
  }

  const words = screenType.trim().split(/\s+/)
  if (words.length <= maxWords) {
    return screenType
  }

  return words.slice(0, maxWords).join(' ') + '...'
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string
  const { t, currentLanguage } = useTranslation()
  const { formatDateTime, formatDate } = useFormatters()
  const unknownErrorMessage = t('common.unknown') || (currentLanguage === 'en' ? 'Unknown error' : 'Неизвестная ошибка')

  const [user, setUser] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [audits, setAudits] = useState<Audit[]>([])
  const [surveys, setSurveys] = useState<Survey[]>([])
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
  const [showSettingsModal, setShowSettingsModal] = useState(false)

  // New audit form state
  const [activeTab, setActiveTab] = useState<'screenshot' | 'url' | 'figma'>('screenshot')
  const [auditUrl, setAuditUrl] = useState('')
  const [auditScreenshot, setAuditScreenshot] = useState<File | null>(null)
  const [auditContext, setAuditContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [selectedAuditTypes, setSelectedAuditTypes] = useState({
    uxAnalysis: true,
    abTest: false,
    hypotheses: false,
    businessAnalytics: false
  })
  const createAuditFormRef = useRef<HTMLFormElement>(null)

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
      const projectData = await getProject(projectId)

      if (!projectData) {
        throw new Error('Project not found')
      }

      setProject(projectData)
      setEditContext(projectData.context || '')
      setEditTargetAudience(projectData.target_audience || '')
      setHasAnyChanges(false)

      // Загружаем либо аудиты либо опросы в зависимости от типа проекта
      // Используем безопасный доступ к полю type
      const projectType = (projectData as any).type as 'audit' | 'survey' | undefined
      console.log('🔍 Тип проекта:', projectType)

      if (!projectType || projectType === 'audit') {
        const auditsData = await getProjectAudits(projectId)
        console.log('📊 Загружено аудитов:', auditsData.length)
        setAudits(auditsData)

        // Также проверяем, нет ли случайно опросов в audit проекте
        const surveysData = await getProjectSurveys(projectId)
        console.log('⚠️ Обнаружено опросов в audit проекте:', surveysData.length)
        if (surveysData.length > 0) {
          console.warn('⚠️ ВНИМАНИЕ: В проекте типа audit найдены опросы! Это ошибка данных.')
          setSurveys(surveysData)
        }
      } else if (projectType === 'survey') {
        const surveysData = await getProjectSurveys(projectId)
        console.log('📋 Загружено опросов:', surveysData.length)
        setSurveys(surveysData)

        // Также проверяем, нет ли случайно аудитов в survey проекте
        const auditsData = await getProjectAudits(projectId)
        console.log('⚠️ Обнаружено аудитов в survey проекте:', auditsData.length)
        if (auditsData.length > 0) {
          console.warn('⚠️ ВНИМАНИЕ: В проекте типа survey найдены аудиты! Это ошибка данных.')
          setAudits(auditsData)
        }
      }
    } catch (error) {
      console.error('Error loading project data:', error)
      throw error
    }
  }

  const handleCreateAudit = async (data: { url?: string; screenshot?: string; context?: string }) => {
    if (!user || !project) return

    setUploadedScreenshot(data.screenshot || null)
    setAnalysisUrl(data.url || null)

    // Сразу запускаем анализ с контекстом и выбранными типами
    await handleContextSubmit(data.context || '', data, selectedAuditTypes)
  }

  const handleContextSubmit = async (
    context: string,
    uploadData?: { url?: string; screenshot?: string; provider?: string; openrouterModel?: string },
    auditTypes?: typeof selectedAuditTypes
  ) => {
    if (!user || !project) return

    const data = uploadData || pendingUploadData
    if (!data) return

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

      // Объединяем контекст проекта, целевую аудиторию и контекст аудита
      const projectContext = project?.context || ''
      const projectTargetAudience = project?.target_audience || ''
      const auditContext = context || ''
      const combinedContext = [projectContext, projectTargetAudience, auditContext]
        .filter(Boolean)
        .join('\n\n---\n\n')

      // Создаем новый аудит с URL скриншота
      const currentDateLabel = formatDate(new Date())
      const fallbackAuditName = currentLanguage === 'en'
        ? `Analysis ${currentDateLabel}`
        : `Анализ ${currentDateLabel}`
      const auditName = t('projects.detail.analysis.defaultName', { date: currentDateLabel }) || fallbackAuditName

      const audit = await createAudit(
        projectId,
        auditName,
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

      // Вычисляем требуемые кредиты на основе выбранных типов
      const types = auditTypes || selectedAuditTypes
      const requiredCredits = 2 +
        (types.abTest ? 1 : 0) +
        (types.hypotheses ? 1 : 0) +
        (types.businessAnalytics ? 1 : 0)

      console.log('🔍 Выбранные типы анализа:', types)
      console.log('🔍 Требуется кредитов:', requiredCredits)

      // Используем API с проверкой кредитов
      console.log('🔍 Отправляем запрос на анализ через /api/research-with-credits')
      console.log('🔍 Данные запроса:', {
        url: data.url,
        hasScreenshot: !!data.screenshot,
        auditId: audit.id,
        context: combinedContext?.substring(0, 100) + '...',
        requiredCredits
      })

      // Отправляем запрос на анализ с указанием требуемых кредитов
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
          language: currentLanguage,
          requiredCredits // Передаём требуемое количество кредитов
        })
      })
      
      console.log('🔍 Ответ от API:', response.status, response.statusText)

      if (!response.ok) {
        // Проверяем, является ли это ошибкой недостатка кредитов (402)
        if (response.status === 402) {
          try {
            const errorData = await response.json()
            console.log('❌ Недостаточно кредитов:', errorData)
            const requiredCredits = String(errorData.required_credits ?? 2)
            const availableCredits = String(errorData.current_balance ?? 0)
            const insufficientCreditsMessage = t('projects.detail.alerts.insufficientCredits', {
              required: requiredCredits,
              available: availableCredits
            }) || (currentLanguage === 'en'
              ? `Not enough credits to run the audit!\nRequired: ${requiredCredits} credits\nAvailable: ${availableCredits} credits\n\nPlease top up your credit balance to continue.`
              : `Недостаточно кредитов для проведения аудита!\nТребуется: ${requiredCredits} кредитов\nДоступно: ${availableCredits} кредитов\n\nПополните баланс кредитов для продолжения.`)

            alert(insufficientCreditsMessage)
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
        // Попытка обновить название аудита на основе screenType
        try {
          const analysisData = responseData.data
          if (analysisData && typeof analysisData === 'object') {
            // Извлекаем screenType из результата
            const screenType = analysisData.screenDescription?.screenType ||
                               analysisData.interface_analysis?.screen_type ||
                               null

            if (screenType && typeof screenType === 'string' && screenType.trim() !== '') {
              const newAuditName = truncateScreenType(screenType)
              console.log('Обновляем название аудита:', newAuditName)
              await updateAuditName(audit.id, newAuditName)
            } else {
              console.log('screenType не найден в результате анализа')
            }
          }
        } catch (nameUpdateError) {
          console.error('Ошибка обновления названия аудита:', nameUpdateError)
          // Не прерываем работу, продолжаем с исходным названием
        }

        // Запускаем дополнительные анализы ПОСЛЕДОВАТЕЛЬНО (не параллельно!)
        // Это предотвращает race condition при сохранении в result_data
        const types = auditTypes || selectedAuditTypes
        console.log('🔍 Проверяем выбранные типы анализа:', types)

        const session = await supabase.auth.getSession()
        const token = session.data.session?.access_token

        try {
          // 1) AB тест (если выбран)
          if (types.abTest) {
            console.log('🚀 Запуск AB теста')
            const abRes = await fetch('/api/ab-test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                auditId: audit.id,
                language: currentLanguage
              })
            })
            if (abRes.ok) {
              const abData = await abRes.json()
              console.log('✅ AB тест завершен успешно')
            } else {
              const error = await abRes.text()
              console.error('❌ Ошибка AB теста:', abRes.status, error)
            }
          }

          // 2) Гипотезы (если выбраны)
          if (types.hypotheses) {
            console.log('🚀 Запуск гипотез')
            const hypRes = await fetch('/api/hypotheses', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                auditId: audit.id,
                language: currentLanguage
              })
            })
            if (hypRes.ok) {
              const hypData = await hypRes.json()
              console.log('✅ Гипотезы созданы успешно')
            } else {
              const error = await hypRes.text()
              console.error('❌ Ошибка создания гипотез:', hypRes.status, error)
            }
          }

          // 3) Бизнес-аналитика (если выбрана)
          if (types.businessAnalytics) {
            console.log('🚀 Запуск бизнес-аналитики')
            const bizRes = await fetch('/api/business-analytics', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                auditId: audit.id,
                language: currentLanguage
              })
            })
            if (bizRes.ok) {
              const bizData = await bizRes.json()
              console.log('✅ Бизнес-аналитика завершена успешно')
            } else {
              const error = await bizRes.text()
              console.error('❌ Ошибка бизнес-аналитики:', bizRes.status, error)
            }
          }

          console.log('✅ Все дополнительные анализы завершены, перенаправляем на результат')
          window.location.href = `/audit/${audit.id}`
          return
        } catch (err) {
          console.error('❌ Ошибка при выполнении дополнительных анализов:', err)
          // Даже при ошибке перенаправляем на результат
          window.location.href = `/audit/${audit.id}`
          return
        }

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
      const errorMessage = error instanceof Error && error.message ? error.message : unknownErrorMessage
      const createAuditErrorMessage = t('projects.detail.alerts.createAuditError', { error: errorMessage }) || (currentLanguage === 'en'
        ? `Error creating audit: ${errorMessage}`
        : `Ошибка при создании аудита: ${errorMessage}`)
      alert(createAuditErrorMessage)
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
      const updateErrorMessage = t('projects.detail.alerts.updateProjectError') || (currentLanguage === 'en'
        ? 'Error updating project data'
        : 'Ошибка при обновлении данных проекта')
      alert(updateErrorMessage)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelAll = () => {
    setEditContext(project?.context || '')
    setEditTargetAudience(project?.target_audience || '')
    setHasAnyChanges(false)
  }

  const handleDeleteAudit = async (auditId: string) => {
    try {
      await deleteAudit(auditId)
      // Перезагружаем список аудитов после удаления
      await loadProjectData()
      const successMessage = t('projects.detail.alerts.deleteSuccess') || (currentLanguage === 'en'
        ? 'Audit deleted successfully'
        : 'Аудит успешно удалён')
      alert(successMessage)
    } catch (error) {
      console.error('Error deleting audit:', error)
      const errorMessage = error instanceof Error ? error.message : unknownErrorMessage
      const deleteErrorMessage = t('projects.detail.alerts.deleteError', { error: errorMessage }) || (currentLanguage === 'en'
        ? `Error deleting audit: ${errorMessage}`
        : `Ошибка при удалении аудита: ${errorMessage}`)
      alert(deleteErrorMessage)
    }
  }

  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      await deleteSurvey(surveyId)
      // Перезагружаем список опросов после удаления
      await loadProjectData()
      const successMessage = currentLanguage === 'en' ? 'Survey deleted successfully' : 'Опрос успешно удалён'
      alert(successMessage)
    } catch (error) {
      console.error('Error deleting survey:', error)
      const errorMessage = error instanceof Error ? error.message : unknownErrorMessage
      const deleteErrorMessage = currentLanguage === 'en'
        ? `Error deleting survey: ${errorMessage}`
        : `Ошибка при удалении опроса: ${errorMessage}`
      alert(deleteErrorMessage)
    }
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
      const errorMessage = error instanceof Error && error.message ? error.message : unknownErrorMessage
      const actionErrorMessage = t('projects.detail.alerts.actionError', { error: errorMessage }) || (currentLanguage === 'en'
        ? `Error performing action: ${errorMessage}`
        : `Ошибка при выполнении действия: ${errorMessage}`)
      alert(actionErrorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }


  const handleViewAudit = (audit: Audit) => {
    setCurrentAudit(audit)
    
    // Пытаемся распарсить JSON результат, если не получается - используем как строку
    const noResultMessage = t('projects.detail.analysis.noResult') || (currentLanguage === 'en'
      ? 'Analysis result not found'
      : 'Результат анализа не найден')
    let analysisResult = audit.result_data?.analysis_result || noResultMessage
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



  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return t('projects.detail.history.status.completed') || (currentLanguage === 'en' ? 'Completed' : 'Завершен')
      case 'in_progress':
        return t('projects.detail.history.status.in_progress') || (currentLanguage === 'en' ? 'In progress' : 'В процессе')
      case 'failed':
        return t('projects.detail.history.status.failed') || (currentLanguage === 'en' ? 'Error' : 'Ошибка')
      default:
        return t('projects.detail.history.status.draft') || (currentLanguage === 'en' ? 'Draft' : 'Черновик')
    }
  }

  // Функция для подсчёта выполненных типов анализов в аудите
  const getAuditProgress = (audit: Audit) => {
    let completedTypes = 0
    const totalTypes = 4 // Всего 4 типа: audit, abtest, hypothesis, analytics

    // Проверяем наличие каждого типа анализа в result_data
    if (audit.result_data) {
      console.log(`🔍 Проверяем аудит ${audit.name}:`)
      console.log('Все ключи в result_data:', Object.keys(audit.result_data))
      console.log('analysis_result:', audit.result_data.analysis_result)
      console.log('ab_tests:', audit.result_data.ab_tests)
      console.log('hypotheses:', audit.result_data.hypotheses)
      console.log('business_analytics:', audit.result_data.business_analytics)

      // 1. Основной аудит - проверяем наличие любого из ключей базового аудита
      const hasBaseAudit = audit.result_data.screenDescription ||
                           audit.result_data.problemsAndSolutions ||
                           audit.result_data.uxSurvey ||
                           audit.result_data.behavior ||
                           audit.result_data.audience ||
                           audit.result_data.analysis_result

      if (hasBaseAudit) {
        console.log('✅ Основной аудит засчитан')
        completedTypes++
      }
      // 2. A/B тесты - проверяем что это массив или объект с данными
      if (audit.result_data.ab_tests &&
          (Array.isArray(audit.result_data.ab_tests)
            ? audit.result_data.ab_tests.length > 0
            : typeof audit.result_data.ab_tests === 'object' && Object.keys(audit.result_data.ab_tests).length > 0)) {
        console.log('✅ A/B тесты засчитаны')
        completedTypes++
      }
      // 3. Гипотезы - проверяем что это массив или объект с данными
      if (audit.result_data.hypotheses &&
          (Array.isArray(audit.result_data.hypotheses)
            ? audit.result_data.hypotheses.length > 0
            : typeof audit.result_data.hypotheses === 'object' && Object.keys(audit.result_data.hypotheses).length > 0)) {
        console.log('✅ Гипотезы засчитаны')
        completedTypes++
      }
      // 4. Бизнес аналитика - проверяем что это объект с данными
      if (audit.result_data.business_analytics &&
          typeof audit.result_data.business_analytics === 'object' &&
          Object.keys(audit.result_data.business_analytics).length > 0) {
        console.log('✅ Бизнес аналитика засчитана')
        completedTypes++
      }

      console.log(`📊 Итого: ${completedTypes}/4`)
    }

    const percentage = (completedTypes / totalTypes) * 100
    return {
      completed: completedTypes,
      total: totalTypes,
      percentage
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
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            {t('projects.detail.notFoundTitle') || (currentLanguage === 'en' ? 'Project not found' : 'Проект не найден')}
          </h2>
          <BackArrow onClick={() => router.push('/projects')} />
        </div>
      </div>
    )
  }

  const additionalCredits =
    (selectedAuditTypes.abTest ? 1 : 0) +
    (selectedAuditTypes.hypotheses ? 1 : 0) +
    (selectedAuditTypes.businessAnalytics ? 1 : 0)
  const totalCredits = 2 + additionalCredits
  const submitButtonLabel =
    currentLanguage === 'en' ? 'Start analysis' : 'Начать анализ'
  const isSubmitDisabled =
    isAnalyzing ||
    (activeTab === 'screenshot' && !auditScreenshot) ||
    (activeTab === 'url' && !auditUrl) ||
    activeTab === 'figma'
  const creditsLabel =
    currentLanguage === 'en'
      ? `${totalCredits} ${totalCredits === 1 ? 'credit' : 'credits'}`
      : `${totalCredits} ${
          totalCredits % 10 === 1 && totalCredits % 100 !== 11
            ? 'кредит'
            : [2, 3, 4].includes(totalCredits % 10) && ![12, 13, 14].includes(totalCredits % 100)
            ? 'кредита'
            : 'кредитов'
        }`

  return (
    <SidebarDemo user={user}>
      <div className="space-y-6">
        {/* Хедер проекта */}
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Мои проекты', href: '/projects' },
              { label: project.name }
            ]}
            title={project.name}
            subtitle={
              project.description
                ? project.description
                : (t('projects.detail.createdAt', { date: formatDate(project.created_at) }) ||
                    (currentLanguage === 'en'
                      ? `Created ${formatDate(project.created_at)}`
                      : `Создан ${formatDate(project.created_at)}`))
            }
            showBackButton={true}
            onBack={() => router.push('/projects')}
            secondaryButton={{
              icon: <Settings className="w-5 h-5 text-[#222222]" />,
              onClick: () => setShowSettingsModal(true)
          }}
          primaryButton={
            // Для audit проектов показываем кнопку "Новый аудит"
            (!project?.type || project?.type === 'audit') ? (
              showCreateForm
                ? {
                    label: submitButtonLabel,
                    onClick: () => createAuditFormRef.current?.requestSubmit(),
                    disabled: isSubmitDisabled
                  }
                : {
                    label:
                      t('projects.detail.newAudit') ||
                      (currentLanguage === 'en' ? 'New audit' : 'Новый аудит'),
                    onClick: () => setShowCreateForm(true)
                  }
            ) : (
              // Для survey проектов показываем кнопку "Новый опрос"
              project?.type === 'survey' ? {
                label: currentLanguage === 'en' ? 'New Survey' : 'Новый опрос',
                onClick: () => router.push(`/projects/${projectId}/create-survey`)
              } : undefined
            )
          }
          />
        </div>

        <div className="px-8 space-y-6">

        {/* Основной контент */}
        {!currentAudit ? (
          <>
            {/* Форма создания аудита - показываем только для audit проектов (или если тип не указан) */}
            {showCreateForm && (!project?.type || project?.type === 'audit') && (
              <div className="w-full rounded-2xl bg-white p-8">
                <form
                  ref={createAuditFormRef}
                  onSubmit={(e) => {
                    e.preventDefault()
                    console.log('🔍 Отправка формы с выбранными типами:', selectedAuditTypes)

                    const contextSections: string[] = []
                    if (auditContext?.trim()) {
                      contextSections.push(auditContext.trim())
                    }
                    if (targetAudience?.trim()) {
                      contextSections.push(targetAudience.trim())
                    }
                    const combinedContext = contextSections.join('\n\n---\n\n')

                    if (activeTab === 'screenshot' && auditScreenshot) {
                      const reader = new FileReader()
                      reader.onload = () => {
                        handleCreateAudit({
                          screenshot: reader.result as string,
                          context: combinedContext
                        })
                      }
                      reader.readAsDataURL(auditScreenshot)
                    } else if (activeTab === 'url' && auditUrl) {
                      handleCreateAudit({ url: auditUrl, context: combinedContext })
                    }
                  }}
                  className="space-y-8"
                >
                  <div className="grid h-16 w-full grid-cols-3 items-center justify-center rounded-lg bg-gray-100 p-1 text-muted-foreground">
                    <button
                      type="button"
                      className={`w-full rounded-md py-3 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'screenshot'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                      onClick={() => setActiveTab('screenshot')}
                    >
                      {currentLanguage === 'en' ? 'Screenshot' : 'Скриншот'}
                    </button>
                    <button
                      type="button"
                      className={`w-full rounded-md py-3 text-sm font-medium transition-all duration-200 ${
                        activeTab === 'url'
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-800'
                      }`}
                      onClick={() => setActiveTab('url')}
                    >
                      {currentLanguage === 'en' ? 'Website URL' : 'URL сайта'}
                    </button>
                    <button
                      type="button"
                      className="w-full cursor-not-allowed rounded-md py-3 text-sm font-medium text-slate-400"
                      disabled
                    >
                      Figma Frime
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-start">
                    {/* Left Column */}
                    <div className="space-y-6">
                      {activeTab === 'screenshot' && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
                            {currentLanguage === 'en'
                              ? 'Upload screenshot'
                              : 'Загрузите изображение'}{' '}
                            <span className="text-red-500">*</span>
                          </div>
                          <ImageUpload
                            onImageSelect={(file) => setAuditScreenshot(file)}
                            maxSize={10 * 1024 * 1024}
                            acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                            className="w-full [&>div]:min-h-[240px] [&>div]:rounded-3xl [&>div]:border-[#DDE3FF] [&>div]:bg-white"
                          />
                          <p className="text-xs text-slate-500">
                            {currentLanguage === 'en'
                              ? 'PNG, JPG, GIF, WebP up to 10MB'
                              : 'PNG, JPG, GIF, WebP до 10 MB'}
                          </p>
                        </div>
                      )}

                      {activeTab === 'url' && (
                        <div className="space-y-3">
                          <label
                            htmlFor="auditUrl"
                            className="block text-sm font-medium text-slate-900"
                          >
                            {currentLanguage === 'en' ? 'Website URL' : 'URL сайта'}{' '}
                            <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <input
                              id="auditUrl"
                              type="url"
                              value={auditUrl}
                              onChange={(e) => setAuditUrl(e.target.value)}
                              placeholder="https://example.com"
                              className="w-full rounded-2xl border border-[#E4E6F2] px-4 py-3 text-sm focus:border-[#0058FC] focus:outline-none focus:ring-2 focus:ring-[#C9D8FF]"
                            />
                            <LinkIcon className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                          </div>
                        </div>
                      )}

                      {activeTab === 'figma' && (
                        <div className="rounded-2xl border border-dashed border-[#E4E6F2] py-12 text-center text-slate-500">
                          {currentLanguage === 'en'
                            ? 'This option will be available soon'
                            : 'Эта функция скоро будет доступна'}
                        </div>
                      )}

                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-slate-900">
                          {currentLanguage === 'en'
                            ? 'Which analysis to run'
                            : 'Какой тип аудита провести'}
                        </h4>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between bg-transparent px-1 py-1">
                            <div className="flex items-center gap-2 text-slate-900">
                              <span className="font-medium">
                                {currentLanguage === 'en' ? 'UX Analysis' : 'UX Анализ'}{' '}
                                <span className="text-red-500">*</span>
                              </span>
                            </div>
                            <Switch checked disabled className="data-[state=checked]:bg-[#0058FC]" />
                          </div>

                          <div className="flex items-center justify-between bg-transparent px-1 py-1">
                            <div className="flex items-center gap-2 text-slate-900">
                              <span className="font-medium">
                                {currentLanguage === 'en' ? 'A/B Test' : 'A/B тест'}
                              </span>
                            </div>
                            <Switch
                              checked={selectedAuditTypes.abTest}
                              onCheckedChange={() =>
                                setSelectedAuditTypes((prev) => ({
                                  ...prev,
                                  abTest: !prev.abTest
                                }))
                              }
                              className="data-[state=checked]:bg-[#0058FC]"
                            />
                          </div>

                          <div className="flex items-center justify-between bg-transparent px-1 py-1">
                            <div className="flex items-center gap-2 text-slate-900">
                              <span className="font-medium">
                                {currentLanguage === 'en' ? 'Hypotheses' : 'Гипотезы'}
                              </span>
                            </div>
                            <Switch
                              checked={selectedAuditTypes.hypotheses}
                              onCheckedChange={() =>
                                setSelectedAuditTypes((prev) => ({
                                  ...prev,
                                  hypotheses: !prev.hypotheses
                                }))
                              }
                              className="data-[state=checked]:bg-[#0058FC]"
                            />
                          </div>

                          <div className="flex items-center justify-between bg-transparent px-1 py-1">
                            <div className="flex items-center gap-2 text-slate-900">
                              <span className="font-medium">
                                {currentLanguage === 'en'
                                  ? 'Product analytics'
                                  : 'Продуктовая аналитика'}
                              </span>
                            </div>
                            <Switch
                              checked={selectedAuditTypes.businessAnalytics}
                              onCheckedChange={() =>
                                setSelectedAuditTypes((prev) => ({
                                  ...prev,
                                  businessAnalytics: !prev.businessAnalytics
                                }))
                              }
                              className="data-[state=checked]:bg-[#0058FC]"
                            />
                          </div>
                        </div>
                      </div>

                      <p className="text-base font-semibold text-slate-900">
                        {creditsLabel}
                      </p>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="auditContext"
                          className="block text-sm font-medium text-slate-900"
                        >
                          {currentLanguage === 'en'
                            ? 'Context for analysis'
                            : 'Контекст для анализа'}{' '}
                          <span className="text-slate-400">
                            {currentLanguage === 'en' ? '(optional)' : '(необязательно)'}
                          </span>
                        </label>
                        <textarea
                          id="auditContext"
                          value={auditContext}
                          onChange={(e) => setAuditContext(e.target.value)}
                          className="w-full resize-none rounded-2xl border border-[#E4E6F2] px-4 py-3 text-sm focus:border-[#0058FC] focus:outline-none focus:ring-2 focus:ring-[#C9D8FF]"
                          rows={6}
                          placeholder={
                            currentLanguage === 'en'
                              ? 'For example: Main screen of a food delivery app...'
                              : 'Например: Это мобильное приложение для заказа еды...'
                          }
                        />
                        <p className="text-xs text-slate-500">
                          {currentLanguage === 'en'
                            ? 'The more context you provide, the more accurate the insights will be.'
                            : 'Чем больше контекста вы предоставите, тем точнее будет анализ.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="targetAudience"
                          className="block text-sm font-medium text-slate-900"
                        >
                          {currentLanguage === 'en'
                            ? 'Target audience'
                            : 'Целевая аудитория'}{' '}
                          <span className="text-slate-400">
                            {currentLanguage === 'en' ? '(optional)' : '(необязательно)'}
                          </span>
                        </label>
                        <textarea
                          id="targetAudience"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="w-full resize-none rounded-2xl border border-[#E4E6F2] px-4 py-3 text-sm focus:border-[#0058FC] focus:outline-none focus:ring-2 focus:ring-[#C9D8FF]"
                          rows={6}
                          placeholder={
                            currentLanguage === 'en'
                              ? 'For example: Mobile users aged 18-35 who value speed and convenience...'
                              : 'Например: Молодые люди 18-35 лет, активные пользователи смартфонов...'
                          }
                        />
                        <p className="text-xs text-slate-500">
                          {currentLanguage === 'en'
                            ? 'This helps AI tailor recommendations to the right audience.'
                            : 'Эта информация поможет AI дать более точные рекомендации при анализе.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* Таблица аудитов или опросов */}
            <div className="w-full space-y-8">
              {/* Empty state - если нет НИ аудитов НИ опросов */}
              {audits.length === 0 && surveys.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600 mb-4">
                    {currentLanguage === 'en' ? 'There is no content in this project yet' : 'В этом проекте пока нет контента'}
                  </p>
                  <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('projects.detail.history.emptyAction') || (currentLanguage === 'en' ? 'Create first audit' : 'Создать первый аудит')}
                  </Button>
                </div>
              ) : null}

              {/* Таблица аудитов - показываем если есть аудиты */}
              {audits.length > 0 && (
                <div className="w-full">
                  {/* Заголовки таблицы */}
                  <div className="grid grid-cols-[auto_200px_120px_120px_120px_80px] gap-4 px-4 py-3 text-sm font-medium text-slate-500">
                    <div>{t('projects.detail.table.history') || 'История аудитов'}</div>
                    <div>{t('projects.detail.table.date') || 'Дата'}</div>
                    <div>{t('projects.detail.table.status') || 'Статус'}</div>
                    <div>{t('projects.detail.table.audits') || 'Аудитов'}</div>
                    <div>{t('projects.detail.table.context') || 'Контекст'}</div>
                    <div>{t('projects.detail.table.actions') || 'Действие'}</div>
                  </div>

                  {/* Строки таблицы */}
                  <div className="space-y-0">
                    {audits.map((audit, index) => (
                      <div key={audit.id}>
                        <div
                          onClick={() => router.push(`/audit/${audit.id}`)}
                          className="grid grid-cols-[auto_200px_120px_120px_120px_80px] gap-4 px-4 py-4 items-center bg-white hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
                        >
                          {/* Превью + Название */}
                          <div className="flex items-center gap-4">
                            <div className="w-[80px] h-[60px] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url ? (
                                <img
                                  src={audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url}
                                  alt={audit.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Eye className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <h3 className="font-medium text-slate-900">{audit.name}</h3>
                          </div>

                          {/* Дата */}
                          <div className="text-sm text-slate-600">
                            {formatDateTime(audit.created_at)}
                          </div>

                          {/* Статус */}
                          <div>
                            <Badge className={getStatusColor(audit.status)}>
                              {getStatusLabel(audit.status)}
                            </Badge>
                          </div>

                          {/* Аудитов (прогресс) - динамический подсчёт */}
                          <div className="flex items-center gap-2">
                            <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full bg-green-500" style={{ width: `${getAuditProgress(audit).percentage}%` }}></div>
                            </div>
                            <span className="text-sm text-slate-600">{getAuditProgress(audit).completed}/{getAuditProgress(audit).total}</span>
                          </div>

                          {/* Контекст */}
                          <div className="text-sm text-slate-600 truncate">
                            {audit.input_data?.url ? '🔗 URL' : '📱 Мобил...'}
                          </div>

                          {/* Действия - Dropdown меню */}
                          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-slate-400 hover:text-slate-600">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    // TODO: Реализовать функцию поделиться
                                    console.log('Share audit:', audit.id)
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  {t('common.share') || (currentLanguage === 'en' ? 'Share' : 'Поделиться')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const confirmMessage = t('projects.detail.confirmDelete') || (currentLanguage === 'en'
                                      ? 'Delete this audit?'
                                      : 'Удалить этот аудит?')
                                    if (confirm(confirmMessage)) {
                                      await handleDeleteAudit(audit.id)
                                    }
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('common.delete') || (currentLanguage === 'en' ? 'Delete' : 'Удалить')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Сепаратор */}
                        {index < audits.length - 1 && (
                          <div className="h-[1px] bg-[#EEF2FA]"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Таблица опросов - показываем если есть опросы */}
              {surveys.length > 0 && (
                <div className="w-full">
                  {/* Заголовки таблицы */}
                  <div className="grid grid-cols-[auto_200px_120px_120px_80px] gap-4 px-4 py-3 text-sm font-medium text-slate-500">
                    <div>{currentLanguage === 'en' ? 'Survey History' : 'История опросов'}</div>
                    <div>{t('projects.detail.table.date') || 'Дата'}</div>
                    <div>{t('projects.detail.table.status') || 'Статус'}</div>
                    <div>{currentLanguage === 'en' ? 'Responses' : 'Ответов'}</div>
                    <div>{t('projects.detail.table.actions') || 'Действие'}</div>
                  </div>

                  {/* Строки таблицы */}
                  <div className="space-y-0">
                    {surveys.map((survey, index) => (
                      <div key={survey.id}>
                        <div
                          onClick={() => router.push(`/surveys/${survey.id}`)}
                          className="grid grid-cols-[auto_200px_120px_120px_80px] gap-4 px-4 py-4 items-center bg-white hover:bg-slate-50 transition-colors rounded-lg cursor-pointer"
                        >
                          {/* Превью + Название */}
                          <div className="flex items-center gap-4">
                            <div className="w-[80px] h-[60px] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                              {survey.screenshot_url ? (
                                <img
                                  src={survey.screenshot_url}
                                  alt={survey.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <FileText className="w-6 h-6 text-slate-400" />
                              )}
                            </div>
                            <h3 className="font-medium text-slate-900">{survey.name}</h3>
                          </div>

                          {/* Дата */}
                          <div className="text-sm text-slate-600">
                            {formatDateTime(survey.created_at)}
                          </div>

                          {/* Статус */}
                          <div>
                            <Badge className={
                              survey.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                              survey.status === 'published' ? 'bg-green-100 text-green-800' :
                              'bg-slate-100 text-slate-800'
                            }>
                              {survey.status === 'draft' ? (currentLanguage === 'en' ? 'Draft' : 'Черновик') :
                               survey.status === 'published' ? (currentLanguage === 'en' ? 'Published' : 'Опубликован') :
                               survey.status === 'closed' ? (currentLanguage === 'en' ? 'Closed' : 'Закрыт') : survey.status}
                            </Badge>
                          </div>

                          {/* Количество ответов */}
                          <div className="text-sm text-slate-600">
                            {survey.responses_count || 0}
                          </div>

                          {/* Действия - Dropdown меню */}
                          <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="text-slate-400 hover:text-slate-600">
                                  <MoreVertical className="w-5 h-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    const link = `${window.location.origin}/public/survey/${survey.id}`
                                    navigator.clipboard.writeText(link)
                                    alert('Ссылка скопирована в буфер обмена!')
                                  }}
                                >
                                  <Share2 className="w-4 h-4 mr-2" />
                                  {t('common.share') || (currentLanguage === 'en' ? 'Share' : 'Поделиться')}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={async () => {
                                    const confirmMessage = currentLanguage === 'en' ? 'Delete this survey?' : 'Удалить этот опрос?'
                                    if (confirm(confirmMessage)) {
                                      await handleDeleteSurvey(survey.id)
                                    }
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {t('common.delete') || (currentLanguage === 'en' ? 'Delete' : 'Удалить')}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                        {/* Сепаратор */}
                        {index < surveys.length - 1 && (
                          <div className="h-[1px] bg-[#EEF2FA]"></div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
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

        {/* Модальное окно настроек проекта */}
        <Dialog open={showSettingsModal} onOpenChange={setShowSettingsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {t('projects.detail.settings.title') || (currentLanguage === 'en' ? 'Project settings' : 'Настройки проекта')}
              </DialogTitle>
              <DialogDescription>
                {t('projects.detail.settings.description') || (currentLanguage === 'en'
                  ? 'Edit project context and target audience'
                  : 'Редактирование контекста проекта и целевой аудитории')}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Контекст проекта */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  {t('projects.detail.context.projectLabel') || (currentLanguage === 'en' ? 'Project context' : 'Контекст проекта')}
                </h4>
                <textarea
                  value={editContext}
                  onChange={handleContextChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={4}
                  placeholder={t('projects.detail.context.projectPlaceholder') || (currentLanguage === 'en'
                    ? 'Example: Mobile app for food ordering. Main features: catalog, cart, payment, order history...'
                    : 'Например: Мобильное приложение для заказа еды. Основные функции: каталог, корзина, оплата, история заказов...')}
                />
              </div>

              {/* Разделитель */}
              <div className="border-t border-gray-200"></div>

              {/* Целевая аудитория */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">
                  {t('projects.detail.context.audienceLabel') || (currentLanguage === 'en' ? 'Target audience' : 'Целевая аудитория')}
                </h4>
                <textarea
                  value={editTargetAudience}
                  onChange={handleTargetAudienceChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={4}
                  placeholder={t('projects.detail.context.audiencePlaceholder') || (currentLanguage === 'en'
                    ? 'Example: Young people aged 18-35, active smartphone users who value convenience and speed and are willing to pay for quality service...'
                    : 'Например: Молодые люди 18-35 лет, активные пользователи смартфонов, ценят удобство и скорость, готовы платить за качественный сервис...')}
                />
              </div>

              {/* Общая подсказка */}
              <p className="text-sm text-slate-500">
                {t('projects.detail.context.note') || (currentLanguage === 'en'
                  ? 'This information will help the AI provide more accurate recommendations during analysis'
                  : 'Эта информация поможет AI дать более точные рекомендации при анализе')}
              </p>

              {/* Кнопки управления */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    handleSaveAll()
                    if (!isUpdating) setShowSettingsModal(false)
                  }}
                  disabled={!hasAnyChanges || isUpdating}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isUpdating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : null}
                  {t('common.save') || (currentLanguage === 'en' ? 'Save' : 'Сохранить')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleCancelAll()
                    setShowSettingsModal(false)
                  }}
                  disabled={isUpdating}
                >
                  {t('common.cancel') || (currentLanguage === 'en' ? 'Cancel' : 'Отмена')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        </div>
      </div>
    </SidebarDemo>
  )
}
