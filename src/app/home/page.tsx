'use client'

import { useState, useEffect, type FormEvent, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProjects, getProjectAuditsForPreview, createProject, deleteProject, updateProject } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
import { PageHeader } from '@/components/page-header'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  BarChart3,
  TestTube2,
  Lightbulb,
  TrendingUp,
  Plus,
  FolderOpen,
  ChevronRight,
  Sparkles
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  auditsCount?: number
  screenshots?: string[]
}

interface ResearchCard {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  available: boolean
}

export default function HomePage() {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation()
  const { formatDate } = useFormatters()
  const [user, setUser] = useState<User | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [settingsProject, setSettingsProject] = useState<Project | null>(null)
  const [settingsName, setSettingsName] = useState('')
  const [settingsDescription, setSettingsDescription] = useState('')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [isDeletingProject, setIsDeletingProject] = useState(false)
  const [deleteTargetProject, setDeleteTargetProject] = useState<Project | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/')
        return
      }
      setUser(user)
      await loadProjects()
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleProjectsDragScroll = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return
    const container = event.currentTarget
    event.preventDefault()

    const startX = event.pageX
    const initialScrollLeft = container.scrollLeft
    let hasDragged = false

    container.dataset.dragging = 'false'
    container.classList.remove('cursor-grab')
    container.classList.add('cursor-grabbing')
    const previousScrollBehavior = container.style.scrollBehavior
    container.style.scrollBehavior = 'auto'

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const walk = moveEvent.pageX - startX
      if (!hasDragged && Math.abs(walk) > 3) {
        hasDragged = true
        container.dataset.dragging = 'true'
      }
      container.scrollLeft = initialScrollLeft - walk
    }

    const handleMouseUp = () => {
      container.classList.remove('cursor-grabbing')
      container.classList.add('cursor-grab')
      container.style.scrollBehavior = previousScrollBehavior
      container.dataset.dragging = 'false'

      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)

      if (hasDragged) {
        const preventClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation()
          clickEvent.preventDefault()
        }
        container.addEventListener('click', preventClick, { capture: true, once: true })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const loadProjects = async () => {
    try {
      const userProjects = await getUserProjects()

      // Загружаем данные для каждого проекта параллельно (оптимизированный запрос)
      const projectsWithCounts = await Promise.all(
        userProjects.map(async (project) => {
          const { count, audits } = await getProjectAuditsForPreview(project.id)

          // Извлекаем скриншоты из аудитов (максимум 4)
          const screenshots: string[] = []
          for (const audit of audits) {
            if (screenshots.length >= 4) break

            const inputData = audit.input_data as { screenshot?: string; screenshotUrl?: string } | null
            const screenshotUrl = inputData?.screenshotUrl || inputData?.screenshot
            if (screenshotUrl) {
              screenshots.push(screenshotUrl)
            }
          }

          return {
            ...project,
            auditsCount: count,
            screenshots
          }
        })
      )

      // Берем только последние 5 проектов
      setProjects(projectsWithCounts.slice(0, 5))
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleCreateProject = async () => {
    setCreating(true)
    try {
      const defaultName = currentLanguage === 'en'
        ? `New Project ${formatDate(new Date())}`
        : `Новый проект ${formatDate(new Date())}`

      const project = await createProject(defaultName)
      router.push(`/projects/${project.id}`)
    } catch (error) {
      console.error('Error creating project:', error)
      alert(currentLanguage === 'en' ? 'Error creating project' : 'Ошибка создания проекта')
    } finally {
      setCreating(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setSettingsProject(project)
    setSettingsName(project.name)
    setSettingsDescription(project.description || '')
  }

  const handleCloseProjectSettings = () => {
    setSettingsProject(null)
    setSettingsName('')
    setSettingsDescription('')
  }

  const handleSaveProjectSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!settingsProject || !settingsName.trim()) {
      return
    }

    try {
      setIsSavingSettings(true)
      await updateProject(settingsProject.id, {
        name: settingsName.trim(),
        description: settingsDescription.trim() || undefined
      })
      await loadProjects()
      handleCloseProjectSettings()
    } catch (error) {
      console.error('Error updating project:', error)
      alert(currentLanguage === 'en' ? 'Error updating project' : 'Ошибка обновления проекта')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const handleDeleteProjectRequest = (project: Project) => {
    setDeleteTargetProject(project)
    setShowDeleteDialog(true)
  }

  const handleConfirmProjectDelete = async () => {
    if (!deleteTargetProject) return

    try {
      setIsDeletingProject(true)
      await deleteProject(deleteTargetProject.id)
      await loadProjects()
      setShowDeleteDialog(false)
      setDeleteTargetProject(null)
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(currentLanguage === 'en' ? 'Error deleting project' : 'Ошибка удаления проекта')
    } finally {
      setIsDeletingProject(false)
    }
  }

  const researchCards: ResearchCard[] = [
    {
      id: 'ux-analysis',
      title: currentLanguage === 'en' ? 'UX Analysis' : 'UX анализ',
      description: currentLanguage === 'en'
        ? 'Comprehensive UX analysis with expert recommendations'
        : 'Комплексный UX-анализ с экспертными рекомендациями',
      icon: <BarChart3 className="w-8 h-8" />,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'ab-test',
      title: currentLanguage === 'en' ? 'A/B Testing' : 'A/B тестирование',
      description: currentLanguage === 'en'
        ? 'Generate A/B test plans based on UX insights'
        : 'Генерация планов A/B тестирования на основе UX-инсайтов',
      icon: <TestTube2 className="w-8 h-8" />,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'hypotheses',
      title: currentLanguage === 'en' ? 'Hypotheses' : 'Гипотезы',
      description: currentLanguage === 'en'
        ? 'Product hypotheses for growth and optimization'
        : 'Продуктовые гипотезы для роста и оптимизации',
      icon: <Lightbulb className="w-8 h-8" />,
      color: 'bg-yellow-500',
      available: true
    },
    {
      id: 'business-analytics',
      title: currentLanguage === 'en' ? 'Business Analytics' : 'Бизнес-аналитика',
      description: currentLanguage === 'en'
        ? 'Business metrics and conversion analysis'
        : 'Бизнес-метрики и анализ конверсии',
      icon: <TrendingUp className="w-8 h-8" />,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'coming-soon-1',
      title: currentLanguage === 'en' ? 'Coming Soon' : 'Скоро',
      description: currentLanguage === 'en'
        ? 'New research type coming soon'
        : 'Новый тип исследования скоро появится',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'bg-gray-400',
      available: false
    },
    {
      id: 'coming-soon-2',
      title: currentLanguage === 'en' ? 'Coming Soon' : 'Скоро',
      description: currentLanguage === 'en'
        ? 'New research type coming soon'
        : 'Новый тип исследования скоро появится',
      icon: <Sparkles className="w-8 h-8" />,
      color: 'bg-gray-400',
      available: false
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        {/* Заголовок */}
        <PageHeader
          breadcrumbs={[
            { label: currentLanguage === 'en' ? 'Home' : 'Главная' }
          ]}
          title={currentLanguage === 'en' ? 'Welcome Back!' : 'Привет Богдан'}
          subtitle={
            currentLanguage === 'en'
              ? 'Overview of your research and projects'
              : 'Обзор ваших исследований и проектов'
          }
          primaryButton={{
            label: currentLanguage === 'en' ? 'New Project' : 'Создать аудит',
            onClick: handleCreateProject,
            disabled: creating
          }}
        />

        <div className="space-y-8 overflow-hidden">

        {/* Последние проекты */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-slate-900">
              {currentLanguage === 'en' ? 'Recent Projects' : 'Последние проекты'}
            </h2>
            <Link href="/projects">
              <Button variant="ghost" className="flex items-center gap-1">
                {currentLanguage === 'en' ? 'View all' : 'Все проекты'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {currentLanguage === 'en'
                    ? 'No projects yet. Create your first project to get started!'
                    : 'Пока нет проектов. Создайте первый проект для начала работы!'}
                </p>
                <Button onClick={handleCreateProject} disabled={creating}>
                  <Plus className="w-4 h-4 mr-2" />
                  {currentLanguage === 'en' ? 'Create First Project' : 'Создать первый проект'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div
              className="overflow-x-auto scrollbar-hide -mx-8 px-8"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
              }}
            >
              <div
                data-projects-scroll
                className="flex gap-4 w-max cursor-grab active:cursor-grabbing"
                onMouseDown={handleProjectsDragScroll}
              >
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="w-[372px] flex-shrink-0"
                    data-project-card-wrapper
                  >
                    <ProjectCard
                      project={project}
                      formatDate={formatDate}
                      onOpenSettings={() => handleEditProject(project)}
                      menuLabels={{
                        settings: currentLanguage === 'en' ? 'Project settings' : 'Настройки проекта'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Модалка настроек проекта */}
        {settingsProject && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {currentLanguage === 'en' ? 'Project settings' : 'Настройки проекта'}
              </h2>
              <form onSubmit={handleSaveProjectSettings} className="space-y-6">
                <div>
                  <Label htmlFor="settingsName" className="block text-sm font-medium text-slate-700 mb-2">
                    {currentLanguage === 'en' ? 'Project name' : 'Название проекта'}
                  </Label>
                  <Input
                    id="settingsName"
                    value={settingsName}
                    onChange={(event) => setSettingsName(event.target.value)}
                    placeholder={currentLanguage === 'en' ? 'Enter project name' : 'Введите название проекта'}
                    required
                    disabled={isSavingSettings}
                  />
                </div>
                <div>
                  <Label htmlFor="settingsDescription" className="block text-sm font-medium text-slate-700 mb-2">
                    {currentLanguage === 'en' ? 'Description' : 'Описание'}
                  </Label>
                  <textarea
                    id="settingsDescription"
                    value={settingsDescription}
                    onChange={(event) => setSettingsDescription(event.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={4}
                    placeholder={currentLanguage === 'en' ? 'Describe the project' : 'Опишите проект'}
                    disabled={isSavingSettings}
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex gap-4">
                    <Button type="submit" className="flex-1" disabled={isSavingSettings}>
                      {isSavingSettings
                        ? currentLanguage === 'en'
                          ? 'Saving...'
                          : 'Сохранение...'
                        : currentLanguage === 'en'
                        ? 'Save'
                        : 'Сохранить'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCloseProjectSettings}
                      className="flex-1"
                      disabled={isSavingSettings}
                    >
                      {currentLanguage === 'en' ? 'Cancel' : 'Отмена'}
                    </Button>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      handleDeleteProjectRequest(settingsProject)
                      handleCloseProjectSettings()
                    }}
                  >
                    {currentLanguage === 'en' ? 'Delete project' : 'Удалить проект'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Диалог удаления проекта */}
        <AlertDialog
          open={showDeleteDialog}
          onOpenChange={(open) => {
            setShowDeleteDialog(open)
            if (!open && !isDeletingProject) {
              setDeleteTargetProject(null)
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {currentLanguage === 'en' ? 'Delete project' : 'Удалить проект'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {currentLanguage === 'en'
                  ? 'This action cannot be undone. All related audits will be removed.'
                  : 'Это действие нельзя отменить. Все связанные аудиты будут удалены.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingProject}>
                {currentLanguage === 'en' ? 'Cancel' : 'Отмена'}
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmProjectDelete}
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeletingProject}
              >
                {isDeletingProject
                  ? currentLanguage === 'en'
                    ? 'Deleting...'
                    : 'Удаление...'
                  : currentLanguage === 'en'
                  ? 'Delete'
                  : 'Удалить'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Типы исследований */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">
            {currentLanguage === 'en' ? 'Research Types' : 'Типы исследований'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {researchCards.map((card) => (
              <Card
                key={card.id}
                className={`${
                  card.available
                    ? 'hover:shadow-lg transition-shadow cursor-pointer'
                    : 'opacity-60 cursor-not-allowed'
                }`}
              >
                <CardHeader>
                  <div className={`w-16 h-16 rounded-lg ${card.color} flex items-center justify-center text-white mb-4`}>
                    {card.icon}
                  </div>
                  <CardTitle>{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  {card.available ? (
                    <p className="text-sm text-slate-600">
                      {currentLanguage === 'en'
                        ? 'Available in project audits'
                        : 'Доступно в аудитах проекта'}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500 italic">
                      {currentLanguage === 'en' ? 'Coming soon...' : 'Скоро...'}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        </div>
      </div>
    </SidebarDemo>
  )
}
