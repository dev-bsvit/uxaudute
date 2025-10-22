'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Loader2,
  Share2,
  Users,
  Clock,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  FileText,
  TrendingUp
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSurvey, getSurveyResponses } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'
import type { Survey, SurveyResponse, SurveyQuestionInstance } from '@/types/survey'

export default function SurveyAnalyticsPage() {
  const router = useRouter()
  const params = useParams()
  const surveyId = params.id as string
  const { t, currentLanguage } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && surveyId) {
      loadData()
    }
  }, [user, surveyId])

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

  const loadData = async () => {
    try {
      const [surveyData, responsesData] = await Promise.all([
        getSurvey(surveyId),
        getSurveyResponses(surveyId)
      ])
      setSurvey(surveyData)
      setResponses(responsesData)
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Не удалось загрузить данные')
    }
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/public/survey/${surveyId}`
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована в буфер обмена!')
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} сек`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes} мин ${secs} сек`
  }

  const calculateQuestionStats = (question: SurveyQuestionInstance) => {
    // Найти все ответы на этот вопрос
    const questionAnswers = responses
      .map(r => r.answers.find(a => a.question_instance_id === question.instance_id))
      .filter(Boolean)

    if (question.type === 'yes-no') {
      const yesCount = questionAnswers.filter(a => a?.answer_yes_no === true).length
      const noCount = questionAnswers.filter(a => a?.answer_yes_no === false).length
      const total = yesCount + noCount
      return {
        type: 'yes-no',
        yes: { count: yesCount, percentage: total > 0 ? (yesCount / total) * 100 : 0 },
        no: { count: noCount, percentage: total > 0 ? (noCount / total) * 100 : 0 },
        total
      }
    } else if (question.type === 'rating') {
      const ratings = questionAnswers
        .map(a => a?.answer_rating)
        .filter((n): n is number => n !== undefined && n !== null)
      const average = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: ratings.filter(r => r === rating).length
      }))
      return {
        type: 'rating',
        average: average.toFixed(1),
        distribution,
        total: ratings.length
      }
    } else if (question.type === 'scale') {
      const scales = questionAnswers
        .map(a => a?.answer_scale)
        .filter((n): n is number => n !== undefined && n !== null)
      const average = scales.length > 0 ? scales.reduce((a, b) => a + b, 0) / scales.length : 0
      return {
        type: 'scale',
        average: average.toFixed(1),
        total: scales.length
      }
    } else {
      return {
        type: 'text',
        answers: questionAnswers.map(a => a?.answer_text).filter(Boolean) as string[],
        total: questionAnswers.length
      }
    }
  }

  const renderQuestionAnalytics = (question: SurveyQuestionInstance, index: number) => {
    const stats = calculateQuestionStats(question)
    const questionText = currentLanguage === 'ru' ? question.text_ru : question.text_en

    return (
      <Card key={question.instance_id} className="p-6">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">
              {index + 1}. {questionText}
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {stats.total} {stats.total === 1 ? 'ответ' : stats.total < 5 ? 'ответа' : 'ответов'}
            </p>
          </div>

          {stats.type === 'yes-no' && 'yes' in stats && 'no' in stats && (() => {
            const yesNoStats = stats as typeof stats & { yes: { count: number; percentage: number }; no: { count: number; percentage: number } }
            return (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium">Да</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {yesNoStats.yes.count} ({yesNoStats.yes.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${yesNoStats.yes.percentage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium">Нет</span>
                    </div>
                    <span className="text-sm font-semibold">
                      {yesNoStats.no.count} ({yesNoStats.no.percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${yesNoStats.no.percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          })()}

          {stats.type === 'rating' && 'average' in stats && 'distribution' in stats && (() => {
            const ratingStats = stats as typeof stats & { average: string; distribution: Array<{ rating: number; count: number }> }
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                  <TrendingUp className="w-6 h-6" />
                  {ratingStats.average} / 5
                </div>
                <div className="space-y-2">
                  {ratingStats.distribution.slice().reverse().map(({ rating, count }) => (
                    <div key={rating} className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{rating} ★</span>
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-500"
                          style={{
                            width: `${stats.total > 0 ? (count / stats.total) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {stats.type === 'scale' && 'average' in stats && (() => {
            const scaleStats = stats as typeof stats & { average: string }
            return (
              <div className="flex items-center gap-2 text-2xl font-bold text-blue-600">
                <BarChart3 className="w-6 h-6" />
                {scaleStats.average} / 10
              </div>
            )
          })()}

          {stats.type === 'text' && 'answers' in stats && (() => {
            const textStats = stats as typeof stats & { answers: string[] }
            return (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {textStats.answers.length === 0 ? (
                  <p className="text-sm text-slate-500 italic">Нет ответов</p>
                ) : (
                  textStats.answers.map((answer, idx) => (
                    <Card key={idx} className="p-3 bg-slate-50">
                      <p className="text-sm text-slate-700">{answer}</p>
                    </Card>
                  ))
                )}
              </div>
            )
          })()}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !survey) return null

  const avgCompletionTime = survey.avg_completion_time || 0

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Опросы', href: '/surveys' },
              { label: survey.name, href: `/surveys/${survey.id}` },
              { label: 'Аналитика' }
            ]}
            title="Аналитика опроса"
            subtitle={survey.name}
          />
        </div>

        <div className="px-8">
          <div className="max-w-7xl space-y-8">
            {/* Общая статистика */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Всего ответов</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {survey.responses_count || 0}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Среднее время</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {avgCompletionTime > 0 ? formatTime(Math.round(avgCompletionTime)) : '—'}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Вопросов</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {survey.main_questions.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Кнопка поделиться */}
            <div>
              <Button onClick={handleCopyLink} variant="outline">
                <Share2 className="w-4 h-4 mr-2" />
                Скопировать ссылку на опрос
              </Button>
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Результаты по вопросам */}
            {responses.length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Пока нет ответов
                </h3>
                <p className="text-slate-600 mb-4">
                  Поделитесь ссылкой на опрос, чтобы начать собирать отзывы
                </p>
                <Button onClick={handleCopyLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  Скопировать ссылку
                </Button>
              </Card>
            ) : (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Результаты по вопросам
                </h2>
                <div className="space-y-6">
                  {survey.main_questions.map((question, index) =>
                    renderQuestionAnalytics(question, index)
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
