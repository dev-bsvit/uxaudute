'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Users,
  Clock,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  FileText,
  TrendingUp,
  Copy
} from 'lucide-react'
import { Survey, SurveyResponse, SurveyQuestionInstance } from '@/types/survey'
import { getSurveyResponses } from '@/lib/database'

interface ResultsTabProps {
  survey: Survey
  currentLanguage: 'ru' | 'en'
}

export function ResultsTab({ survey, currentLanguage }: ResultsTabProps) {
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loadingResponses, setLoadingResponses] = useState(true)

  useEffect(() => {
    loadResponses()
  }, [survey.id])

  const loadResponses = async () => {
    setLoadingResponses(true)
    try {
      const responsesData = await getSurveyResponses(survey.id)
      setResponses(responsesData)
    } catch (error) {
      console.error('Error loading responses:', error)
    } finally {
      setLoadingResponses(false)
    }
  }

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds} сек`
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes} мин ${secs} сек`
  }

  const handleCopyLink = () => {
    const link = `${window.location.origin}/public/survey/${survey.id}`
    navigator.clipboard.writeText(link)
    alert('Ссылка скопирована в буфер обмена!')
  }

  const calculateQuestionStats = (question: SurveyQuestionInstance) => {
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

  if (loadingResponses) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl">
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
                {survey.avg_completion_time && survey.avg_completion_time > 0
                  ? formatTime(Math.round(survey.avg_completion_time))
                  : '—'}
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
                {survey.main_questions?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Кнопка поделиться */}
      {survey.status === 'published' && (
        <div>
          <Button onClick={handleCopyLink} variant="outline">
            <Copy className="w-4 h-4 mr-2" />
            Скопировать ссылку на опрос
          </Button>
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
          {survey.status === 'published' && (
            <Button onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2" />
              Скопировать ссылку
            </Button>
          )}
        </Card>
      ) : (
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Результаты по вопросам
          </h2>
          <div className="space-y-6">
            {survey.main_questions?.map((question, index) =>
              renderQuestionAnalytics(question, index)
            )}
          </div>
        </div>
      )}
    </div>
  )
}
