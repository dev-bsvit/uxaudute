'use client'

import { useState } from 'react'
import { Step1Personal } from './step-1-personal'
import { Step2Interests } from './step-2-interests'
import { Step3Source } from './step-3-source'
import { Button } from '@/components/ui/button'

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

  // Ширина прогресс-бара по шагам
  const getProgressWidth = () => {
    switch (currentStep) {
      case 1: return '116px' // ~25%
      case 2: return '243px' // ~52%
      case 3: return '447px' // ~96%
      default: return '116px'
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Progress bar container: height 10px, bg #eef2fa, radius 15px */}
      <div className="w-full h-[10px] bg-[#eef2fa] rounded-[15px] overflow-hidden">
        {/* Progress indicator: bg #bffe00, radius 13px */}
        <div
          className="h-[10px] bg-[#bffe00] rounded-[13px] transition-all duration-300 ease-in-out"
          style={{ width: getProgressWidth() }}
        />
      </div>

      {/* Form content */}
      <div className="w-full min-h-[400px]">
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
      </div>

      {/* Navigation buttons */}
      <div className={`flex ${currentStep === 1 ? 'justify-end' : 'justify-between'} w-full`}>
        {currentStep > 1 && (
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={isSubmitting}
            className="h-auto px-6 py-4 rounded-[44px] text-[#121217] text-base font-medium leading-[1.1] tracking-[-0.16px] hover:bg-[#f7f7f8]"
            style={{ fontFamily: 'Inter Display, sans-serif' }}
          >
            Назад
          </Button>
        )}

        <Button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className="h-auto px-6 py-4 bg-[#0058fc] rounded-[44px] text-white text-base font-medium leading-[1.1] tracking-[-0.16px] hover:bg-[#0047d1] disabled:bg-[#d1d1db] disabled:text-[#6c6c89]"
          style={{ fontFamily: 'Inter Display, sans-serif' }}
        >
          {isSubmitting ? 'Сохранение...' : 'Далее'}
        </Button>
      </div>
    </div>
  )
}
