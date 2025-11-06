'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ProjectCard } from '@/components/project-card'
import {
  Loader2,
  FolderOpen,
  Plus
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserProjects, createProject, getProjectSurveysForPreview } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import { User } from '@supabase/supabase-js'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  surveysCount?: number
  screenshots?: string[]
}

export default function SurveysPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t, currentLanguage, tWithFallback } = useTranslation()
  const { formatDate } = useFormatters()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState<Project[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', context: '', targetAudience: '' })

  const shouldOpenCreateForm = searchParams?.get('create') === '1'

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadProjects()
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

  const loadProjects = async () => {
    try {
      const userProjects = await getUserProjects('survey') // Загружаем только survey проекты

      // Загружаем данные для каждого проекта параллельно
      const projectsWithCounts = await Promise.all(
        userProjects.map(async (project) => {
          const { count, surveys } = await getProjectSurveysForPreview(project.id)

          // Извлекаем скриншоты из опросов (максимум 4)
          const screenshots: string[] = []
          console.log('🔍 Опросы для проекта', project.id, ':', surveys.length)
          for (const survey of surveys) {
            if (screenshots.length >= 4) break
            console.log('📸 Опрос', survey.id, 'screenshot_url:', survey.screenshot_url)
            if (survey.screenshot_url) {
              screenshots.push(survey.screenshot_url)
            }
          }
          console.log('📸 Итоговый массив скриншотов для survey проекта', project.id, ':', screenshots)

          return {
            ...project,
            surveysCount: count,
            screenshots
          }
        })
      )

      setProjects(projectsWithCounts)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
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
        newProject.targetAudience || undefined,
        'survey' // Создаём проект типа survey
      )
      closeCreateForm()
      // Перезагружаем проекты чтобы показать новый проект
      await loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      alert(t('projects.errors.createError', { error: errorMessage }))
    } finally {
      setCreating(false)
    }
  }

  const formatProjectDate = (dateString: string) => {
    return formatDate(dateString)
  }

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

          <div className="space-y-8">
            {/* Список проектов */}
            {projects.length === 0 ? (
              <Card className="p-12 text-center bg-white rounded-2xl border border-gray-200 shadow-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {t('projects.empty.title') || 'У вас пока нет проектов для опросов'}
                </h3>
                <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                  {t('projects.empty.description') || 'Создайте проект чтобы организовать AI-опросы'}
                </p>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="flex items-center gap-2 mx-auto bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-medium text-lg"
                >
                  <Plus className="w-5 h-5" />
                  {t('projects.empty.createFirst') || 'Создать первый проект'}
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={{
                      ...project,
                      auditsCount: project.surveysCount
                    }}
                    formatDate={formatProjectDate}
                    href={`/projects/${project.id}?from=surveys`} // Добавляем параметр для сайдбара
                    onOpenSettings={() => {}} // Пока не реализовано
                    menuLabels={{
                      settings: 'Настройки проекта'
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
