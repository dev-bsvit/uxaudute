'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { Loader2, Rocket } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createSurvey } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'

export default function CreateSurveyPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { t, currentLanguage } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  // Форма
  const [surveyName, setSurveyName] = useState('')

  // Процесс создания
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

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

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      setError('Не удалось загрузить проект')
    }
  }

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!surveyName.trim()) {
      setError('Введите название опроса')
      return
    }

    if (!user) {
      setError('Пользователь не авторизован')
      return
    }

    try {
      setCreating(true)
      setError(null)

      // Создаем опрос с базовыми данными
      const survey = await createSurvey(
        surveyName,
        projectId
      )

      // Перенаправляем на страницу редактирования опроса, где будет визард
      router.push(`/surveys/${survey.id}`)

    } catch (error) {
      console.error('Error creating survey:', error)
      setError(error instanceof Error ? error.message : 'Произошла ошибка')
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !project) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Проекты', href: '/projects' },
              { label: project.name, href: `/projects/${project.id}` },
              { label: 'Создать опрос' }
            ]}
            title="Создать опрос"
            subtitle={`Проект: ${project.name}`}
            showBackButton={true}
            onBack={() => router.push(`/projects/${projectId}`)}
          />
        </div>

        <div className="px-8">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  Начните создание опроса
                </h2>
                <p className="text-slate-600">
                  После создания вы попадете в 3-шаговый мастер настройки опроса
                </p>
              </div>

              <form onSubmit={handleCreateSurvey} className="space-y-6">
                <div>
                  <Label htmlFor="name" className="text-base font-semibold">
                    Название опроса *
                  </Label>
                  <Input
                    id="name"
                    value={surveyName}
                    onChange={(e) => setSurveyName(e.target.value)}
                    placeholder="Например: Опрос пользователей мобильного приложения"
                    className="mt-2"
                    required
                    disabled={creating}
                  />
                  <p className="text-sm text-slate-500 mt-2">
                    Вы сможете изменить название позже
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">
                    Что дальше?
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>✓ Шаг 1: Загрузите изображение и создайте вступительный экран</li>
                    <li>✓ Шаг 2: Добавьте вопросы (вручную, AI или из библиотеки)</li>
                    <li>✓ Шаг 3: Настройте экран благодарности</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={creating || !surveyName.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Создание...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Создать опрос
                    </>
                  )}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
