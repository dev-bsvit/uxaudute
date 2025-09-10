'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AnalysisResult } from '@/components/analysis-result'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { CanvasAnnotations } from '@/components/ui/canvas-annotations'
import { ArrowLeft, Download, Share2, RefreshCw, Monitor, Link2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Audit {
  id: string
  name: string
  type: string
  status: string
  input_data: any
  result_data: any
  created_at: string
  updated_at: string
  project_id: string
  projects?: {
    id: string
    name: string
  }
}

export default function AuditPage() {
  const params = useParams()
  const auditId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [annotationData, setAnnotationData] = useState<string>('')

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (auditId && user) {
      loadAudit()
    }
  }, [auditId, user])

  const loadAudit = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Загружаем аудит с ID:', auditId)
      
      const { data: auditData, error: auditError } = await supabase
        .from('audits')
        .select(`
          *,
          projects!inner(id, name)
        `)
        .eq('id', auditId)
        .single()

      if (auditError) {
        console.error('Ошибка загрузки аудита:', auditError)
        setError('Аудит не найден')
        return
      }

      console.log('Аудит загружен:', auditData)
      setAudit(auditData)

      // Инициализируем аннотации из данных аудита
      if (auditData.result_data?.annotations) {
        setAnnotationData(auditData.result_data.annotations)
      }

      // Проверяем наличие результата
      if (auditData.result_data && Object.keys(auditData.result_data).length > 0) {
        console.log('✅ Результат найден в audits:', auditData.result_data)
      } else {
        console.log('⚠️ Результат не найден в audits, аудит может быть в процессе')
      }
    } catch (err) {
      console.error('Ошибка загрузки аудита:', err)
      setError('Ошибка загрузки аудита')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAudit()
  }

  const handleAnnotationSave = (data: string) => {
    setAnnotationData(data)
    console.log('Annotation data saved:', data)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Аудит не найден
          </h2>
          <p className="text-slate-600 mb-6">
            {error || 'Аудит с указанным ID не существует'}
          </p>
          <Link href="/dashboard">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Вернуться к Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        {/* Навигация */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={audit?.project_id ? `/projects/${audit.project_id}` : '/dashboard'}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Назад к проекту
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{audit.name}</h1>
              <p className="text-sm text-slate-600">
                Создан: {new Date(audit.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Скачать отчет
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
          </div>
        </div>


        {/* Результаты анализа */}
        {audit.result_data ? (
          <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
            {/* Левая колонка - Табы с результатами */}
            <div className="space-y-8">
              <Tabs defaultValue="ux-analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="ux-analysis">UX Анализ</TabsTrigger>
                  <TabsTrigger value="ab-test">AB тест</TabsTrigger>
                  <TabsTrigger value="hypotheses">Гипотезы</TabsTrigger>
                  <TabsTrigger value="analytics">Продуктовая аналитика</TabsTrigger>
                </TabsList>
                
                <TabsContent value="ux-analysis">
                  {(() => {
                    console.log('Отображаем результат аудита:', audit.result_data)
                    console.log('Ключи result_data:', Object.keys(audit.result_data))
                    console.log('analysis_result:', audit.result_data.analysis_result)
                    console.log('Весь result_data:', JSON.stringify(audit.result_data, null, 2))
                    
                    // result_data содержит напрямую результат анализа
                    const result = audit.result_data
                    console.log('Результат для AnalysisResult:', result)
                    
                    // Создаем компонент только с левой колонкой (без скриншота)
                    return (
                      <div className="space-y-8">
                        {/* Описание экрана */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                              📱 Описание экрана
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Тип экрана</h4>
                                <p className="text-gray-600">{result.screenDescription?.screenType || 'Не указано'}</p>
                              </div>
                              <div>
                                <h4 className="font-medium text-gray-900 mb-2">Цель пользователя</h4>
                                <p className="text-gray-600">{result.screenDescription?.userGoal || 'Не указано'}</p>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium text-gray-900 mb-2">Ключевые элементы</h4>
                              <div className="flex flex-wrap gap-2">
                                {result.screenDescription?.keyElements?.map((element: string, index: number) => (
                                  <Badge key={index} variant="secondary">{element}</Badge>
                                )) || <span className="text-gray-500">Не указано</span>}
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* UX Опрос */}
                        {result.uxSurvey && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                📊 UX Опрос
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {result.uxSurvey.questions?.map((question: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">{question.question}</h4>
                                    <p className="text-gray-600">{question.answer}</p>
                                  </div>
                                )) || <span className="text-gray-500">Нет данных опроса</span>}
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {/* Проблемы и решения */}
                        {result.problems && result.problems.length > 0 && (
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                ⚠️ Проблемы и решения
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-6">
                                {result.problems.map((problem: any, index: number) => (
                                  <div key={index} className="border rounded-lg p-4">
                                    <div className="flex items-start justify-between mb-3">
                                      <h4 className="font-medium text-gray-900">{problem.title}</h4>
                                      <Badge className={problem.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                                      problem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                                      'bg-green-100 text-green-800'}>
                                        {problem.priority === 'high' ? 'Высокий' : 
                                         problem.priority === 'medium' ? 'Средний' : 'Низкий'}
                                      </Badge>
                                    </div>
                                    <p className="text-gray-600 mb-3">{problem.description}</p>
                                    <div className="space-y-2">
                                      <div>
                                        <span className="font-medium text-purple-600">Решение:</span>{' '}
                                        <span className="text-gray-700">{problem.solution}</span>
                                      </div>
                                      <div>
                                        <span className="font-medium text-purple-600">Ожидаемый эффект:</span>{' '}
                                        <span className="text-gray-700">{problem.expectedEffect}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    )
                  })()}
                </TabsContent>
                
                <TabsContent value="ab-test">
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        AB тест
                      </h3>
                      <p className="text-slate-600">
                        Раздел в разработке
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="hypotheses">
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Гипотезы
                      </h3>
                      <p className="text-slate-600">
                        Раздел в разработке
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="analytics">
                  <Card>
                    <CardContent className="text-center py-12">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">
                        Продуктовая аналитика
                      </h3>
                      <p className="text-slate-600">
                        Раздел в разработке
                      </p>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Правая колонка - Анализируемый интерфейс (всегда видимый) */}
            <div className="sticky top-4 h-fit">
              {(audit.input_data?.screenshotUrl || audit.input_data?.url) && (
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {audit.input_data?.screenshotUrl ? <Monitor className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                      {audit.input_data?.screenshotUrl ? 'Анализируемый интерфейс' : 'Анализируемый URL'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {audit.input_data?.screenshotUrl ? (
                      <div className="space-y-4">
                        <CanvasAnnotations
                          src={audit.input_data.screenshotUrl}
                          alt="Анализируемый скриншот"
                          className="w-full h-auto max-h-[70vh] object-contain"
                          onAnnotationSave={handleAnnotationSave}
                          initialAnnotationData={annotationData}
                          auditId={audit.id}
                        />
                        <div className="text-sm text-gray-500 text-center">
                          💡 Редактор аннотаций открывается автоматически. Добавьте комментарии и выделения к скриншоту
                        </div>
                        <div className="text-xs text-gray-400 text-center mt-2">
                          Анализ {new Date(audit.created_at).toLocaleDateString('ru-RU')}
                        </div>
                      </div>
                    ) : audit.input_data?.url ? (
                      <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                        <a 
                          href={audit.input_data.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium break-all flex items-center gap-2"
                        >
                          <Link2 className="w-4 h-4" />
                          {audit.input_data.url}
                        </a>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Анализ в процессе
              </h3>
              <p className="text-slate-600 mb-4">
                Результаты анализа будут доступны через несколько минут
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarDemo>
  )
}
