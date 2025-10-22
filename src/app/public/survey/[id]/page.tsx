'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSurvey, submitSurveyResponse } from '@/lib/database'
import type { Survey, SurveyQuestionInstance } from '@/types/survey'

export default function PublicSurveyPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [startTime] = useState<number>(Date.now())

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      const surveyData = await getSurvey(surveyId)

      if (surveyData.status !== 'published') {
        setError('Этот опрос недоступен для прохождения')
        return
      }

      setSurvey(surveyData)
    } catch (error) {
      console.error('Error loading survey:', error)
      setError('Не удалось загрузить опрос')
    } finally {
      setLoading(false)
    }
  }

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!survey) return

    // Проверка обязательных вопросов
    const requiredQuestions = survey.main_questions.filter(q => q.required)
    const missingAnswers = requiredQuestions.filter(q => !answers[q.instance_id]?.trim())

    if (missingAnswers.length > 0) {
      setError('Пожалуйста, ответьте на все обязательные вопросы')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      const completionTime = Math.floor((Date.now() - startTime) / 1000) // в секундах
      const now = new Date().toISOString()

      // Преобразуем answers в формат SurveyAnswer[]
      const formattedAnswers = survey.main_questions
        .filter(q => answers[q.instance_id])
        .map(q => {
          const answer = answers[q.instance_id]
          return {
            question_instance_id: q.instance_id,
            question_id: q.id,
            question_text: q.text_ru,
            question_type: q.type,
            answer_yes_no: q.type === 'yes-no' ? answer === 'yes' : undefined,
            answer_text: q.type === 'text' ? answer : undefined,
            answer_rating: q.type === 'rating' ? parseInt(answer) : undefined,
            answer_scale: q.type === 'scale' ? parseInt(answer) : undefined,
            answered_at: now,
            time_spent_seconds: 0
          }
        })

      await submitSurveyResponse({
        survey_id: survey.id,
        answers: formattedAnswers,
        started_at: new Date(startTime).toISOString(),
        completed_at: now,
        completion_time_seconds: completionTime,
        user_agent: navigator.userAgent
      })

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting survey:', error)
      setError('Не удалось отправить ответы. Попробуйте еще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderQuestion = (question: SurveyQuestionInstance, index: number) => {
    const answer = answers[question.instance_id] || ''

    return (
      <Card key={question.instance_id} className="p-6">
        <div className="space-y-4">
          <div>
            <Label className="text-base font-semibold text-slate-900">
              {index + 1}. {question.text_ru}
              {question.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {question.required && (
              <p className="text-xs text-slate-500 mt-1">Обязательный вопрос</p>
            )}
          </div>

          {question.type === 'yes-no' ? (
            <div className="flex gap-3">
              <Button
                type="button"
                variant={answer === 'yes' ? 'default' : 'outline'}
                onClick={() => handleAnswerChange(question.instance_id, 'yes')}
                className={answer === 'yes' ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                Да
              </Button>
              <Button
                type="button"
                variant={answer === 'no' ? 'default' : 'outline'}
                onClick={() => handleAnswerChange(question.instance_id, 'no')}
                className={answer === 'no' ? 'bg-red-600 hover:bg-red-700' : ''}
              >
                Нет
              </Button>
            </div>
          ) : question.type === 'rating' ? (
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <Button
                  key={rating}
                  type="button"
                  variant={answer === String(rating) ? 'default' : 'outline'}
                  onClick={() => handleAnswerChange(question.instance_id, String(rating))}
                  className="w-12 h-12"
                >
                  {rating}
                </Button>
              ))}
            </div>
          ) : question.type === 'scale' ? (
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="10"
                value={answer || '5'}
                onChange={(e) => handleAnswerChange(question.instance_id, e.target.value)}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-slate-600">
                <span>0</span>
                <span className="font-semibold">{answer || '5'}</span>
                <span>10</span>
              </div>
            </div>
          ) : (
            <Textarea
              value={answer}
              onChange={(e) => handleAnswerChange(question.instance_id, e.target.value)}
              placeholder="Введите ваш ответ..."
              rows={4}
              className="w-full"
            />
          )}
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="p-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">
            Опрос недоступен
          </h2>
          <p className="text-slate-600">{error}</p>
        </Card>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mb-2">
            Спасибо за участие!
          </h2>
          <p className="text-slate-600">
            Ваши ответы успешно отправлены и помогут улучшить продукт.
          </p>
        </Card>
      </div>
    )
  }

  if (!survey) return null

  const progress = (Object.keys(answers).length / survey.main_questions.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Заголовок */}
        <Card className="p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {survey.name}
          </h1>
          {survey.description && (
            <p className="text-slate-600 text-lg">
              {survey.description}
            </p>
          )}
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <span>{survey.main_questions.length} вопросов</span>
            <span>•</span>
            <span>Примерно {Math.ceil(survey.main_questions.length * 0.5)} минут</span>
          </div>
        </Card>

        {/* Прогресс */}
        {Object.keys(answers).length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Прогресс</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Форма */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {survey.main_questions.map((question, index) =>
            renderQuestion(question, index)
          )}

          {/* Ошибка */}
          {error && (
            <Card className="p-4 bg-red-50 border-red-200">
              <p className="text-sm text-red-800">{error}</p>
            </Card>
          )}

          {/* Кнопка отправки */}
          <Card className="p-6">
            <Button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-lg"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Отправка...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Отправить ответы
                </>
              )}
            </Button>
          </Card>
        </form>
      </div>
    </div>
  )
}
