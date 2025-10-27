'use client'

import { useState } from 'react'
import { Step1Intro } from './step-1-intro'
import { Step2Questions } from './step-2-questions'
import { Step3ThankYou } from './step-3-thankyou'
import { Survey, SurveyQuestionInstance } from '@/types/survey'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Check, Circle } from 'lucide-react'
import Image from 'next/image'

interface SurveyWizardProps {
  survey: Survey
  onUpdate: (updates: Partial<Survey>) => Promise<void>
  onPublish: () => Promise<void>
  currentLanguage: 'ru' | 'en'
}

export function SurveyWizard({
  survey,
  onUpdate,
  onPublish,
  currentLanguage
}: SurveyWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)

  // Проверка завершенности каждого шага
  const isStep1Complete = !!(survey.intro_image_url && survey.intro_title && survey.intro_description)
  const isStep2Complete = !!(survey.main_questions && survey.main_questions.length > 0)
  const isStep3Complete = !!survey.thank_you_text

  const isAllComplete = isStep1Complete && isStep2Complete && isStep3Complete

  const handleStep1Update = async (data: {
    intro_image_url?: string
    intro_title?: string
    intro_description?: string
  }) => {
    setSaving(true)
    try {
      await onUpdate(data)
    } catch (error) {
      console.error('Error updating step 1:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleStep2Update = async (questions: SurveyQuestionInstance[]) => {
    setSaving(true)
    try {
      await onUpdate({ main_questions: questions })
    } catch (error) {
      console.error('Error updating step 2:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleStep3Update = async (data: {
    thank_you_text?: string
    thank_you_link?: string
    thank_you_promo_code?: string
  }) => {
    setSaving(true)
    try {
      await onUpdate(data)
    } catch (error) {
      console.error('Error updating step 3:', error)
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!isAllComplete) {
      alert('Завершите все шаги перед публикацией')
      return
    }
    setPublishing(true)
    try {
      await onPublish()
    } catch (error) {
      console.error('Error publishing:', error)
      alert('Не удалось опубликовать опрос')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Колонка 1: Шаги (sidebar) */}
      <div className="w-64 flex-shrink-0">
        <Card className="p-4 sticky top-4">
          <h3 className="font-semibold text-slate-900 mb-4">Шаги создания</h3>

          <div className="space-y-2">
            {/* Step 1 */}
            <button
              onClick={() => setCurrentStep(1)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentStep === 1
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  isStep1Complete ? 'bg-green-500' : 'bg-slate-200'
                }`}>
                  {isStep1Complete ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">Intro Screen</div>
                  <div className="text-xs text-slate-500">Изображение и описание</div>
                </div>
              </div>
            </button>

            {/* Step 2 */}
            <button
              onClick={() => setCurrentStep(2)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentStep === 2
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  isStep2Complete ? 'bg-green-500' : 'bg-slate-200'
                }`}>
                  {isStep2Complete ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">Вопросы</div>
                  <div className="text-xs text-slate-500">
                    {survey.main_questions?.length || 0} вопросов
                  </div>
                </div>
              </div>
            </button>

            {/* Step 3 */}
            <button
              onClick={() => setCurrentStep(3)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                currentStep === 3
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white border-2 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                  isStep3Complete ? 'bg-green-500' : 'bg-slate-200'
                }`}>
                  {isStep3Complete ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-900">Thank You</div>
                  <div className="text-xs text-slate-500">Экран благодарности</div>
                </div>
              </div>
            </button>
          </div>

          {/* Кнопка публикации */}
          {survey.status === 'draft' && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={handlePublish}
                disabled={!isAllComplete || publishing}
                className="w-full"
                size="lg"
              >
                {publishing ? 'Публикация...' : 'Опубликовать опрос'}
              </Button>
              {!isAllComplete && (
                <p className="text-xs text-slate-500 mt-2 text-center">
                  Завершите все шаги
                </p>
              )}
            </div>
          )}

          {survey.status === 'published' && (
            <div className="mt-6 pt-6 border-t">
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Опубликован</span>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Колонка 2: Основное поле с формами */}
      <div className="flex-1 min-w-0">
        {currentStep === 1 && (
          <Step1Intro
            introImageUrl={survey.intro_image_url}
            introTitle={survey.intro_title}
            introDescription={survey.intro_description}
            onUpdate={handleStep1Update}
          />
        )}

        {currentStep === 2 && (
          <Step2Questions
            questions={survey.main_questions || []}
            introImageUrl={survey.intro_image_url}
            onUpdate={handleStep2Update}
            onBack={() => setCurrentStep(1)}
            onNext={() => setCurrentStep(3)}
            currentLanguage={currentLanguage}
          />
        )}

        {currentStep === 3 && (
          <Step3ThankYou
            thankYouText={survey.thank_you_text}
            thankYouLink={survey.thank_you_link}
            thankYouPromoCode={survey.thank_you_promo_code}
            onUpdate={handleStep3Update}
            onBack={() => setCurrentStep(2)}
            onComplete={() => {}}
          />
        )}
      </div>

      {/* Колонка 3: Превью изображения */}
      <div className="w-80 flex-shrink-0">
        <Card className="p-4 sticky top-4">
          <h3 className="font-semibold text-slate-900 mb-4">Превью</h3>

          {survey.intro_image_url ? (
            <div className="space-y-4">
              <div className="relative w-full h-48 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
                <Image
                  src={survey.intro_image_url}
                  alt="Survey preview"
                  fill
                  className="object-contain p-2"
                />
              </div>

              {survey.intro_title && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">
                    {survey.intro_title}
                  </h4>
                </div>
              )}

              {survey.intro_description && (
                <p className="text-sm text-slate-600">
                  {survey.intro_description}
                </p>
              )}

              {survey.main_questions && survey.main_questions.length > 0 && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-slate-500 mb-2">Вопросы:</div>
                  <div className="text-sm font-medium text-slate-900">
                    {survey.main_questions.length} {survey.main_questions.length === 1 ? 'вопрос' : 'вопросов'}
                  </div>
                </div>
              )}

              {survey.thank_you_text && (
                <div className="pt-4 border-t">
                  <div className="text-xs text-slate-500 mb-2">Благодарность:</div>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {survey.thank_you_text}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Circle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500">
                Загрузите изображение<br />на первом шаге
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Индикатор сохранения */}
      {saving && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          Сохранение...
        </div>
      )}
    </div>
  )
}
