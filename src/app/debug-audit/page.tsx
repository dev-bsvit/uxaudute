'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export default function DebugAuditPage() {
  const [auditId, setAuditId] = useState('')
  const [debugData, setDebugData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debugAudit = async () => {
    if (!auditId.trim()) {
      setError('Введите ID аудита')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/debug-audit-data?id=${encodeURIComponent(auditId)}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при получении данных')
      }
      
      setDebugData(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Отладка данных аудита</h1>
        <p className="text-gray-600">Инструмент для диагностики проблем с отображением результатов анализа</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Проверить аудит</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="auditId">ID аудита</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="auditId"
                value={auditId}
                onChange={(e) => setAuditId(e.target.value)}
                placeholder="Введите ID аудита для проверки"
                className="flex-1"
              />
              <Button onClick={debugAudit} disabled={loading}>
                {loading ? 'Проверяем...' : 'Проверить'}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {debugData && (
        <div className="space-y-6">
          {/* Общая информация */}
          <Card>
            <CardHeader>
              <CardTitle>Общая информация</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">ID аудита</Label>
                  <p className="text-sm text-gray-600">{debugData.analysis.auditId}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Статус</Label>
                  <Badge variant={debugData.analysis.status === 'completed' ? 'default' : 'secondary'}>
                    {debugData.analysis.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Есть result_data</Label>
                  <Badge variant={debugData.analysis.hasResultData ? 'default' : 'destructive'}>
                    {debugData.analysis.hasResultData ? 'Да' : 'Нет'}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Тип данных</Label>
                  <p className="text-sm text-gray-600">{debugData.analysis.resultDataType}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Анализ структуры данных */}
          <Card>
            <CardHeader>
              <CardTitle>Структура данных</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Ключи в result_data</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {debugData.analysis.resultDataKeys.map((key: string) => (
                    <Badge key={key} variant="outline">{key}</Badge>
                  ))}
                </div>
              </div>

              {debugData.analysis.hasContent && (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div>
                      <Label className="text-sm font-medium">Есть content</Label>
                      <Badge variant="default">Да</Badge>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Тип content</Label>
                      <p className="text-sm text-gray-600">{debugData.analysis.contentType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Длина content</Label>
                      <p className="text-sm text-gray-600">{debugData.analysis.contentLength}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">JSON валиден</Label>
                      <Badge variant={debugData.analysis.contentParseable ? 'default' : 'destructive'}>
                        {debugData.analysis.contentParseable ? 'Да' : 'Нет'}
                      </Badge>
                    </div>
                  </div>

                  {debugData.analysis.contentParseable && (
                    <div>
                      <Label className="text-sm font-medium">Ключи в распарсенном content</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {debugData.analysis.parsedContentKeys.map((key: string) => (
                          <Badge key={key} variant="secondary">{key}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {debugData.analysis.parseError && (
                    <div>
                      <Label className="text-sm font-medium">Ошибка парсинга</Label>
                      <div className="bg-red-50 border border-red-200 rounded p-2 mt-1">
                        <p className="text-sm text-red-800">{debugData.analysis.parseError}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Рекомендации */}
          {debugData.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Рекомендации по исправлению</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {debugData.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-orange-500">⚠️</span>
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Превью content */}
          {debugData.analysis.contentPreview && (
            <Card>
              <CardHeader>
                <CardTitle>Превью content (первые 500 символов)</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                  {debugData.analysis.contentPreview}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* Сырые данные */}
          <Card>
            <CardHeader>
              <CardTitle>Сырые данные result_data</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-50 p-4 rounded text-xs overflow-auto max-h-60">
                {JSON.stringify(debugData.analysis.rawResultData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}