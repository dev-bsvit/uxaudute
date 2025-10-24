'use client'

import { SurveyWizard } from '@/components/survey-wizard/survey-wizard'
import { Survey } from '@/types/survey'
import { updateSurvey, publishSurvey } from '@/lib/database'

interface CreateTabProps {
  survey: Survey
  onUpdate: () => void
  currentLanguage: 'ru' | 'en'
}

export function CreateTab({ survey, onUpdate, currentLanguage }: CreateTabProps) {
  const handleWizardUpdate = async (updates: Partial<Survey>) => {
    try {
      await updateSurvey(survey.id, updates)
      onUpdate()
    } catch (error) {
      console.error('Error updating survey:', error)
      throw error
    }
  }

  const handlePublish = async () => {
    try {
      await publishSurvey(survey.id)
      onUpdate()
      alert('Опрос успешно опубликован!')
    } catch (error) {
      console.error('Error publishing survey:', error)
      alert('Не удалось опубликовать опрос')
    }
  }

  // Всегда показываем wizard с 3-колоночным layout
  return (
    <SurveyWizard
      survey={survey}
      onUpdate={handleWizardUpdate}
      onPublish={handlePublish}
      currentLanguage={currentLanguage}
    />
  )
}
