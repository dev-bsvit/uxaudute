'use client'

import React, { useState, useEffect } from 'react'
import { AnalysisResultDisplay } from '@/components/analysis-result-display'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function DemoResultsPage() {
  const [analysis, setAnalysis] = useState<StructuredAnalysisResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runAnalysis = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/research-json', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: 'https://example.com',
          context: 'E-commerce магазин с товарами'
        })
      })

      if (!response.ok) {
        throw new Error('Ошибка при выполнении анализа')
      }

      const data = await response.json()
      
      if (data.success) {
        setAnalysis(data.data)
      } else {
        throw new Error(data.error || 'Неизвестная ошибка')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Демо результатов UX анализа
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Посмотрите, как выглядят структурированные результаты анализа
          </p>
          
          <Button 
            onClick={runAnalysis} 
            disabled={loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Анализируем...
              </>
            ) : (
              'Запустить анализ'
            )}
          </Button>
        </div>

        {error && (
          <Card className="mb-8 border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="text-red-800">
                <h3 className="font-medium mb-2">Ошибка анализа</h3>
                <p>{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {analysis && (
          <AnalysisResultDisplay analysis={analysis} />
        )}

        {!analysis && !loading && !error && (
          <Card>
            <CardContent className="pt-6 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Готовы к анализу?
              </h3>
              <p className="text-gray-600 mb-4">
                Нажмите кнопку выше, чтобы запустить анализ и увидеть структурированные результаты
              </p>
              <div className="text-sm text-gray-500">
                Анализ будет выполнен для примера e-commerce сайта
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}



