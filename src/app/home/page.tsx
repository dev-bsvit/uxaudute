'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProjects, getProjectAuditsForPreview, createProject, deleteProject } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import Link from 'next/link'
import { ProjectCard } from '@/components/project-card'
import { PageHeader } from '@/components/page-header'
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
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null)

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
    router.push(`/projects/${project.id}`)
  }

  const handleDeleteProject = async (project: Project) => {
    if (deletingProjectId && deletingProjectId !== project.id) {
      return
    }

    const confirmMessage =
      currentLanguage === 'en'
        ? 'Delete this project? All related audits will also be removed.'
        : 'Удалить этот проект? Все связанные аудиты тоже будут удалены.'

    const confirmed = window.confirm(confirmMessage)
    if (!confirmed) {
      return
    }

    try {
      setDeletingProjectId(project.id)
      await deleteProject(project.id)
      await loadProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert(currentLanguage === 'en' ? 'Error deleting project' : 'Ошибка удаления проекта')
    } finally {
      setDeletingProjectId(null)
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

        <div className="px-8 space-y-8">

        {/* Последние проекты */}
        <div className="space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  formatDate={formatDate}
                  onEdit={() => handleEditProject(project)}
                  onDelete={() => handleDeleteProject(project)}
                  menuLabels={{
                    edit: currentLanguage === 'en' ? 'Edit project' : 'Редактировать проект',
                    delete: currentLanguage === 'en' ? 'Delete project' : 'Удалить проект'
                  }}
                />
              ))}
            </div>
          )}
        </div>

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
