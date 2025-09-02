'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout'
import { UploadForm } from '@/components/upload-form'
import { ActionPanel } from '@/components/action-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TEXTS, type ActionType } from '@/lib/utils'

export default function HomePage() {
  const [result, setResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleUpload = async (data: { url?: string; screenshot?: File }) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('Failed to analyze')
      }

      const { result } = await response.json()
      setResult(result)
    } catch (error) {
      console.error(error)
      setResult(TEXTS.error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAction = (action: ActionType) => {
    console.log('Action:', action)
    // TODO: Implement action handlers
  }

  return (
    <Layout title="UX Audit - Главная">
      <div className="space-y-8">
        {/* Онбординг */}
        <Card>
          <CardHeader>
            <CardTitle>Добро пожаловать в UX Audit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Профессиональный анализ пользовательского опыта вашего сайта.
              Загрузите ссылку или скриншот для начала исследования.
            </p>
            <p className="text-sm text-gray-500">
              {TEXTS.hint}
            </p>
          </CardContent>
        </Card>

        {/* Форма загрузки */}
        <UploadForm onSubmit={handleUpload} isLoading={isLoading} />

        {/* Результат */}
        {result && (
          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap text-sm">
                  {result}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Панель действий */}
        {result && (
          <ActionPanel onAction={handleAction} />
        )}
      </div>
    </Layout>
  )
}

