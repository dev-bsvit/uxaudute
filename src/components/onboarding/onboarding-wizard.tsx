'use client'

import { useState } from 'react'
import { StepIndicator } from './step-indicator'
import { Step1Personal } from './step-1-personal'
import { Step2Interests } from './step-2-interests'
import { Step3Source } from './step-3-source'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ArrowRight } from 'lucide-react'

export interface OnboardingData {
  firstName: string
  role: string
  interests: string[]
  source: string
}

interface OnboardingWizardProps {
  onComplete: (data: OnboardingData) => Promise<void>
  initialData?: Partial<OnboardingData>
}

export function OnboardingWizard({ onComplete, initialData }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState<OnboardingData>({
    firstName: initialData?.firstName || '',
    role: initialData?.role || '',
    interests: initialData?.interests || [],
    source: initialData?.source || ''
  })

  const steps = [
    {
      number: 1 as const,
      title: 'Знакомство',
      description: 'Расскажите о себе'
    },
    {
      number: 2 as const,
      title: 'Интересы',
      description: 'Что вас интересует'
    },
    {
      number: 3 as const,
      title: 'Источник',
      description: 'Как узнали о нас'
    }
  ]

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName.trim() !== '' && formData.role !== ''
      case 2:
        return formData.interests.length > 0
      case 3:
        return formData.source !== ''
      default:
        return false
    }
  }

  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3)
    } else {
      // Завершение онбординга
      setIsSubmitting(true)
      try {
        await onComplete(formData)
      } catch (error) {
        console.error('Error completing onboarding:', error)
        setIsSubmitting(false)
      }
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <StepIndicator
        currentStep={currentStep}
        steps={steps}
      />

      <div className="mt-8 bg-white rounded-lg shadow-lg p-8 min-h-[400px]">
        {currentStep === 1 && (
          <Step1Personal
            firstName={formData.firstName}
            role={formData.role}
            onChange={updateFormData}
          />
        )}

        {currentStep === 2 && (
          <Step2Interests
            selectedInterests={formData.interests}
            onChange={(interests) => updateFormData({ interests })}
          />
        )}

        {currentStep === 3 && (
          <Step3Source
            selectedSource={formData.source}
            onChange={(source) => updateFormData({ source })}
          />
        )}

        <div className="flex justify-between mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              'Сохранение...'
            ) : currentStep === 3 ? (
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
    </div>
  )
}
