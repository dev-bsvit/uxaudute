'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Upload, Loader2, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { createSurvey, updateSurvey } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'

export default function CreateSurveyPage() {
  const router = useRouter()
  const params = useParams()
  const projectId = params.id as string
  const { t, currentLanguage } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [project, setProject] = useState<any>(null)

  // Форма
  const [surveyName, setSurveyName] = useState('')
  const [surveyDescription, setSurveyDescription] = useState('')
  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null)

  // Процесс создания
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && projectId) {
      loadProject()
    }
  }, [user, projectId])

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

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

      if (error) throw error
      setProject(data)
    } catch (error) {
      console.error('Error loading project:', error)
      setError('Не удалось загрузить проект')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Пожалуйста, загрузите изображение')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Размер файла не должен превышать 10MB')
      return
    }

    setScreenshot(file)
    setError(null)

    const reader = new FileReader()
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const uploadScreenshot = async (file: File, userId: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}/${Date.now()}.${fileExt}`

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName)

    return publicUrl
  }

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!surveyName.trim()) {
      setError('Введите название опроса')
      return
    }

    if (!screenshot) {
      setError('Загрузите скриншот интерфейса')
      return
    }

    if (!user) {
      setError('Пользователь не авторизован')
      return
    }

    try {
      setUploading(true)
      setError(null)

      const screenshotUrl = await uploadScreenshot(screenshot, user.id)

      const survey = await createSurvey(
        surveyName,
        projectId,
        surveyDescription || undefined
      )

      await updateSurvey(survey.id, {
        screenshot_url: screenshotUrl
      })

      setUploading(false)
      setGenerating(true)

      const response = await fetch('/api/survey/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          screenshotUrl,
          language: currentLanguage
        })
      })

      if (!response.ok) {
        throw new Error('Не удалось сгенерировать вопросы')
      }

      const questionsData = await response.json()

      await updateSurvey(survey.id, {
        ai_questions: questionsData.ai_questions,
        selected_bank_questions: questionsData.selected_bank_questions,
        main_questions: questionsData.main_questions,
        additional_questions: questionsData.additional_questions
      })

      router.push(`/surveys/${survey.id}`)

    } catch (error) {
      console.error('Error creating survey:', error)
      setError(error instanceof Error ? error.message : 'Произошла ошибка')
      setUploading(false)
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !project) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Проекты', href: '/projects' },
              { label: project.name, href: `/projects/${project.id}` },
              { label: 'Создать опрос' }
            ]}
            title="Создать AI-опрос"
            subtitle={`Проект: ${project.name}`}
          />
        </div>

        <div className="px-8">
          <div className="max-w-3xl">
            <form onSubmit={handleCreateSurvey} className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-base font-semibold">
                  Название опроса
                </Label>
                <Input
                  id="name"
                  value={surveyName}
                  onChange={(e) => setSurveyName(e.target.value)}
                  placeholder="Например: Опрос пользователей мобильного приложения"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-base font-semibold">
                  Описание (опционально)
                </Label>
                <Textarea
                  id="description"
                  value={surveyDescription}
                  onChange={(e) => setSurveyDescription(e.target.value)}
                  placeholder="Кратко опишите цель опроса..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div>
                <Label className="text-base font-semibold">
                  Скриншот интерфейса
                </Label>
                <p className="text-sm text-slate-600 mt-1 mb-3">
                  AI проанализирует скриншот и создаст релевантные вопросы
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {!screenshotPreview ? (
                  <Card
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors cursor-pointer"
                  >
                    <div className="p-12 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                        <Upload className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Загрузите скриншот
                      </h3>
                      <p className="text-sm text-slate-600">
                        Нажмите для выбора файла или перетащите сюда
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        PNG, JPG или WebP до 10MB
                      </p>
                    </div>
                  </Card>
                ) : (
                  <div className="relative">
                    <Card className="overflow-hidden">
                      <img
                        src={screenshotPreview}
                        alt="Screenshot preview"
                        className="w-full h-auto"
                      />
                    </Card>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setScreenshot(null)
                        setScreenshotPreview(null)
                        if (fileInputRef.current) {
                          fileInputRef.current.value = ''
                        }
                      }}
                      className="mt-2"
                    >
                      Выбрать другое изображение
                    </Button>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={uploading || generating || !surveyName.trim() || !screenshot}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Загрузка скриншота...
                    </>
                  ) : generating ? (
                    <>
                      <Sparkles className="w-4 h-4 mr-2 animate-pulse" />
                      AI генерирует вопросы...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Создать опрос с AI
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/projects/${projectId}`)}
                  disabled={uploading || generating}
                >
                  Отмена
                </Button>
              </div>
            </form>

            <Card className="mt-8 bg-blue-50 border-blue-200">
              <div className="p-6">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  Как это работает
                </h3>
                <ol className="space-y-2 text-sm text-slate-700">
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">1.</span>
                    <span>AI анализирует скриншот и создаёт ~20 специфичных вопросов</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">2.</span>
                    <span>Из банка 120 стандартных вопросов выбираются ~100 релевантных</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">3.</span>
                    <span>Вопросы делятся на основные (показываются сразу) и дополнительные</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="font-semibold text-blue-600">4.</span>
                    <span>Вы сможете редактировать, сортировать и добавлять свои вопросы</span>
                  </li>
                </ol>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
