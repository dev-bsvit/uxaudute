'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, AlertCircle, ArrowRight, ArrowLeft } from 'lucide-react'
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
  const [promoCopied, setPromoCopied] = useState(false)

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
      <div className="min-h-screen bg-[#f4f5fb] flex items-center justify-center p-4">
        {/* Карточка: 528×312px (область скриншота), радиус 32px, тень, отступы 16px */}
        <div
          className="w-full max-w-[528px] rounded-[32px] bg-white flex flex-col"
          style={{
            boxShadow: '0 36px 72px rgba(25, 26, 39, 0.08)',
            padding: '16px'
          }}
        >
          {/* Область превью: 100% ширины × 312px высота, фон #F7F7F8 */}
          <div className="w-full h-[312px] rounded-lg bg-[#F7F7F8] flex items-center justify-center mb-4">
            {survey.intro_image_url ? (
              <div className="relative w-[180px] h-[280px]">
                <Image
                  src={survey.intro_image_url}
                  alt={survey.intro_title || survey.name}
                  fill
                  className="object-cover rounded-lg"
                />
              </div>
            ) : (
              <div className="w-[180px] h-[180px] flex items-center justify-center rounded-[24px] bg-[#eef2fa]">
                <span className="text-xs font-semibold text-[#6c6c89]">
                  Превью недоступно
                </span>
              </div>
            )}
          </div>

          {/* Заголовок: растянут на всю ширину */}
          <h1
            className="text-[20px] sm:text-[24px] font-bold leading-[1.1] tracking-[-0.28px] text-[#1f1f1f] text-center w-full mb-4"
            style={{ fontFamily: 'Inter Display, sans-serif' }}
          >
            {survey.intro_title || survey.name}
          </h1>

          {/* Описание: растянуто на всю ширину */}
          <p
            className="text-base leading-[1.35] text-[#6c6c89] text-center w-full mb-4"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            {(survey.intro_description || survey.description) ?? ''}
          </p>

          {/* Кнопка: по центру */}
          <button
            onClick={handleStartSurvey}
            className="w-[220px] h-[52px] rounded-[26px] bg-[#0058fc] text-white text-base font-medium tracking-[-0.16px] hover:bg-[#0048d4] active:bg-[#003ec0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,88,252,0.24)] transition-all disabled:bg-[#d1d1db] disabled:text-[#6c6c89] disabled:cursor-not-allowed mx-auto"
            style={{ fontFamily: 'Inter Display, sans-serif' }}
          >
            Начать опрос
          </button>
        </div>
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
    const thankYouText = survey.thank_you_text || 'Спасибо за ваше время и ценные ответы! Ваше мнение поможет нам стать лучше.'

    return (
      <div className="min-h-screen bg-[#f4f5fb] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] rounded-[32px] bg-white shadow-[0_36px_72px_rgba(25,26,39,0.08)] overflow-hidden flex flex-col items-center p-10 text-center">
          {survey.thank_you_image_url ? (
            <div className="relative mb-8 h-[200px] w-[200px]">
              <Image
                src={survey.thank_you_image_url}
                alt="Иллюстрация завершения"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="mb-8 flex h-[200px] w-[200px] items-center justify-center rounded-[24px] bg-[#eef2fa] text-sm text-slate-500">
              Спасибо!
            </div>
          )}

          <div className="h-px w-full bg-[#f2f2f5]" />

          <h1 className="mt-8 text-2xl font-bold text-slate-900">Опрос завершён!</h1>

          {survey.thank_you_promo_code && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <span className="text-xl font-semibold tracking-[0.08em] text-slate-900">
                {survey.thank_you_promo_code}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(survey.thank_you_promo_code!)
                  setPromoCopied(true)
                  setTimeout(() => setPromoCopied(false), 2500)
                }}
                className="h-10 rounded-[14px] border border-[#e0e0eb] px-4 text-sm font-medium text-slate-900 transition-colors hover:bg-[#f5f5f9]"
              >
                {promoCopied ? 'Скопировано' : 'Копировать'}
              </button>
            </div>
          )}

          <p className="mt-6 text-base leading-[1.45] text-slate-600 whitespace-pre-wrap max-w-[320px]">
            {thankYouText}
          </p>

          {survey.thank_you_link && (
            <Button
              onClick={() => window.open(survey.thank_you_link, '_blank')}
              className="mt-8 h-[52px] w-[220px] rounded-[26px] bg-[#0058fc] text-base font-medium tracking-[-0.16px] hover:bg-[#0048d4]"
            >
              Перейти по ссылке
            </Button>
          )}
        </div>
      </div>
    )
  }

  return null
}
