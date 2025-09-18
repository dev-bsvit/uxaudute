'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { AnalysisResult } from '@/components/analysis-result'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Share2, Download, ExternalLink } from 'lucide-react'
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
}

export default function PublicAuditPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const auditId = params.id as string
  const token = searchParams.get('token')
  
  const [audit, setAudit] = useState<PublicAudit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (auditId && token) {
      loadPublicAudit()
    } else {
      setError('Неверная ссылка')
      setLoading(false)
    }
  }, [auditId, token])

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
      // Fallback - копируем ссылку в буфер обмена
      navigator.clipboard.writeText(window.location.href)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

  const handleDownload = () => {
    // TODO: Implement download functionality
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
            href="/"
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

      {/* Контент */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Результаты UX Анализа</CardTitle>
            <p className="text-sm text-muted-foreground">
              Детальный анализ пользовательского опыта интерфейса
            </p>
          </CardHeader>
          <CardContent>
            {audit.result_data ? (
              <AnalysisResult 
                result={audit.result_data}
                screenshot={audit.input_data?.screenshotUrl}
                url={audit.input_data?.url}
                auditId={audit.id}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Результаты анализа недоступны</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Информация о проекте */}
        {audit.project.description && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>О проекте</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{audit.project.description}</p>
            </CardContent>
          </Card>
        )}

        {/* Футер */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Создано с помощью{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              UX Audit Platform
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
