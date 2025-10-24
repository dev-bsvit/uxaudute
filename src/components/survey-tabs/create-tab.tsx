'use client'

import { useState, useEffect } from 'react'
import { SurveyWizard } from '@/components/survey-wizard/survey-wizard'
import { Survey } from '@/types/survey'
import { updateSurvey, publishSurvey } from '@/lib/database'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Rocket, Check } from 'lucide-react'

interface CreateTabProps {
  survey: Survey
  onUpdate: () => void
  currentLanguage: 'ru' | 'en'
}

export function CreateTab({ survey, onUpdate, currentLanguage }: CreateTabProps) {
  const [publishing, setPublishing] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  // Проверяем, завершен ли опрос (все 3 шага пройдены)
  const isComplete =
    survey.intro_image_url &&
    survey.intro_title &&
    survey.intro_description &&
    survey.main_questions &&
    survey.main_questions.length > 0 &&
    survey.thank_you_text

  // Синхронизируем showWizard с isComplete при изменении survey
  useEffect(() => {
    setShowWizard(!isComplete)
  }, [isComplete])

  const handleWizardUpdate = async (updates: Partial<Survey>) => {
    try {
      await updateSurvey(survey.id, updates)
      onUpdate()
    } catch (error) {
      console.error('Error updating survey:', error)
      throw error
    }
  }

  const handleWizardComplete = () => {
    setShowWizard(false)
    onUpdate()
  }

  const handlePublish = async () => {
    if (!isComplete) {
      alert('Завершите все шаги настройки перед публикацией')
      return
    }

    setPublishing(true)
    try {
      await publishSurvey(survey.id)
      onUpdate()
      alert('Опрос успешно опубликован!')
    } catch (error) {
      console.error('Error publishing survey:', error)
      alert('Не удалось опубликовать опрос')
    } finally {
      setPublishing(false)
    }
  }

  const handleEditWizard = () => {
    setShowWizard(true)
  }

  // Если визард открыт - показываем его
  if (showWizard) {
    return (
      <SurveyWizard
        survey={survey}
        onUpdate={handleWizardUpdate}
        onComplete={handleWizardComplete}
        currentLanguage={currentLanguage}
      />
    )
  }

  // Если визард закрыт - показываем сводку с кнопкой публикации
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Completion Status */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Статус настройки
            </h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-700">Intro Screen настроен</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-700">
                  Вопросы добавлены ({survey.main_questions?.length || 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-600" />
                <span className="text-sm text-slate-700">Thank You Screen настроен</span>
              </div>
            </div>
          </div>
          <Button onClick={handleEditWizard} variant="outline">
            Редактировать
          </Button>
        </div>
      </Card>

      {/* Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Intro Preview */}
        <Card className="p-4">
          <h4 className="font-medium text-slate-900 mb-2">Intro Screen</h4>
          <p className="text-sm text-slate-600 line-clamp-2">
            {survey.intro_title}
          </p>
        </Card>

        {/* Questions Preview */}
        <Card className="p-4">
          <h4 className="font-medium text-slate-900 mb-2">Вопросы</h4>
          <p className="text-sm text-slate-600">
            {survey.main_questions?.length || 0} вопросов в опросе
          </p>
        </Card>

        {/* Thank You Preview */}
        <Card className="p-4">
          <h4 className="font-medium text-slate-900 mb-2">Thank You Screen</h4>
          <p className="text-sm text-slate-600 line-clamp-2">
            {survey.thank_you_text}
          </p>
        </Card>
      </div>

      {/* Publish Section */}
      {survey.status === 'draft' && isComplete && (
        <Card className="p-8 text-center bg-blue-50 border-blue-200">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Rocket className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Готов к публикации!
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Все шаги настройки завершены. Опубликуйте опрос, чтобы начать собирать ответы от
            пользователей.
          </p>
          <Button
            onClick={handlePublish}
            size="lg"
            disabled={publishing}
          >
            {publishing ? 'Публикация...' : 'Опубликовать опрос'}
          </Button>
        </Card>
      )}

      {/* Already Published */}
      {survey.status === 'published' && (
        <Card className="p-8 text-center bg-green-50 border-green-200">
          <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Опрос опубликован
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Ваш опрос активен и доступен пользователям. Перейдите во вкладку "Share" для
            получения ссылки или во вкладку "Results" для просмотра результатов.
          </p>
        </Card>
      )}
    </div>
  )
}
