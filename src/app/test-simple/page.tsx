'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RefreshCw, Upload, CheckCircle } from 'lucide-react'

export default function TestSimplePage() {
  const [imageUrl, setImageUrl] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImageUrl('')
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleTest = async () => {
    if (!imageUrl && !imageFile) {
      setError('Загрузите изображение или введите URL')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)

    try {
      let finalImageUrl = imageUrl
      
      if (imageFile && !imageUrl) {
        const reader = new FileReader()
        finalImageUrl = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(imageFile)
        })
      }

      console.log('Sending request to test-simple API...')
      const response = await fetch('/api/test-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: finalImageUrl,
          context: context || undefined,
          targetAudience: targetAudience || undefined,
        }),
      })

      console.log('Response status:', response.status)
      const data = await response.json()
      console.log('Response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Ошибка при анализе')
      }

      setResult(data.data)
    } catch (err) {
      console.error('Error:', err)
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
            Простой тест API
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Загрузка изображения */}
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="imageFile">Загрузить изображение</Label>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
                {imageFile && (
                  <p className="text-sm text-green-600 mt-1">
                    ✓ Загружен файл: {imageFile.name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="imageUrl">Или URL изображения</Label>
                <Input
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value)
                    if (e.target.value) {
                      setImageFile(null)
                      setImagePreview('')
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>
            
            {/* Preview изображения */}
            {imagePreview && (
              <div className="mt-4">
                <Label>Предварительный просмотр:</Label>
                <div className="mt-2 border rounded-lg p-4">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-auto max-h-64 mx-auto"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="context">Контекст (опционально)</Label>
              <Input
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Лендинг для SaaS продукта"
              />
            </div>
            <div>
              <Label htmlFor="targetAudience">Целевая аудитория (опционально)</Label>
              <Input
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Малый и средний бизнес"
              />
            </div>
          </div>

          <Button 
            onClick={handleTest} 
            disabled={isLoading || (!imageUrl && !imageFile)}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Тестируем...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Запустить простой тест
              </>
            )}
          </Button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 font-medium">Ошибка:</p>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Результат простого теста:</h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Тип экрана</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{result.screenType || 'Не определен'}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Уверенность</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-700">{result.confidence || 'Не указана'}%</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Основные проблемы</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.mainProblems?.map((problem: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-slate-700">{problem}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Рекомендации</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.recommendations?.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-slate-700">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

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
