'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RefreshCw, Upload, CheckCircle } from 'lucide-react'

export default function TestPromptV2Page() {
  const [imageUrl, setImageUrl] = useState('')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleTest = async () => {
    if (!imageUrl) {
      setError('Введите URL изображения')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/test-prompt-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl,
          context: context || undefined,
          targetAudience: targetAudience || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при анализе')
      }

      setResult(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-green-600" />
            Тест промпта v2
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="imageUrl">URL изображения *</Label>
              <Input
                id="imageUrl"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="context">Контекст (опционально)</Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Лендинг для SaaS продукта"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetAudience">Целевая аудитория (опционально)</Label>
            <Textarea
              id="targetAudience"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Малый и средний бизнес, 25-45 лет, технически подкованные"
              rows={3}
            />
          </div>

          <Button 
            onClick={handleTest} 
            disabled={isLoading || !imageUrl}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Анализируем...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Запустить тест v2
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Результат анализа v2:</h3>
              
              {/* Показываем ключевые улучшения */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Продуктовая логика</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      Проблемы связаны с бизнес-метриками: {result.problemsAndSolutions?.[0]?.businessImpact?.description || 'Не найдено'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Контекстные вопросы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      Добавлены динамические вопросы: {result.uxSurvey?.dynamicQuestionsAdded ? 'Да' : 'Нет'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Тип экрана: {result.uxSurvey?.screenType || 'Не определен'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Сценарное мышление</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      Идеальный путь: {result.behavior?.userScenarios?.idealPath ? 'Есть' : 'Нет'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Типичные ошибки: {result.behavior?.userScenarios?.typicalError ? 'Есть' : 'Нет'}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Проверка разнообразия</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">
                      Прошла проверку: {result.selfCheck?.varietyCheck?.passed ? 'Да' : 'Нет'}
                    </p>
                    <p className="text-sm text-slate-600">
                      Разнообразие принципов: {result.selfCheck?.varietyCheck?.principleVariety?.length || 0}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Полный результат */}
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">Показать полный JSON результат</summary>
                <pre className="mt-2 p-4 bg-slate-100 rounded-lg overflow-auto text-xs">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
