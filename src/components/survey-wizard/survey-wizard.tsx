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
    <div className="px-4">
      <div className="flex gap-6 max-w-[1088px]">
        {/* Left Column: Main Content - 536px */}
        <div className="w-[536px] flex-shrink-0">
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

        {/* Right Column: Hint/Preview Card - 530px */}
        <div className="w-[530px] flex-shrink-0">
          <div className="bg-[#CAEEF7] rounded-[24px] p-10 h-[322px] flex gap-8">
            {/* Mini Preview - Left */}
            {survey.intro_image_url && (
              <div className="w-[99px] h-[214px] flex-shrink-0">
                <div className="relative w-full h-full rounded-lg bg-white shadow-sm overflow-hidden">
                  <Image
                    src={survey.intro_image_url}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}

            {/* Hint Text - Right */}
            <div className="flex-1 flex flex-col justify-center">
              <h3 className="text-xl font-medium leading-[22px] tracking-[-0.2px] text-[#1F1F1F] mb-4">
                Экран ообавления карты
              </h3>
              <p className="text-base leading-[17.12px] text-[#1F1F1F]">
                Оцените удобсто и расположения элементов после прохождения тестов вам будет предоставлен подарочный сертификат
              </p>
            </div>
          </div>
        </div>
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
