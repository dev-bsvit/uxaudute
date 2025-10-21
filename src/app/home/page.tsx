'use client'

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type FormEvent,
  type MouseEvent as ReactMouseEvent
} from 'react'
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

interface PlaceholderCard {
  id: string
  gradient: string
  border: string
  textClass: string
  label: string
}

const MAX_CAROUSEL_ITEMS = 7

const PLACEHOLDER_CARD_STYLES: Array<Omit<PlaceholderCard, 'label'>> = [
  {
    id: 'placeholder-1',
    gradient: 'from-blue-50 to-indigo-100',
    border: 'border-blue-300',
    textClass: 'text-blue-600'
  },
  {
    id: 'placeholder-2',
    gradient: 'from-purple-50 to-pink-100',
    border: 'border-purple-300',
    textClass: 'text-purple-600'
  },
  {
    id: 'placeholder-3',
    gradient: 'from-green-50 to-emerald-100',
    border: 'border-green-300',
    textClass: 'text-green-600'
  },
  {
    id: 'placeholder-4',
    gradient: 'from-orange-50 to-red-100',
    border: 'border-orange-300',
    textClass: 'text-orange-600'
  },
  {
    id: 'placeholder-5',
    gradient: 'from-red-50 to-rose-100',
    border: 'border-red-300',
    textClass: 'text-red-600'
  },
  {
    id: 'placeholder-6',
    gradient: 'from-cyan-50 to-sky-100',
    border: 'border-cyan-300',
    textClass: 'text-cyan-600'
  },
  {
    id: 'placeholder-7',
    gradient: 'from-yellow-50 to-amber-100',
    border: 'border-yellow-300',
    textClass: 'text-yellow-600'
  }
]

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
  const projectsScrollRef = useRef<HTMLDivElement | null>(null)
  const scrollThumbFrame = useRef<number | null>(null)
  const [isProjectsDragging, setIsProjectsDragging] = useState(false)
  const [scrollThumb, setScrollThumb] = useState({
    width: 0,
    left: 0,
    trackWidth: 0
  })

  useEffect(() => {
    checkAuth()
  }, [])

  const updateProjectsScrollThumb = useCallback(() => {
    const container = projectsScrollRef.current
    if (!container) {
      return
    }

    const { scrollWidth, clientWidth, scrollLeft } = container
    if (scrollWidth <= clientWidth || clientWidth === 0) {
      setScrollThumb({
        width: 0,
        left: 0,
        trackWidth: 0
      })
      return
    }

    const idealThumbWidth = (clientWidth / scrollWidth) * clientWidth
    const thumbWidth = Math.min(clientWidth, Math.max(48, idealThumbWidth))
    const maxThumbOffset = clientWidth - thumbWidth
    const progress = scrollLeft / (scrollWidth - clientWidth)

    setScrollThumb({
      width: thumbWidth,
      left: maxThumbOffset * progress,
      trackWidth: clientWidth
    })
  }, [])

  const scheduleProjectsScrollUpdate = useCallback(() => {
    if (scrollThumbFrame.current !== null) {
      return
    }

    scrollThumbFrame.current = requestAnimationFrame(() => {
      scrollThumbFrame.current = null
      updateProjectsScrollThumb()
    })
  }, [updateProjectsScrollThumb])

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
    projectsScrollRef.current = container
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
        setIsProjectsDragging(true)
      }
      container.scrollLeft = initialScrollLeft - walk
      scheduleProjectsScrollUpdate()
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

      setIsProjectsDragging(false)
      scheduleProjectsScrollUpdate()
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

  const recentProjects = projects.slice(0, MAX_CAROUSEL_ITEMS)
  const placeholderCards: PlaceholderCard[] = PLACEHOLDER_CARD_STYLES.slice(
    0,
    Math.max(0, MAX_CAROUSEL_ITEMS - recentProjects.length)
  ).map((style, index) => ({
    ...style,
    label:
      currentLanguage === 'en'
        ? `Card ${recentProjects.length + index + 1}`
        : `Карточка ${recentProjects.length + index + 1}`
  }))

  const carouselItems = [
    ...recentProjects.map((project) => ({ type: 'project' as const, project })),
    ...placeholderCards.map((card) => ({ type: 'placeholder' as const, card }))
  ]

  useEffect(() => {
    const container = projectsScrollRef.current
    if (!container) {
      return
    }

    const handleScroll = () => {
      scheduleProjectsScrollUpdate()
    }

    container.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', scheduleProjectsScrollUpdate)
    updateProjectsScrollThumb()

    return () => {
      container.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', scheduleProjectsScrollUpdate)
      if (scrollThumbFrame.current !== null) {
        cancelAnimationFrame(scrollThumbFrame.current)
        scrollThumbFrame.current = null
      }
    }
  }, [scheduleProjectsScrollUpdate, updateProjectsScrollThumb, carouselItems.length])

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
      <section className="grid grid-cols-[1fr_2rem]">
        {/* Хедер */}
        <div className="px-8">
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
        <div className="px-8 pb-4 mt-8">
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

        {/* Horizontal scroll container / card carousel */}
        <div className="relative col-span-2 pl-8 pr-12 pt-8 pb-4">
          <div
            ref={projectsScrollRef}
            className="relative flex gap-6 overflow-x-auto pb-6 scroll-smooth scrollbar-hide cursor-grab"
            data-projects-scroll
            data-dragging="false"
            onMouseDown={handleProjectsDragScroll}
            role="list"
            aria-label={currentLanguage === 'en' ? 'Recent projects' : 'Последние проекты'}
          >
            {carouselItems.map((item) => {
              if (item.type === 'project') {
                return (
                  <div
                    key={item.project.id}
                    className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                    role="listitem"
                  >
                    <ProjectCard
                      project={item.project}
                      formatDate={formatDate}
                      onOpenSettings={handleEditProject}
                      onEdit={handleEditProject}
                      menuLabels={{
                        settings: currentLanguage === 'en' ? 'Project settings' : 'Настройки проекта'
                      }}
                    />
                  </div>
                )
              }

              return (
                <div
                  key={item.card.id}
                  className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                  role="listitem"
                  aria-hidden="true"
                >
                  <div
                    className={`flex h-[170px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed bg-gradient-to-br px-6 text-center ${item.card.border} ${item.card.gradient}`}
                  >
                    <p className={`text-base font-semibold ${item.card.textClass}`}>
                      {item.card.label}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      {currentLanguage === 'en'
                        ? 'Reserved for your next project.'
                        : 'Здесь появится ваш следующий проект.'}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
          {scrollThumb.trackWidth > 0 && (
            <div
              className={`pointer-events-none absolute left-8 right-12 bottom-4 h-1 rounded-full bg-slate-200/70 transition-opacity duration-150 ${isProjectsDragging ? 'opacity-100' : 'opacity-0'} relative`}
            >
              <div
                className="absolute top-0 h-full rounded-full bg-slate-400/90 transition-[left,width] duration-150 ease-out"
                style={{
                  width: `${scrollThumb.width}px`,
                  left: `${scrollThumb.left}px`
                }}
              />
            </div>
          )}
          {carouselItems.length > 0 && (
            <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 bg-gradient-to-l from-white via-white/80 to-transparent sm:block" />
          )}
        </div>
      </section>
    </SidebarDemo>
  )
}
