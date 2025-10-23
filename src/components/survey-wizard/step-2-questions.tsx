'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Plus,
  Wand2,
  Library,
  Trash2,
  GripVertical,
  Edit2,
  Check,
  X
} from 'lucide-react'
import { SurveyQuestion, QuestionType, QUESTION_BANK } from '@/lib/survey-question-bank'
import { SurveyQuestionInstance } from '@/types/survey'
import { QuestionLibraryPicker } from './question-library-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Step2QuestionsProps {
  questions: SurveyQuestionInstance[]
  introImageUrl?: string
  onUpdate: (questions: SurveyQuestionInstance[]) => void
  onBack: () => void
  onNext: () => void
  currentLanguage: 'ru' | 'en'
}

export function Step2Questions({
  questions,
  introImageUrl,
  onUpdate,
  onBack,
  onNext,
  currentLanguage
}: Step2QuestionsProps) {
  const [localQuestions, setLocalQuestions] = useState<SurveyQuestionInstance[]>(questions)
  const [showLibraryPicker, setShowLibraryPicker] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)

  // Manual question creation
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualText, setManualText] = useState('')
  const [manualType, setManualType] = useState<QuestionType>('text')

  // Editing
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const handleAddManualQuestion = () => {
    if (!manualText.trim()) return

    const newQuestion: SurveyQuestionInstance = {
      id: `custom-${Date.now()}`,
      instance_id: `instance-${Date.now()}`,
      category: 'general',
      text_ru: manualText,
      text_en: manualText,
      type: manualType,
      order: localQuestions.length,
      required: true,
      is_custom: true,
      pool: 'main'
    }

    const updated = [...localQuestions, newQuestion]
    setLocalQuestions(updated)
    onUpdate(updated)
    setManualText('')
    setShowManualForm(false)
  }

  const handleGenerateAI = async () => {
    if (!introImageUrl) {
      alert('Сначала загрузите изображение на первом шаге')
      return
    }

    setGeneratingAI(true)
    try {
      // TODO: Implement AI generation based on intro image
      // For now, simulate by selecting random questions from bank
      const randomQuestions = QUESTION_BANK
        .sort(() => Math.random() - 0.5)
        .slice(0, 10)
        .map((q, index) => ({
          ...q,
          instance_id: `ai-${Date.now()}-${index}`,
          order: localQuestions.length + index,
          required: true,
          is_custom: false,
          pool: 'main' as const
        }))

      const updated = [...localQuestions, ...randomQuestions]
      setLocalQuestions(updated)
      onUpdate(updated)
      alert(`Добавлено ${randomQuestions.length} вопросов на основе изображения`)
    } catch (error) {
      console.error('Error generating AI questions:', error)
      alert('Не удалось сгенерировать вопросы')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSelectFromLibrary = (selectedQuestions: SurveyQuestion[]) => {
    const newQuestions: SurveyQuestionInstance[] = selectedQuestions.map((q, index) => ({
      ...q,
      instance_id: `library-${Date.now()}-${index}`,
      order: localQuestions.length + index,
      required: true,
      is_custom: false,
      pool: 'main'
    }))

    const updated = [...localQuestions, ...newQuestions]
    setLocalQuestions(updated)
    onUpdate(updated)
  }

  const handleDeleteQuestion = (instanceId: string) => {
    const updated = localQuestions.filter(q => q.instance_id !== instanceId)
    setLocalQuestions(updated)
    onUpdate(updated)
  }

  const handleStartEdit = (question: SurveyQuestionInstance) => {
    setEditingId(question.instance_id)
    setEditText(currentLanguage === 'ru' ? question.text_ru : question.text_en)
  }

  const handleSaveEdit = () => {
    if (!editingId) return

    const updated = localQuestions.map(q => {
      if (q.instance_id === editingId) {
        return {
          ...q,
          text_ru: currentLanguage === 'ru' ? editText : q.text_ru,
          text_en: currentLanguage === 'en' ? editText : q.text_en
        }
      }
      return q
    })

    setLocalQuestions(updated)
    onUpdate(updated)
    setEditingId(null)
    setEditText('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleNext = () => {
    if (localQuestions.length === 0) {
      alert('Добавьте хотя бы один вопрос')
      return
    }
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Вопросы опроса
        </h2>
        <p className="text-slate-600">
          Добавьте вопросы одним из трех способов: вручную, с помощью AI или из готовой библиотеки.
        </p>
      </div>

      {/* Add Methods */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Добавить вопросы:</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Manual */}
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => setShowManualForm(true)}
          >
            <Plus className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium">Вручную</p>
              <p className="text-xs text-slate-500">Создайте свои вопросы</p>
            </div>
          </Button>

          {/* AI Generation */}
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={handleGenerateAI}
            disabled={generatingAI || !introImageUrl}
          >
            <Wand2 className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium">AI из скриншота</p>
              <p className="text-xs text-slate-500">
                {generatingAI ? 'Генерация...' : 'Автоматически из изображения'}
              </p>
            </div>
          </Button>

          {/* Library */}
          <Button
            variant="outline"
            className="h-auto flex-col gap-2 p-4"
            onClick={() => setShowLibraryPicker(true)}
          >
            <Library className="w-6 h-6" />
            <div className="text-center">
              <p className="font-medium">Из библиотеки</p>
              <p className="text-xs text-slate-500">120 готовых вопросов</p>
            </div>
          </Button>
        </div>

        {/* Manual Question Form */}
        {showManualForm && (
          <Card className="mt-4 p-4 bg-slate-50">
            <h4 className="font-medium mb-4">Создать вопрос вручную</h4>
            <div className="space-y-4">
              <div>
                <Label>Текст вопроса</Label>
                <Input
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Введите ваш вопрос..."
                />
              </div>
              <div>
                <Label>Тип вопроса</Label>
                <Select value={manualType} onValueChange={(v) => setManualType(v as QuestionType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Текстовый</SelectItem>
                    <SelectItem value="yes-no">Да/Нет</SelectItem>
                    <SelectItem value="rating">Рейтинг (1-5)</SelectItem>
                    <SelectItem value="scale">Шкала (1-10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleAddManualQuestion} disabled={!manualText.trim()}>
                  Добавить
                </Button>
                <Button variant="outline" onClick={() => setShowManualForm(false)}>
                  Отмена
                </Button>
              </div>
            </div>
          </Card>
        )}
      </Card>

      {/* Questions List */}
      {localQuestions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">
              Добавленные вопросы ({localQuestions.length})
            </h3>
          </div>

          <div className="space-y-3">
            {localQuestions.map((question, index) => {
              const isEditing = editingId === question.instance_id
              const text = currentLanguage === 'ru' ? question.text_ru : question.text_en

              return (
                <Card key={question.instance_id} className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />

                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <div className="space-y-2">
                          <Input
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-slate-900 font-medium">
                            {index + 1}. {text}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                              {question.type}
                            </span>
                            {question.is_custom && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                Пользовательский
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleStartEdit(question)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.instance_id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {localQuestions.length === 0 && (
        <Card className="p-12 text-center">
          <Library className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Вопросы не добавлены
          </h3>
          <p className="text-slate-600">
            Выберите один из способов выше, чтобы добавить вопросы в опрос
          </p>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Назад: Intro Screen
        </Button>
        <Button
          onClick={handleNext}
          size="lg"
          disabled={localQuestions.length === 0}
        >
          Далее: Thank You Screen
        </Button>
      </div>

      {/* Library Picker Modal */}
      {showLibraryPicker && (
        <QuestionLibraryPicker
          selectedQuestionIds={localQuestions.map(q => q.id)}
          onSelect={handleSelectFromLibrary}
          onClose={() => setShowLibraryPicker(false)}
          currentLanguage={currentLanguage}
        />
      )}
    </div>
  )
}
