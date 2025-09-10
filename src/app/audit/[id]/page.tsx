'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AnalysisResult } from '@/components/analysis-result'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react'
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
          <Tabs defaultValue="ux-analysis" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-gray-100 h-16 relative z-10 p-1">
              <TabsTrigger 
                value="ux-analysis" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                UX Анализ
              </TabsTrigger>
              <TabsTrigger 
                value="ab-test" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                AB тест
              </TabsTrigger>
              <TabsTrigger 
                value="hypotheses" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Гипотезы
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                Продуктовая аналитика
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ux-analysis">
              <Card>
                <CardHeader>
                  <CardTitle>UX Анализ</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Полный анализ пользовательского опыта интерфейса
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    console.log('Отображаем результат аудита:', audit.result_data)
                    console.log('Ключи result_data:', Object.keys(audit.result_data))
                    console.log('analysis_result:', audit.result_data.analysis_result)
                    console.log('Весь result_data:', JSON.stringify(audit.result_data, null, 2))
                    
                    // result_data содержит напрямую результат анализа
                    const result = audit.result_data
                    console.log('Результат для AnalysisResult:', result)
                    return (
                      <AnalysisResult 
                        result={result}
                        screenshot={audit.input_data?.screenshotUrl}
                        url={audit.input_data?.url}
                        auditId={audit.id}
                      />
                    )
                  })()}
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Скачать отчет
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="ab-test">
              <Card>
                <CardHeader>
                  <CardTitle>AB тест</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Сравнение различных версий интерфейса для оптимизации конверсии
                  </p>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    AB тест
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Раздел в разработке
                  </p>
                  <p className="text-sm text-slate-500">
                    Здесь будут отображаться результаты A/B тестирования различных вариантов интерфейса
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать отчет
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="hypotheses">
              <Card>
                <CardHeader>
                  <CardTitle>Гипотезы</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Предложения по улучшению интерфейса на основе анализа
                  </p>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Гипотезы
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Раздел в разработке
                  </p>
                  <p className="text-sm text-slate-500">
                    Здесь будут отображаться гипотезы для улучшения пользовательского опыта
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать отчет
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
            
            <TabsContent value="analytics">
              <Card>
                <CardHeader>
                  <CardTitle>Продуктовая аналитика</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Метрики и аналитика продукта для принятия решений
                  </p>
                </CardHeader>
                <CardContent className="text-center py-12">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Продуктовая аналитика
                  </h3>
                  <p className="text-slate-600 mb-4">
                    Раздел в разработке
                  </p>
                  <p className="text-sm text-slate-500">
                    Здесь будут отображаться метрики продукта и аналитические данные
                  </p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>
                    <Download className="w-4 h-4 mr-2" />
                    Скачать отчет
                  </Button>
                  <Button variant="outline" size="sm" disabled>
                    <Share2 className="w-4 h-4 mr-2" />
                    Поделиться
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
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