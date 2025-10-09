'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { getUserProjects, getProjectAudits, getUserRecentAudits, createProject } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import Link from 'next/link'
import {
  BarChart3,
  TestTube2,
  Lightbulb,
  TrendingUp,
  Plus,
  FolderOpen,
  Calendar,
  ChevronRight,
  Sparkles,
  Edit,
  FileText
} from 'lucide-react'

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  auditsCount?: number
}

interface Audit {
  id: string
  project_id: string
  name: string
  type: string
  status: string
  input_data: Record<string, unknown> | null
  created_at: string
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
  const [recentAudits, setRecentAudits] = useState<Audit[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

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
      const [userProjects, audits] = await Promise.all([
        getUserProjects(),
        getUserRecentAudits(4)
      ])

      // Загружаем количество аудитов для каждого проекта
      const projectsWithCounts = await Promise.all(
        userProjects.map(async (project) => {
          const audits = await getProjectAudits(project.id)
          return {
            ...project,
            auditsCount: audits.length
          }
        })
      )

      // Берем только последние 5 проектов
      setProjects(projectsWithCounts.slice(0, 5))
      setRecentAudits(audits)
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
      <div className="p-8 space-y-8">
        {/* Заголовок */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {currentLanguage === 'en' ? 'Welcome Back!' : 'Добро пожаловать!'}
            </h1>
            <p className="text-slate-600 mt-1">
              {currentLanguage === 'en'
                ? 'Overview of your research and projects'
                : 'Обзор ваших исследований и проектов'}
            </p>
          </div>
          <Button onClick={handleCreateProject} disabled={creating} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {creating
              ? (currentLanguage === 'en' ? 'Creating...' : 'Создание...')
              : (currentLanguage === 'en' ? 'New Project' : 'Новый проект')}
          </Button>
        </div>

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <Link key={project.id} href={`/projects/${project.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="w-5 h-5 text-blue-500" />
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <CardDescription>{project.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(project.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <BarChart3 className="w-4 h-4" />
                          {project.auditsCount || 0} {currentLanguage === 'en' ? 'audits' : 'аудитов'}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Последние аудиты */}
        {recentAudits.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-slate-900">
                {currentLanguage === 'en' ? 'Recent Audits' : 'Последние аудиты'}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentAudits.map((audit) => {
                const inputData = audit.input_data as { screenshot?: string; screenshotUrl?: string } | null
                const screenshotUrl = inputData?.screenshotUrl || inputData?.screenshot

                return (
                  <Link key={audit.id} href={`/audits/${audit.id}`}>
                    <div className="relative rounded-2xl h-[170px] bg-[#F5F5F5] hover:shadow-lg transition-shadow cursor-pointer">
                      <div className="flex h-full gap-4 p-4">
                        {/* Левая колонка - информация */}
                        <div className="flex-1 flex flex-col justify-between min-w-0">
                          {/* Название */}
                          <div>
                            <h3 className="font-semibold text-slate-900 line-clamp-2 break-words">
                              {audit.name}
                            </h3>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                              {audit.type === 'ux-analysis' && (currentLanguage === 'en' ? 'UX Analysis' : 'UX анализ')}
                              {audit.type === 'ab-test' && (currentLanguage === 'en' ? 'A/B Testing' : 'A/B тестирование')}
                              {audit.type === 'hypotheses' && (currentLanguage === 'en' ? 'Hypotheses' : 'Гипотезы')}
                              {audit.type === 'business-analytics' && (currentLanguage === 'en' ? 'Business Analytics' : 'Бизнес-аналитика')}
                            </p>
                          </div>

                          {/* Нижняя информация */}
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Edit className="w-3 h-3" />
                            <span>{formatDate(audit.created_at)}</span>
                            <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                              audit.status === 'completed' ? 'bg-green-100 text-green-700' :
                              audit.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {audit.status === 'completed' && (currentLanguage === 'en' ? 'Completed' : 'Завершен')}
                              {audit.status === 'in_progress' && (currentLanguage === 'en' ? 'In Progress' : 'В процессе')}
                              {audit.status === 'failed' && (currentLanguage === 'en' ? 'Failed' : 'Ошибка')}
                            </span>
                          </div>
                        </div>

                        {/* Правая колонка - скриншот */}
                        <div className="flex-shrink-0 w-[120px]">
                          {screenshotUrl ? (
                            <div className="w-full h-full rounded-lg overflow-hidden bg-white">
                              <img
                                src={screenshotUrl}
                                alt="Screenshot"
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-lg bg-white flex items-center justify-center">
                              <FileText className="w-8 h-8 text-slate-300" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

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
    </SidebarDemo>
  )
}
