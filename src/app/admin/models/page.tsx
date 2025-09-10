'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { 
  Brain, 
  Clock, 
  Zap, 
  Eye, 
  Image, 
  Mic, 
  Volume2,
  TestTube,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react'

interface Model {
  id: string
  object: string
  created: number
  owned_by: string
  type: string
  capabilities: string[]
}

interface ModelTest {
  model: string
  response: string
  response_time_ms: number
  tokens_used: number
  success: boolean
  error?: string
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([])
  const [groupedModels, setGroupedModels] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState('')
  const [testPrompt, setTestPrompt] = useState('Проанализируй этот интерфейс с точки зрения UX. Найди 3 основные проблемы.')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<ModelTest | null>(null)

  useEffect(() => {
    loadModels()
  }, [])

  const loadModels = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/models')
      const data = await response.json()

      if (data.success) {
        setModels(data.all_models)
        setGroupedModels(data.models_by_type)
        console.log('Модели загружены:', data)
      } else {
        setError(data.error || 'Ошибка загрузки моделей')
      }
    } catch (err) {
      setError('Ошибка загрузки моделей')
      console.error('Error loading models:', err)
    } finally {
      setLoading(false)
    }
  }

  const testModel = async () => {
    if (!selectedModel) return

    try {
      setTesting(true)
      setTestResult(null)

      const response = await fetch('/api/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: selectedModel,
          prompt: testPrompt,
          max_tokens: 200
        })
      })

      const data = await response.json()
      setTestResult(data)
    } catch (err) {
      setTestResult({
        model: selectedModel,
        response: '',
        response_time_ms: 0,
        tokens_used: 0,
        success: false,
        error: 'Ошибка тестирования модели'
      })
    } finally {
      setTesting(false)
    }
  }

  const getCapabilityIcon = (capability: string) => {
    switch (capability) {
      case 'text-generation': return <Brain className="w-4 h-4" />
      case 'json-mode': return <Zap className="w-4 h-4" />
      case 'function-calling': return <TestTube className="w-4 h-4" />
      case 'vision': return <Eye className="w-4 h-4" />
      case 'image-analysis': return <Image className="w-4 h-4" />
      case 'fast-response': return <Clock className="w-4 h-4" />
      case 'image-generation': return <Image className="w-4 h-4" />
      case 'text-to-speech': return <Volume2 className="w-4 h-4" />
      case 'speech-to-text': return <Mic className="w-4 h-4" />
      default: return <Brain className="w-4 h-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'gpt4': return 'bg-blue-100 text-blue-800'
      case 'gpt3.5': return 'bg-green-100 text-green-800'
      case 'dall-e': return 'bg-purple-100 text-purple-800'
      case 'tts': return 'bg-orange-100 text-orange-800'
      case 'whisper': return 'bg-pink-100 text-pink-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Загружаем модели...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <Button onClick={loadModels} className="mt-4">
            Попробовать снова
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            🤖 OpenAI Models
          </h1>
          <p className="text-lg text-slate-600">
            Список доступных моделей и тестирование
          </p>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {models.length}
              </div>
              <div className="text-sm text-slate-600">Всего моделей</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-600">
                {groupedModels.gpt4?.length || 0}
              </div>
              <div className="text-sm text-slate-600">GPT-4</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {groupedModels.gpt3_5?.length || 0}
              </div>
              <div className="text-sm text-slate-600">GPT-3.5</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(groupedModels.dall_e?.length || 0) + (groupedModels.tts?.length || 0) + (groupedModels.whisper?.length || 0)}
              </div>
              <div className="text-sm text-slate-600">Специальные</div>
            </CardContent>
          </Card>
        </div>

        {/* Тестирование модели */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Тестирование модели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="model-select">Выберите модель</Label>
              <select
                id="model-select"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full mt-2 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Выберите модель для тестирования</option>
                {models.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.id} ({model.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="test-prompt">Тестовый промпт</Label>
              <Textarea
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                rows={3}
                className="mt-2"
                placeholder="Введите промпт для тестирования..."
              />
            </div>

            <Button 
              onClick={testModel} 
              disabled={!selectedModel || testing}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Тестируем...
                </>
              ) : (
                <>
                  <TestTube className="w-4 h-4 mr-2" />
                  Тестировать модель
                </>
              )}
            </Button>

            {testResult && (
              <Card className={testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                <CardContent className="p-4">
                  <div className="flex items-center mb-2">
                    {testResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className="font-semibold">
                      {testResult.success ? 'Тест успешен' : 'Ошибка тестирования'}
                    </span>
                  </div>
                  
                  {testResult.success ? (
                    <div className="space-y-2">
                      <div className="text-sm">
                        <strong>Модель:</strong> {testResult.model}
                      </div>
                      <div className="text-sm">
                        <strong>Время ответа:</strong> {testResult.response_time_ms}ms
                      </div>
                      <div className="text-sm">
                        <strong>Токены:</strong> {testResult.tokens_used}
                      </div>
                      <div className="mt-3 p-3 bg-white rounded border">
                        <strong>Ответ:</strong>
                        <div className="mt-1 text-sm">{testResult.response}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-red-600">
                      {testResult.error}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Список моделей по типам */}
        {Object.entries(groupedModels).map(([type, typeModels]: [string, any]) => (
          typeModels.length > 0 && (
            <Card key={type}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {type === 'gpt4' && <Brain className="w-5 h-5 text-blue-600" />}
                  {type === 'gpt3_5' && <Brain className="w-5 h-5 text-green-600" />}
                  {type === 'dall_e' && <Image className="w-5 h-5 text-purple-600" />}
                  {type === 'tts' && <Volume2 className="w-5 h-5 text-orange-600" />}
                  {type === 'whisper' && <Mic className="w-5 h-5 text-pink-600" />}
                  {type === 'other' && <Brain className="w-5 h-5 text-gray-600" />}
                  {type.toUpperCase()} ({typeModels.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {typeModels.map((model: Model) => (
                    <div
                      key={model.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedModel === model.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                      }`}
                      onClick={() => setSelectedModel(model.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-sm truncate">
                          {model.id}
                        </h3>
                        <Badge className={getTypeColor(model.type)}>
                          {model.type}
                        </Badge>
                      </div>
                      
                      <div className="text-xs text-gray-500 mb-2">
                        Создана: {new Date(model.created * 1000).toLocaleDateString()}
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {model.capabilities.map((capability) => (
                          <div
                            key={capability}
                            className="flex items-center gap-1 text-xs text-gray-600"
                            title={capability}
                          >
                            {getCapabilityIcon(capability)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        ))}
      </div>
    </div>
  )
}
