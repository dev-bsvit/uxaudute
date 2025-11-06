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
      <div className="flex gap-6">
        {/* Left Column: Forms - flex-1 */}
        <div className="flex-1">
          <div className="space-y-6">
            {/* Section Title */}
            <h2 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#1F1F1F]">
              Шаги создания
            </h2>

            {/* Step 1: Экран Вступления */}
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(currentStep === 1 ? 0 as any : 1)}
                className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#1F1F1F]">Экран Вступления</span>
                  {isStep1Complete && (
                    <span className="px-3 py-1 text-xs font-medium text-[#17663A] bg-[#EEFBF4] border border-[#B2EECC] rounded-full">
                      Заполнено
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#EEF2FA] flex items-center justify-center transition-transform">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`transition-transform ${currentStep === 1 ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
              {currentStep === 1 && (
                <Step1Intro
                  introImageUrl={survey.intro_image_url}
                  introTitle={survey.intro_title}
                  introDescription={survey.intro_description}
                  onUpdate={handleStep1Update}
                  onNext={() => setCurrentStep(2)}
                />
              )}
            </div>

            {/* Step 2: Вопросы */}
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(currentStep === 2 ? 0 as any : 2)}
                className="w-full flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#1F1F1F]">Вопросы</span>
                  {isStep2Complete && (
                    <span className="px-3 py-1 text-xs font-medium text-[#17663A] bg-[#EEFBF4] border border-[#B2EECC] rounded-full">
                      Заполнено
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#EEF2FA] flex items-center justify-center transition-transform hover:bg-[#E5EBF6]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`transition-transform ${currentStep === 2 ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6L8 10L12 6" stroke="#171A24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
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
            </div>

            {/* Step 3: Экран благодарности */}
            <div className="space-y-4">
              <button
                onClick={() => setCurrentStep(currentStep === 3 ? 0 as any : 3)}
                className="w-full flex items-center justify-between py-2 hover:opacity-80 transition-opacity"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-[#1F1F1F]">Экран благодарности</span>
                  {isStep3Complete && (
                    <span className="px-3 py-1 text-xs font-medium text-[#17663A] bg-[#EEFBF4] border border-[#B2EECC] rounded-full">
                      Заполнено
                    </span>
                  )}
                </div>
                <div className="w-8 h-8 rounded-full bg-[#EEF2FA] flex items-center justify-center transition-transform hover:bg-[#E5EBF6]">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className={`transition-transform ${currentStep === 3 ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6L8 10L12 6" stroke="#171A24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </button>
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
          </div>
        </div>

        {/* Right Column: Preview Card */}
        <div className="flex-1">
          <div className="w-full bg-[#CAEEF7] rounded-[24px] p-6 sticky top-4">
            <div className="flex flex-col items-start gap-[22px]">
              {/* Mini Screen Preview - Larger */}
              {survey.intro_image_url && (
                <div className="w-[200px] h-[400px] rounded-lg overflow-hidden shadow-lg">
                  <Image
                    src={survey.intro_image_url}
                    alt="Preview"
                    width={200}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              {/* Title - Left aligned */}
              <h3 className="text-xl font-bold leading-[22px] tracking-[-0.2px] text-[#1F1F1F] text-left">
                {survey.intro_title || 'Экран добавления карты'}
              </h3>

              {/* Description - Left aligned */}
              <p className="text-base leading-[17.12px] text-[#1F1F1F] text-left">
                {survey.intro_description || 'Оцените удобство и расположение элементов после прохождения тестов вам будет предоставлен подарочный сертификат'}
              </p>

              {/* Start Button */}
              <button className="h-[50px] px-6 bg-[#0058FC] rounded-[44px] text-white text-base font-medium leading-[17.6px] tracking-[-0.16px] hover:bg-[#0047d1] transition-colors">
                Начать
              </button>
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
