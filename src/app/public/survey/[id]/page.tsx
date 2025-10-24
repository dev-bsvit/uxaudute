'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft, ExternalLink } from 'lucide-react'
import { getSurvey, submitSurveyResponse } from '@/lib/database'
import type { Survey, SurveyQuestionInstance, SurveyAnswer } from '@/types/survey'
import Image from 'next/image'

type SurveyStage = 'intro' | 'questions' | 'thankyou' | 'error'

export default function PublicSurveyPage() {
  const params = useParams()
  const surveyId = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Stage management
  const [stage, setStage] = useState<SurveyStage>('intro')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  // Answers
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [startTime] = useState<number>(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())

  useEffect(() => {
    loadSurvey()
  }, [surveyId])

  const loadSurvey = async () => {
    try {
      const surveyData = await getSurvey(surveyId)

      if (surveyData.status !== 'published') {
        setError('Этот опрос недоступен для прохождения')
        setStage('error')
        return
      }

      setSurvey(surveyData)

      // Если нет intro screen, сразу переходим к вопросам
      if (!surveyData.intro_title || !surveyData.intro_description) {
        setStage('questions')
      }
    } catch (error) {
      console.error('Error loading survey:', error)
      setError('Не удалось загрузить опрос')
      setStage('error')
    } finally {
      setLoading(false)
    }
  }

  const handleStartSurvey = () => {
    setStage('questions')
    setQuestionStartTime(Date.now())
  }

  const handleAnswerChange = (value: any) => {
    if (!survey) return
    const currentQuestion = survey.main_questions[currentQuestionIndex]
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.instance_id]: value
    }))
  }

  const handleNext = () => {
    if (!survey) return

    // Если это последний вопрос, переходим к thank you
    if (currentQuestionIndex >= survey.main_questions.length - 1) {
      handleSubmit()
    } else {
      setCurrentQuestionIndex(prev => prev + 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
      setQuestionStartTime(Date.now())
    }
  }

  const handleSubmit = async () => {
    if (!survey) return

    try {
      setSubmitting(true)
      setError(null)

      const completionTime = Math.floor((Date.now() - startTime) / 1000)
      const now = new Date().toISOString()

      // Преобразуем answers в формат SurveyAnswer[]
      const formattedAnswers: SurveyAnswer[] = survey.main_questions
        .filter(q => answers[q.instance_id] !== undefined)
        .map(q => {
          const answer = answers[q.instance_id]
          return {
            question_instance_id: q.instance_id,
            question_id: q.id,
            question_text: q.text_ru,
            question_type: q.type,
            answer_yes_no: q.type === 'yes-no' ? answer : undefined,
            answer_text: q.type === 'text' ? answer : undefined,
            answer_rating: q.type === 'rating' ? answer : undefined,
            answer_scale: q.type === 'scale' ? answer : undefined,
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

      setStage('thankyou')
    } catch (error) {
      console.error('Error submitting survey:', error)
      setError('Не удалось отправить ответы. Попробуйте еще раз.')
    } finally {
      setSubmitting(false)
    }
  }

  const getCurrentAnswer = () => {
    if (!survey) return undefined
    const currentQuestion = survey.main_questions[currentQuestionIndex]
    return answers[currentQuestion.instance_id]
  }

  const isCurrentAnswerValid = () => {
    if (!survey) return false
    const currentQuestion = survey.main_questions[currentQuestionIndex]
    const answer = answers[currentQuestion.instance_id]

    if (!currentQuestion.required) return true

    if (currentQuestion.type === 'text') {
      return answer && answer.trim().length > 0
    }

    return answer !== undefined && answer !== null && answer !== ''
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Error state
  if (stage === 'error' || !survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            Опрос недоступен
          </h1>
          <p className="text-slate-600">
            {error || 'Этот опрос не найден или недоступен для прохождения.'}
          </p>
        </Card>
      </div>
    )
  }

  // Intro Screen
  if (stage === 'intro') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full overflow-hidden">
          {/* Image */}
          {survey.intro_image_url && (
            <div className="relative w-full h-96 bg-slate-100 flex items-center justify-center">
              <Image
                src={survey.intro_image_url}
                alt={survey.intro_title || 'Survey intro'}
                fill
                className="object-contain p-4"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              {survey.intro_title || survey.name}
            </h1>
            <p className="text-lg text-slate-600 mb-8 whitespace-pre-wrap">
              {survey.intro_description || survey.description}
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-slate-500 mb-8">
              <span>{survey.main_questions.length} вопросов</span>
              <span>•</span>
              <span>~{Math.ceil(survey.main_questions.length * 0.5)} мин</span>
            </div>

            <Button
              onClick={handleStartSurvey}
              size="lg"
              className="px-8"
            >
              Начать опрос
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Questions Flow
  if (stage === 'questions') {
    const currentQuestion = survey.main_questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / survey.main_questions.length) * 100
    const currentAnswer = getCurrentAnswer()

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700">
                Вопрос {currentQuestionIndex + 1} из {survey.main_questions.length}
              </span>
              <span className="text-sm text-slate-600">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="h-2 bg-white rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <Card className="overflow-hidden">
            {/* Image */}
            {survey.intro_image_url && (
              <div className="relative w-full h-80 bg-slate-100 flex items-center justify-center">
                <Image
                  src={survey.intro_image_url}
                  alt="Survey screenshot"
                  fill
                  className="object-contain p-4"
                />
              </div>
            )}

            {/* Question */}
            <div className="p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                {currentQuestion.text_ru}
              </h2>

              {/* Answer Input */}
              <div className="mb-8">
                {currentQuestion.type === 'yes-no' && (
                  <div className="flex gap-4">
                    <Button
                      variant={currentAnswer === true ? 'default' : 'outline'}
                      onClick={() => handleAnswerChange(true)}
                      className="flex-1 h-16"
                    >
                      Да
                    </Button>
                    <Button
                      variant={currentAnswer === false ? 'default' : 'outline'}
                      onClick={() => handleAnswerChange(false)}
                      className="flex-1 h-16"
                    >
                      Нет
                    </Button>
                  </div>
                )}

                {currentQuestion.type === 'rating' && (
                  <div className="flex gap-2 justify-center">
                    {[1, 2, 3, 4, 5].map(rating => (
                      <Button
                        key={rating}
                        variant={currentAnswer === rating ? 'default' : 'outline'}
                        onClick={() => handleAnswerChange(rating)}
                        className="w-16 h-16 text-xl"
                      >
                        {rating}
                      </Button>
                    ))}
                  </div>
                )}

                {currentQuestion.type === 'scale' && (
                  <div>
                    <Input
                      type="range"
                      min="1"
                      max="10"
                      value={currentAnswer || 5}
                      onChange={(e) => handleAnswerChange(parseInt(e.target.value))}
                      className="w-full mb-2"
                    />
                    <div className="flex justify-between text-sm text-slate-600">
                      <span>1</span>
                      <span className="font-semibold text-lg text-blue-600">
                        {currentAnswer || 5}
                      </span>
                      <span>10</span>
                    </div>
                  </div>
                )}

                {currentQuestion.type === 'text' && (
                  <Textarea
                    value={currentAnswer || ''}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    placeholder="Введите ваш ответ..."
                    rows={4}
                    className="resize-none"
                  />
                )}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>

                <Button
                  onClick={handleNext}
                  disabled={!isCurrentAnswerValid() || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : currentQuestionIndex >= survey.main_questions.length - 1 ? (
                    'Завершить'
                  ) : (
                    <>
                      Далее
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
  }

  // Thank You Screen
  if (stage === 'thankyou') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full p-12 text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Опрос завершен!
          </h1>

          {/* Thank You Text */}
          <p className="text-lg text-slate-600 mb-8 whitespace-pre-wrap">
            {survey.thank_you_text || 'Спасибо за ваше время и ценные ответы! Ваше мнение поможет нам стать лучше.'}
          </p>

          {/* Promo Code */}
          {survey.thank_you_promo_code && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 max-w-md mx-auto mb-6">
              <p className="text-sm text-slate-600 mb-2">Ваш промокод:</p>
              <div className="flex items-center justify-center gap-3">
                <code className="text-3xl font-bold text-blue-600 tracking-wider">
                  {survey.thank_you_promo_code}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(survey.thank_you_promo_code!)
                    alert('Промокод скопирован!')
                  }}
                >
                  Копировать
                </Button>
              </div>
            </div>
          )}

          {/* Link */}
          {survey.thank_you_link && (
            <Button
              onClick={() => window.open(survey.thank_you_link, '_blank')}
              size="lg"
            >
              Перейти на сайт
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          )}
        </Card>
      </div>
    )
  }

  return null
}
