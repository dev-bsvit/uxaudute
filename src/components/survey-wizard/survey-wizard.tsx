'use client'

import { useState } from 'react'
import { StepIndicator } from './step-indicator'
import { Step1Intro } from './step-1-intro'
import { Step2Questions } from './step-2-questions'
import { Step3ThankYou } from './step-3-thankyou'
import { Survey, SurveyQuestionInstance } from '@/types/survey'

interface SurveyWizardProps {
  survey: Survey
  onUpdate: (updates: Partial<Survey>) => Promise<void>
  onComplete: () => void
  currentLanguage: 'ru' | 'en'
}

export function SurveyWizard({
  survey,
  onUpdate,
  onComplete,
  currentLanguage
}: SurveyWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [saving, setSaving] = useState(false)

  const steps = [
    {
      number: 1 as const,
      title: 'Intro Screen',
      description: 'Изображение и описание'
    },
    {
      number: 2 as const,
      title: 'Вопросы',
      description: 'Формирование опроса'
    },
    {
      number: 3 as const,
      title: 'Thank You',
      description: 'Экран благодарности'
    }
  ]

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
    } finally {
      setSaving(false)
    }
  }

  const handleComplete = async () => {
    setSaving(true)
    try {
      await onUpdate({ status: 'draft' })
      onComplete()
    } catch (error) {
      console.error('Error completing wizard:', error)
      alert('Не удалось сохранить опрос')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Step Indicator */}
        <StepIndicator currentStep={currentStep} steps={steps} />

        {/* Step Content */}
        <div className="mt-8">
          {currentStep === 1 && (
            <Step1Intro
              introImageUrl={survey.intro_image_url}
              introTitle={survey.intro_title}
              introDescription={survey.intro_description}
              onUpdate={handleStep1Update}
              onNext={() => setCurrentStep(2)}
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
              onComplete={handleComplete}
            />
          )}
        </div>

        {/* Saving Indicator */}
        {saving && (
          <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
            Сохранение...
          </div>
        )}
      </div>
    </div>
  )
}
