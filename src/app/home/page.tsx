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
      {/* Секция с горизонтальным скроллом */}
      <section className="grid grid-cols-[2rem_1fr_2rem] mt-8">
        {/* Хедер */}
        <div className="col-start-2">
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
        </div>

        {/* Заголовок секции */}
        <div className="col-start-2 pb-4 mt-8">
          <div className="flex items-center justify-between">
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
        </div>

        {/* Горизонтальный скролл карточек */}
        <div className="col-start-2 col-end-4 grid grid-flow-col auto-cols-min gap-6 overflow-x-auto pb-4 pr-8 scrollbar-hide">
          {/* Карточка 1 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center">
            <p className="text-blue-600 font-medium">Карточка 1</p>
          </div>

          {/* Карточка 2 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-purple-50 to-pink-100 rounded-xl border-2 border-dashed border-purple-300 flex items-center justify-center">
            <p className="text-purple-600 font-medium">Карточка 2</p>
          </div>

          {/* Карточка 3 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border-2 border-dashed border-green-300 flex items-center justify-center">
            <p className="text-green-600 font-medium">Карточка 3</p>
          </div>

          {/* Карточка 4 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-orange-50 to-red-100 rounded-xl border-2 border-dashed border-orange-300 flex items-center justify-center">
            <p className="text-orange-600 font-medium">Карточка 4</p>
          </div>

          {/* Карточка 5 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-red-50 to-rose-100 rounded-xl border-2 border-dashed border-red-300 flex items-center justify-center">
            <p className="text-red-600 font-medium">Карточка 5</p>
          </div>

          {/* Карточка 6 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-cyan-50 to-sky-100 rounded-xl border-2 border-dashed border-cyan-300 flex items-center justify-center">
            <p className="text-cyan-600 font-medium">Карточка 6</p>
          </div>

          {/* Карточка 7 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl border-2 border-dashed border-yellow-300 flex items-center justify-center">
            <p className="text-yellow-600 font-medium">Карточка 7</p>
          </div>

          {/* Карточка 8 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-teal-50 to-emerald-100 rounded-xl border-2 border-dashed border-teal-300 flex items-center justify-center">
            <p className="text-teal-600 font-medium">Карточка 8</p>
          </div>

          {/* Карточка 9 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-fuchsia-50 to-purple-100 rounded-xl border-2 border-dashed border-fuchsia-300 flex items-center justify-center">
            <p className="text-fuchsia-600 font-medium">Карточка 9</p>
          </div>

          {/* Карточка 10 */}
          <div className="w-[320px] h-[200px] bg-gradient-to-br from-lime-50 to-green-100 rounded-xl border-2 border-dashed border-lime-300 flex items-center justify-center">
            <p className="text-lime-600 font-medium">Карточка 10</p>
          </div>
        </div>
      </section>
    </SidebarDemo>
  )
}
