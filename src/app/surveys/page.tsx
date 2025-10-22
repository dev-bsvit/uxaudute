'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Loader2,
  Plus,
  Eye,
  Edit2,
  Share2,
  Trash2,
  BarChart3,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  XCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getUserSurveys, deleteSurvey } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'
import type { Survey } from '@/types/survey'

export default function SurveysPage() {
  const router = useRouter()
  const { t, currentLanguage } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      loadSurveys()
    }
  }, [user])

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
            subtitle="Создавайте AI-опросы и собирайте отзывы от пользователей"
          />
        </div>

        <div className="px-8">
          <div className="max-w-7xl space-y-6">
            {/* Кнопка создания */}
            <div>
              <Button
                onClick={() => router.push('/surveys/create')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать новый опрос
              </Button>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Список опросов */}
            {surveys.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  У вас пока нет опросов
                </h3>
                <p className="text-slate-600 mb-4">
                  Создайте первый AI-опрос, загрузив скриншот интерфейса
                </p>
                <Button
                  onClick={() => router.push('/surveys/create')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Создать опрос
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {surveys.map((survey) => (
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

                      {/* Скриншот (если есть) */}
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
                              Поделиться
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
            )}
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
