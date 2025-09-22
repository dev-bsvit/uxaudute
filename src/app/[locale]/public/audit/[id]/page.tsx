'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AnalysisResultDisplay } from '@/components/analysis-result-display'
import { ABTestDisplay } from '@/components/ab-test-display'
import { HypothesesDisplay } from '@/components/hypotheses-display'
import { BusinessTextDisplay } from '@/components/business-text-display'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Share2, Download, ExternalLink, BarChart3, Lightbulb, Target } from 'lucide-react'
import Link from 'next/link'

interface PublicAudit {
  id: string
  name: string
  type: string
  status: string
  input_data: any
  result_data: any
  annotations: any
  confidence: number | null
  created_at: string
  updated_at: string
  project: {
    id: string
    name: string
    description: string
  }
  ab_test_data?: any
  hypotheses_data?: any
  business_analytics_data?: any
}

export default function PublicAuditPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const auditId = params.id as string
  const token = searchParams.get('token')
  
  const [audit, setAudit] = useState<PublicAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('audit')

  useEffect(() => {
    if (auditId && token) {
      loadPublicAudit()
    } else {
      setError('Неверная ссылка')
      setLoading(false)
    }
  }, [auditId, token])

  // Обработка URL параметров для выбора активной вкладки
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab && ['audit', 'ab-test', 'hypotheses', 'analytics'].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const loadPublicAudit = async () => {
    try {
      setLoading(true)
      console.log('🔍 Загружаем публичный аудит:', auditId, 'с токеном:', token)
      
      const response = await fetch(`/api/public/audit/${auditId}?token=${token}`)
      const data = await response.json()

      console.log('🔍 Ответ API:', { status: response.status, data })

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка загрузки аудита')
      }

      console.log('✅ Аудит загружен:', data.audit)
      setAudit(data.audit)
    } catch (err) {
      console.error('❌ Ошибка загрузки публичного аудита:', err)
      setError(err instanceof Error ? err.message : 'Ошибка загрузки аудита')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `UX Аудит: ${audit?.name}`,
        text: `Посмотрите результаты UX аудита: ${audit?.name}`,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

  const handleDownload = () => {
    console.log('Download audit')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка аудита...</p>
        </div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <ExternalLink className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Аудит не найден или ссылка недействительна'}
          </p>
          <Link 
            href={`/${locale}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Перейти на главную
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {audit.name}
                </h1>
                <Badge variant="secondary">
                  {audit.type}
                </Badge>
                {audit.confidence && (
                  <Badge variant="outline">
                    Уверенность: {audit.confidence}%
                  </Badge>
                )}
              </div>
              <p className="text-gray-600">
                Проект: {audit.project.name} • {new Date(audit.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Скачать
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Контент с вкладками */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              UX Аудит
            </TabsTrigger>
            <TabsTrigger value="ab-test" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              AB тесты
            </TabsTrigger>
            <TabsTrigger value="hypotheses" className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              Гипотезы
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Аналитика
            </TabsTrigger>
          </TabsList>

          {/* Вкладка UX Аудит */}
          <TabsContent value="audit" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Результаты UX Анализа</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Детальный анализ пользовательского опыта интерфейса
                </p>
              </CardHeader>
              <CardContent>
                {audit.result_data ? (
                  <AnalysisResultDisplay 
                    analysis={audit.result_data}
                    screenshot={audit.input_data?.screenshotUrl}
                    url={audit.input_data?.url}
                    auditId={audit.id}
                    showDetails={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Результаты анализа недоступны</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка AB тесты */}
          <TabsContent value="ab-test" className="mt-6">
            {audit.ab_test_data ? (
              <ABTestDisplay 
                data={audit.ab_test_data}
                isLoading={false}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    AB тесты не сгенерированы
                  </h3>
                  <p className="text-gray-600">
                    Для генерации AB тестов необходимо войти в систему
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка Гипотезы */}
          <TabsContent value="hypotheses" className="mt-6">
            {audit.hypotheses_data ? (
              <HypothesesDisplay 
                data={audit.hypotheses_data}
                isLoading={false}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <Lightbulb className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Гипотезы не сгенерированы
                  </h3>
                  <p className="text-gray-600">
                    Для генерации гипотез необходимо войти в систему
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Вкладка Продуктовая аналитика */}
          <TabsContent value="analytics" className="mt-6">
            {audit.business_analytics_data ? (
              <BusinessTextDisplay 
                data={audit.business_analytics_data}
                isLoading={false}
              />
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Продуктовая аналитика не сгенерирована
                  </h3>
                  <p className="text-gray-600">
                    Для генерации аналитики необходимо войти в систему
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Информация о проекте */}
        {audit.project.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>О проекте</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{audit.project.description}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Футер */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} UX Audit Platform. Все права защищены.
        </div>
      </footer>
    </div>
  )
}
