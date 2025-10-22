'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Loader2,
  Eye,
  Edit2,
  Share2,
  Trash2,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  XCircle,
  FolderOpen,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserSurveys, deleteSurvey, createProject } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import { User } from '@supabase/supabase-js'
import type { Survey } from '@/types/survey'

export default function SurveysPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, currentLanguage } = useTranslation()
  const { formatDate: formatDateUtil } = useFormatters()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', context: '', targetAudience: '' })

  const shouldOpenCreateForm = searchParams?.get('create') === '1'

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadSurveys()
    }
  }, [user])

  useEffect(() => {
    if (shouldOpenCreateForm) {
      setShowCreateForm(true)
    }
  }, [shouldOpenCreateForm])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/projects')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadSurveys = async () => {
    try {
      const data = await getUserSurveys()
      setSurveys(data)
    } catch (error) {
      console.error('Error loading surveys:', error)
      setError('Не удалось загрузить опросы')
    }
  }

  const updateCreateQuery = (value: '1' | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value) {
      params.set('create', value)
    } else {
      params.delete('create')
    }
    const queryString = params.toString()
    router.replace(queryString ? `/surveys?${queryString}` : '/surveys', { scroll: false })
  }

  const openCreateForm = () => {
    setShowCreateForm(true)
    if (!shouldOpenCreateForm) {
      updateCreateQuery('1')
    }
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setNewProject({ name: '', description: '', context: '', targetAudience: '' })
    updateCreateQuery(null)
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    setCreating(true)
    try {
      await createProject(
        newProject.name,
        newProject.description || undefined,
        newProject.context || undefined,
        newProject.targetAudience || undefined
      )
      closeCreateForm()
      // Перезагружаем опросы чтобы показать новый проект
      await loadSurveys()
    } catch (error) {
      console.error('Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      alert(t('projects.errors.createError', { error: errorMessage }))
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (surveyId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот опрос? Это действие нельзя отменить.')) {
      return
    }

    try {
      setDeletingId(surveyId)
      await deleteSurvey(surveyId)
      setSurveys(surveys.filter(s => s.id !== surveyId))
    } catch (error) {
      console.error('Error deleting survey:', error)
      setError('Не удалось удалить опрос')
    } finally {
      setDeletingId(null)
    }
  }

  const handleCopyLink = (surveyId: string) => {
    const link = `${window.location.origin}/public/survey/${surveyId}`
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована в буфер обмена!')
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: Survey['status']) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800'
      case 'published':
        return 'bg-green-100 text-green-800'
      case 'closed':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  const getStatusLabel = (status: Survey['status']) => {
    switch (status) {
      case 'draft':
        return 'Черновик'
      case 'published':
        return 'Опубликован'
      case 'closed':
        return 'Закрыт'
      default:
        return status
    }
  }

  const getStatusIcon = (status: Survey['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="w-4 h-4" />
      case 'published':
        return <CheckCircle2 className="w-4 h-4" />
      case 'closed':
        return <XCircle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  // Группируем опросы по проектам
  const surveysByProject = surveys.reduce((acc, survey) => {
    const projectId = survey.project_id || 'no-project'
    const projectName = survey.projects?.name || 'Без проекта'

    if (!acc[projectId]) {
      acc[projectId] = {
        projectId,
        projectName,
        surveys: []
      }
    }

    acc[projectId].surveys.push(survey)
    return acc
  }, {} as Record<string, { projectId: string; projectName: string; surveys: Survey[] }>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Опросы' }
            ]}
            title="Мои опросы"
            subtitle="AI-опросы сгруппированные по проектам"
            primaryButton={{
              label: 'Создать проект',
              onClick: openCreateForm
            }}
          />
        </div>

        <div className="px-8 space-y-8">
          {/* Форма создания проекта */}
          {showCreateForm && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                  {t('projects.createProject.title') || 'Создать новый проект'}
                </h3>
                <p className="text-slate-600">
                  {t('projects.createProject.description') || 'Создайте проект для организации опросов'}
                </p>
              </div>

              <form onSubmit={handleCreateProject} className="space-y-6">
                <div>
                  <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('projects.createProject.nameLabel') || 'Название проекта'}
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    placeholder={t('projects.createProject.namePlaceholder') || 'Введите название проекта'}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('projects.createProject.descriptionLabel') || 'Описание'}
                  </label>
                  <textarea
                    id="projectDescription"
                    value={newProject.description}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={3}
                    placeholder={t('projects.createProject.descriptionPlaceholder') || 'Краткое описание проекта'}
                  />
                </div>

                <div>
                  <label htmlFor="projectContext" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('projects.createProject.contextLabel') || 'Контекст'}
                  </label>
                  <textarea
                    id="projectContext"
                    value={newProject.context}
                    onChange={(e) => setNewProject({ ...newProject, context: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                    placeholder={t('projects.createProject.contextPlaceholder') || 'Контекст для AI анализа'}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    {t('projects.createProject.contextNote') || 'Поможет AI генерировать более точные вопросы'}
                  </p>
                </div>

                <div>
                  <label htmlFor="projectAudience" className="block text-sm font-medium text-slate-700 mb-2">
                    {t('projects.createProject.audienceLabel') || 'Целевая аудитория'}
                  </label>
                  <textarea
                    id="projectAudience"
                    value={newProject.targetAudience}
                    onChange={(e) => setNewProject({ ...newProject, targetAudience: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                    placeholder={currentLanguage === 'en'
                      ? 'Example: Young people aged 18-35, active smartphone users...'
                      : 'Например: Молодые люди 18-35 лет, активные пользователи смартфонов...'}
                  />
                  <p className="text-sm text-slate-500 mt-1">
                    {t('projects.createProject.audienceNote') || 'Опишите вашу целевую аудиторию'}
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={creating}
                    className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium"
                  >
                    {creating ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    {creating ? (t('projects.createProject.loading') || 'Создание...') : (t('projects.createProject.createButton') || 'Создать проект')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeCreateForm}
                    className="px-6 py-3 rounded-lg font-medium border-2 border-gray-200 hover:border-gray-300"
                  >
                    {t('projects.createProject.cancel') || 'Отмена'}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="max-w-7xl space-y-8">
            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Список опросов по проектам */}
            {surveys.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  У вас пока нет опросов
                </h3>
                <p className="text-slate-600 mb-4">
                  Создайте первый AI-опрос из проекта
                </p>
                <Button
                  onClick={() => router.push('/projects')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Перейти к проектам
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                {Object.values(surveysByProject).map(({ projectId, projectName, surveys: projectSurveys }) => (
                  <div key={projectId} className="space-y-4">
                    {/* Заголовок проекта */}
                    <div className="flex items-center gap-3">
                      <FolderOpen className="w-5 h-5 text-blue-600" />
                      <h2 className="text-xl font-semibold text-slate-900">{projectName}</h2>
                      <span className="text-sm text-slate-500">
                        ({projectSurveys.length} {projectSurveys.length === 1 ? 'опрос' : 'опросов'})
                      </span>
                      {projectId !== 'no-project' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/projects/${projectId}`)}
                        >
                          Открыть проект
                        </Button>
                      )}
                    </div>

                    {/* Опросы проекта */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {projectSurveys.map((survey) => (
                        <Card key={survey.id} className="p-6 hover:shadow-lg transition-shadow">
                          <div className="space-y-4">
                            {/* Заголовок и статус */}
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="font-semibold text-slate-900 text-lg line-clamp-2">
                                  {survey.name}
                                </h3>
                                <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 whitespace-nowrap ${getStatusColor(survey.status)}`}>
                                  {getStatusIcon(survey.status)}
                                  {getStatusLabel(survey.status)}
                                </div>
                              </div>
                              {survey.description && (
                                <p className="text-sm text-slate-600 line-clamp-2">
                                  {survey.description}
                                </p>
                              )}
                            </div>

                            {/* Скриншот */}
                            {survey.screenshot_url && (
                              <div className="relative aspect-video bg-slate-100 rounded-lg overflow-hidden">
                                <img
                                  src={survey.screenshot_url}
                                  alt="Survey screenshot"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}

                            {/* Статистика */}
                            <div className="flex items-center gap-4 text-sm text-slate-600">
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>{survey.main_questions.length} вопросов</span>
                              </div>
                              {survey.status === 'published' && (
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>{survey.responses_count || 0} ответов</span>
                                </div>
                              )}
                            </div>

                            {/* Дата создания */}
                            <div className="text-xs text-slate-500">
                              Создан {formatDate(survey.created_at)}
                            </div>

                            {/* Действия */}
                            <div className="flex gap-2 pt-2 border-t">
                              {survey.status === 'draft' ? (
                                <Button
                                  size="sm"
                                  onClick={() => router.push(`/surveys/${survey.id}`)}
                                  className="flex-1"
                                >
                                  <Edit2 className="w-4 h-4 mr-1" />
                                  Редактировать
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => router.push(`/surveys/${survey.id}`)}
                                    className="flex-1"
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    Просмотр
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopyLink(survey.id)}
                                    className="flex-1"
                                  >
                                    <Share2 className="w-4 h-4 mr-1" />
                                    Ссылка
                                  </Button>
                                </>
                              )}
                            </div>

                            {survey.status === 'published' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => router.push(`/surveys/${survey.id}/analytics`)}
                                className="w-full"
                              >
                                <BarChart3 className="w-4 h-4 mr-1" />
                                Аналитика
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(survey.id)}
                              disabled={deletingId === survey.id}
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {deletingId === survey.id ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                  Удаление...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Удалить
                                </>
                              )}
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
