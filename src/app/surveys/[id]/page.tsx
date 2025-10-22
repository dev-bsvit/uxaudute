'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  Check,
  X,
  Eye,
  EyeOff,
  Send
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSurvey, updateSurvey, publishSurvey } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'
import type { Survey, SurveyQuestionInstance, QuestionType } from '@/types/survey'

export default function SurveyEditorPage() {
  const router = useRouter()
  const params = useParams()
  const surveyId = params.id as string
  const { t, currentLanguage } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Редактирование вопроса
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editedText, setEditedText] = useState('')

  // Добавление нового вопроса
  const [showAddQuestion, setShowAddQuestion] = useState(false)
  const [newQuestionText, setNewQuestionText] = useState('')
  const [newQuestionType, setNewQuestionType] = useState<QuestionType>('text')
  const [newQuestionPool, setNewQuestionPool] = useState<'main' | 'additional'>('main')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && surveyId) {
      loadSurvey()
    }
  }, [user, surveyId])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/projects')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadSurvey = async () => {
    try {
      const surveyData = await getSurvey(surveyId)
      setSurvey(surveyData)
    } catch (error) {
      console.error('Error loading survey:', error)
      setError('Не удалось загрузить опрос')
    }
  }

  const handleDeleteQuestion = async (questionId: string, pool: 'main' | 'additional') => {
    if (!survey) return

    const updatedPool = pool === 'main'
      ? survey.main_questions.filter(q => q.instance_id !== questionId)
      : survey.additional_questions.filter(q => q.instance_id !== questionId)

    try {
      setSaving(true)
      await updateSurvey(survey.id, {
        [pool === 'main' ? 'main_questions' : 'additional_questions']: updatedPool
      })
      setSurvey({
        ...survey,
        [pool === 'main' ? 'main_questions' : 'additional_questions']: updatedPool
      })
    } catch (error) {
      console.error('Error deleting question:', error)
      setError('Не удалось удалить вопрос')
    } finally {
      setSaving(false)
    }
  }

  const handleMoveQuestion = async (questionId: string, from: 'main' | 'additional', to: 'main' | 'additional') => {
    if (!survey || from === to) return

    const sourcePool = from === 'main' ? survey.main_questions : survey.additional_questions
    const targetPool = to === 'main' ? survey.main_questions : survey.additional_questions

    const question = sourcePool.find(q => q.instance_id === questionId)
    if (!question) return

    const updatedSource = sourcePool.filter(q => q.instance_id !== questionId)
    const updatedTarget = [...targetPool, { ...question, pool: to }]

    try {
      setSaving(true)
      await updateSurvey(survey.id, {
        main_questions: from === 'main' ? updatedSource : updatedTarget,
        additional_questions: from === 'additional' ? updatedSource : updatedTarget
      })
      setSurvey({
        ...survey,
        main_questions: from === 'main' ? updatedSource : updatedTarget,
        additional_questions: from === 'additional' ? updatedSource : updatedTarget
      })
    } catch (error) {
      console.error('Error moving question:', error)
      setError('Не удалось переместить вопрос')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (question: SurveyQuestionInstance) => {
    setEditingQuestionId(question.instance_id)
    setEditedText(currentLanguage === 'ru' ? question.text_ru : question.text_en)
  }

  const handleSaveEdit = async (questionId: string, pool: 'main' | 'additional') => {
    if (!survey || !editedText.trim()) return

    const updatedPool = pool === 'main' ? survey.main_questions : survey.additional_questions
    const updatedQuestions = updatedPool.map(q =>
      q.instance_id === questionId
        ? { ...q, [currentLanguage === 'ru' ? 'text_ru' : 'text_en']: editedText }
        : q
    )

    try {
      setSaving(true)
      await updateSurvey(survey.id, {
        [pool === 'main' ? 'main_questions' : 'additional_questions']: updatedQuestions
      })
      setSurvey({
        ...survey,
        [pool === 'main' ? 'main_questions' : 'additional_questions']: updatedQuestions
      })
      setEditingQuestionId(null)
      setEditedText('')
    } catch (error) {
      console.error('Error saving question:', error)
      setError('Не удалось сохранить изменения')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingQuestionId(null)
    setEditedText('')
  }

  const handleAddCustomQuestion = async () => {
    if (!survey || !newQuestionText.trim()) return

    const newQuestion: SurveyQuestionInstance = {
      id: `custom-${Date.now()}`,
      instance_id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      category: 'custom' as any,
      text_ru: newQuestionText,
      text_en: newQuestionText,
      type: newQuestionType,
      order: newQuestionPool === 'main' ? survey.main_questions.length : survey.additional_questions.length,
      required: false,
      is_custom: true,
      pool: newQuestionPool
    }

    const updatedPool = newQuestionPool === 'main'
      ? [...survey.main_questions, newQuestion]
      : [...survey.additional_questions, newQuestion]

    try {
      setSaving(true)
      await updateSurvey(survey.id, {
        [newQuestionPool === 'main' ? 'main_questions' : 'additional_questions']: updatedPool
      })
      setSurvey({
        ...survey,
        [newQuestionPool === 'main' ? 'main_questions' : 'additional_questions']: updatedPool
      })
      setShowAddQuestion(false)
      setNewQuestionText('')
      setNewQuestionType('text')
    } catch (error) {
      console.error('Error adding question:', error)
      setError('Не удалось добавить вопрос')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!survey) return

    try {
      setPublishing(true)
      await publishSurvey(survey.id)
      setSurvey({ ...survey, status: 'published' })
      alert('Опрос опубликован! Теперь вы можете поделиться ссылкой с респондентами.')
    } catch (error) {
      console.error('Error publishing survey:', error)
      setError('Не удалось опубликовать опрос')
    } finally {
      setPublishing(false)
    }
  }

  const renderQuestion = (question: SurveyQuestionInstance, pool: 'main' | 'additional', index: number) => {
    const isEditing = editingQuestionId === question.instance_id
    const questionText = currentLanguage === 'ru' ? question.text_ru : question.text_en

    return (
      <Card key={question.instance_id} className="p-4">
        <div className="flex items-start gap-3">
          <div className="cursor-move mt-1">
            <GripVertical className="w-5 h-5 text-slate-400" />
          </div>

          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <Textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  className="w-full"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(question.instance_id, pool)}
                    disabled={!editedText.trim() || saving}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-slate-500">
                        #{index + 1}
                      </span>
                      {question.is_custom && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Свой вопрос
                        </span>
                      )}
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {question.type === 'yes-no' ? 'Да/Нет' : question.type === 'text' ? 'Текст' : question.type}
                      </span>
                    </div>
                    <p className="text-slate-900">{questionText}</p>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleStartEdit(question)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Редактировать
                  </Button>

                  {pool === 'main' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveQuestion(question.instance_id, 'main', 'additional')}
                      disabled={saving}
                    >
                      <EyeOff className="w-4 h-4 mr-1" />
                      В дополнительные
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleMoveQuestion(question.instance_id, 'additional', 'main')}
                      disabled={saving}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      В основные
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteQuestion(question.instance_id, pool)}
                    disabled={saving}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !survey) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Опросы', href: '/surveys' },
              { label: survey.name }
            ]}
            title={survey.name}
            subtitle={
              survey.status === 'draft'
                ? 'Настройте вопросы и опубликуйте опрос'
                : survey.status === 'published'
                ? 'Опрос опубликован и доступен для прохождения'
                : 'Опрос закрыт'
            }
          />
        </div>

        <div className="px-8">
          <div className="max-w-5xl space-y-8">
            {/* Статус и действия */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  survey.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : survey.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-800'
                }`}>
                  {survey.status === 'draft' ? 'Черновик' : survey.status === 'published' ? 'Опубликован' : 'Закрыт'}
                </div>
                <span className="text-sm text-slate-600">
                  {survey.main_questions.length} основных вопросов
                </span>
                <span className="text-sm text-slate-600">
                  {survey.additional_questions.length} дополнительных
                </span>
              </div>

              {survey.status === 'draft' && (
                <Button
                  onClick={handlePublish}
                  disabled={publishing || survey.main_questions.length === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Публикация...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Опубликовать опрос
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Ошибка */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Основные вопросы */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Основные вопросы
                </h2>
                <span className="text-sm text-slate-500">
                  Показываются сразу в опросе
                </span>
              </div>

              <div className="space-y-3">
                {survey.main_questions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-slate-500">
                      Нет основных вопросов. Добавьте вопросы из дополнительных или создайте свои.
                    </p>
                  </Card>
                ) : (
                  survey.main_questions.map((q, i) => renderQuestion(q, 'main', i))
                )}
              </div>
            </div>

            {/* Дополнительные вопросы */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-slate-900">
                  Дополнительные вопросы
                </h2>
                <span className="text-sm text-slate-500">
                  Скрыты, можно добавить в основные
                </span>
              </div>

              <div className="space-y-3">
                {survey.additional_questions.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-slate-500">
                      Нет дополнительных вопросов
                    </p>
                  </Card>
                ) : (
                  survey.additional_questions.map((q, i) => renderQuestion(q, 'additional', i))
                )}
              </div>
            </div>

            {/* Добавить свой вопрос */}
            <div>
              {!showAddQuestion ? (
                <Button
                  onClick={() => setShowAddQuestion(true)}
                  variant="outline"
                  className="w-full border-dashed"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить свой вопрос
                </Button>
              ) : (
                <Card className="p-6">
                  <h3 className="font-semibold text-slate-900 mb-4">Новый вопрос</h3>

                  <div className="space-y-4">
                    <div>
                      <Label>Текст вопроса</Label>
                      <Textarea
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder="Введите текст вопроса..."
                        className="mt-2"
                        rows={3}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Тип ответа</Label>
                        <select
                          value={newQuestionType}
                          onChange={(e) => setNewQuestionType(e.target.value as QuestionType)}
                          className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                          <option value="text">Текстовый ответ</option>
                          <option value="yes-no">Да/Нет</option>
                          <option value="rating">Рейтинг</option>
                          <option value="scale">Шкала</option>
                        </select>
                      </div>

                      <div>
                        <Label>Добавить в</Label>
                        <select
                          value={newQuestionPool}
                          onChange={(e) => setNewQuestionPool(e.target.value as 'main' | 'additional')}
                          className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-md"
                        >
                          <option value="main">Основные вопросы</option>
                          <option value="additional">Дополнительные вопросы</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={handleAddCustomQuestion}
                        disabled={!newQuestionText.trim() || saving}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить вопрос
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddQuestion(false)
                          setNewQuestionText('')
                        }}
                      >
                        Отмена
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
