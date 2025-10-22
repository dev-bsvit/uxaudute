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
  FolderOpen,
  ChevronRight,
  Zap
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
  titleLines: [string, string, string]
  icon: LucideIcon
  backgroundColor: string
  iconBackgroundColor: string
  iconColor: string
  textColor: string
  ctaLabel: string
  ctaColor: string
  available: boolean
}

const MAX_RECENT_PROJECTS = 10

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

      const sortedProjects = [...projectsWithCounts].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      // Берем только последние проекты, ограничивая список 10 карточками
      setProjects(sortedProjects.slice(0, MAX_RECENT_PROJECTS))
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
      titleLines: currentLanguage === 'en'
        ? ['UX audit with expert', 'recommendations tailored', 'for your product goals']
        : ['UX-анализ с экспертными', 'рекомендациями под ваши', 'продуктовые цели'],
      icon: BarChart3,
      backgroundColor: '#E8DDF9',
      iconBackgroundColor: '#6C2EFF',
      iconColor: '#FFFFFF',
      textColor: '#3C5862',
      ctaLabel: currentLanguage === 'en' ? 'Start audit' : 'Начать аудит',
      ctaColor: '#6C2EFF',
      available: true
    },
    {
      id: 'ab-test-plans',
      titleLines: currentLanguage === 'en'
        ? ['A/B tests with ready', 'technical specs to launch', 'insight-driven experiments']
        : ['A/B тесты с готовым ТЗ', 'для быстрого запуска', 'UX-экспериментов'],
      icon: TestTube2,
      backgroundColor: '#CAEEF7',
      iconBackgroundColor: '#003EF2',
      iconColor: '#FFFFFF',
      textColor: '#3C5862',
      ctaLabel: currentLanguage === 'en' ? 'Start audit' : 'Начать аудит',
      ctaColor: '#003EF2',
      available: true
    },
    {
      id: 'ab-test-templates',
      titleLines: currentLanguage === 'en'
        ? ['Template library for A/B', 'tests that accelerate your', 'growth experiments']
        : ['Библиотека шаблонов A/B', 'тестов для ускорения', 'роста продукта'],
      icon: TrendingUp,
      backgroundColor: '#E9E9E9',
      iconBackgroundColor: '#6944BE',
      iconColor: '#FFFFFF',
      textColor: '#3C5862',
      ctaLabel: currentLanguage === 'en' ? 'Start audit' : 'Начать аудит',
      ctaColor: '#6944BE',
      available: true
    },
    {
      id: 'custom-surveys',
      titleLines: currentLanguage === 'en'
        ? ['Custom research surveys', 'collect feedback aligned', 'with your design']
        : ['Кастомные исследования', 'собирают нужную обратную', 'связь по дизайну'],
      icon: Lightbulb,
      backgroundColor: '#E0ECDC',
      iconBackgroundColor: '#3C5862',
      iconColor: '#FFFFFF',
      textColor: '#3C5862',
      ctaLabel: currentLanguage === 'en' ? 'Start audit' : 'Начать аудит',
      ctaColor: '#3C5862',
      available: true
    },
    {
      id: 'coming-soon',
      titleLines: currentLanguage === 'en'
        ? ['All-in-one growth kit', 'to supercharge product', 'teams coming soon']
        : ['Комплексный growth-kit', 'для прокачки продукта', 'совсем скоро'],
      icon: Zap,
      backgroundColor: '#E8DDF9',
      iconBackgroundColor: '#AB72AE',
      iconColor: '#FFFFFF',
      textColor: '#3C5862',
      ctaLabel: currentLanguage === 'en' ? 'Coming soon' : 'Скоро',
      ctaColor: '#AB72AE',
      available: false
    }
  ]

  const recentProjects = projects.slice(0, MAX_RECENT_PROJECTS)
  const carouselItems = [
    ...recentProjects.map((project) => ({ type: 'project' as const, project })),
    { type: 'view-all' as const }
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
      <div className="space-y-12">
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
                    key="view-all-card"
                    className="flex-shrink-0 w-[280px] sm:w-[320px] md:w-[360px]"
                    role="listitem"
                  >
                    <Link
                      href="/projects"
                      className="group flex h-[170px] w-full flex-col items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 px-6 text-center text-slate-700 transition-colors hover:bg-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                    >
                      <FolderOpen className="mb-3 h-8 w-8 text-slate-500 transition-colors group-hover:text-slate-600" />
                      <p className="text-base font-semibold">
                        {currentLanguage === 'en' ? 'See all projects' : 'Перейти ко всем проектам'}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {currentLanguage === 'en'
                          ? 'Browse your entire project library.'
                          : 'Посмотрите все созданные проекты.'}
                      </p>
                    </Link>
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

        {/* Блок инструментов */}
        <section className="px-8 pb-16">
          <div className="w-full">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">All tools</h2>
              <p className="mt-2 text-sm text-slate-600">
                {currentLanguage === 'en'
                  ? 'Choose a tool to launch a new research.'
                  : 'Выберите инструмент, чтобы создать новое исследование.'}
              </p>
            </div>
            <div className="mt-6 flex flex-wrap items-stretch gap-5">
              {researchCards.map((card) => {
                const Icon = card.icon
                return (
                  <div
                    key={card.id}
                    className="flex min-h-[240px] flex-col rounded-[32px] p-6"
                    style={{ backgroundColor: card.backgroundColor, flex: '0 0 264px' }}
                  >
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-full"
                      style={{ backgroundColor: card.iconBackgroundColor }}
                    >
                      <Icon className="h-6 w-6" style={{ color: card.iconColor }} />
                    </div>
                    <div className="mt-4 flex flex-1 flex-col">
                      <h3 className="text-lg font-semibold leading-snug" style={{ color: card.textColor }}>
                        {card.titleLines.map((line, index) => (
                          <span key={`${card.id}-line-${index}`} className="block">
                            {line}
                          </span>
                        ))}
                      </h3>
                    </div>
                    <div className="mt-auto pt-4">
                      <button
                        type="button"
                        className={`text-sm font-medium transition-opacity ${
                          card.available
                            ? 'hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-300'
                            : 'cursor-not-allowed opacity-60'
                        }`}
                        style={{
                          color: card.available ? card.ctaColor : '#646464',
                          outlineColor: card.available ? card.ctaColor : '#646464'
                        }}
                        disabled={!card.available}
                        aria-disabled={!card.available}
                      >
                        {card.ctaLabel}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      </div>
    </SidebarDemo>
  )
}
