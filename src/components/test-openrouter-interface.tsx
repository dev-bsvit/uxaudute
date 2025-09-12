'use client'

import { useState } from 'react'

interface TestResult {
  success: boolean
  model: string
  response: string
  finishReason: string
  usage: any
  error?: string
  fullResponse?: any
}

export function TestOpenRouterInterface() {
  const [results, setResults] = useState<TestResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [customMessage, setCustomMessage] = useState('Hello! Please respond.')

  // Список моделей для тестирования
  const models = [
    { id: 'openai/gpt-4o', name: 'GPT-4o', description: 'OpenAI GPT-4o' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'Anthropic Claude' },
    { id: 'deepseek/deepseek-chat-v3.1:free', name: 'DeepSeek Chat v3.1', description: 'DeepSeek (Free)' },
    { id: 'openrouter/sonoma-sky-alpha', name: 'Sonoma Sky Alpha', description: 'Oak AI Sonoma' },
    { id: 'meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B', description: 'Meta Llama (Free)' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', description: 'Google Gemini' }
  ]

  const testModel = async (modelId: string, modelName: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/test-openrouter-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelId,
          message: customMessage
        })
      })

      const data = await response.json()
      
      const result: TestResult = {
        success: data.success,
        model: modelName,
        response: data.response || 'Нет ответа',
        finishReason: data.finishReason || 'unknown',
        usage: data.usage,
        error: data.error,
        fullResponse: data.fullResponse
      }

      setResults(prev => [result, ...prev])
      
    } catch (error) {
      const result: TestResult = {
        success: false,
        model: modelName,
        response: 'Ошибка запроса',
        finishReason: 'error',
        usage: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
      
      setResults(prev => [result, ...prev])
    } finally {
      setIsLoading(false)
    }
  }

  const testAllModels = async () => {
    setIsLoading(true)
    setResults([])
    
    for (const model of models) {
      await testModel(model.id, model.name)
      // Небольшая пауза между запросами
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setIsLoading(false)
  }

  const clearResults = () => {
    setResults([])
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-2">
          🧪 Тестирование OpenRouter API
        </h1>
        <p className="text-blue-700">
          Простой интерфейс для тестирования различных моделей через OpenRouter API.
          Следует официальной документации <a href="https://openrouter.ai/docs/quickstart" target="_blank" className="underline">OpenRouter Quickstart</a>.
        </p>
      </div>

      {/* Настройки тестирования */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">⚙️ Настройки тестирования</h2>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Тестовое сообщение:
            </label>
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите сообщение для тестирования"
            />
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={testAllModels}
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '⏳ Тестируем...' : '🚀 Тестировать все модели'}
            </button>
            
            <button
              onClick={clearResults}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              🗑️ Очистить результаты
            </button>
          </div>
        </div>
      </div>

      {/* Список моделей */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-3">🤖 Доступные модели</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {models.map((model) => (
            <div key={model.id} className="border border-gray-200 rounded-lg p-3">
              <h3 className="font-medium text-gray-900">{model.name}</h3>
              <p className="text-sm text-gray-600 mb-2">{model.description}</p>
              <button
                onClick={() => testModel(model.id, model.name)}
                disabled={isLoading}
                className="w-full px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '⏳' : '🧪 Тест'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Результаты тестирования */}
      {results.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">📊 Результаты тестирования</h2>
          
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${
                  result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{result.model}</h3>
                  <span className={`px-2 py-1 text-xs rounded ${
                    result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.success ? '✅ Успех' : '❌ Ошибка'}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Ответ:</span>
                    <p className="text-gray-700 mt-1">{result.response}</p>
                  </div>
                  
                  <div className="flex space-x-4 text-xs text-gray-600">
                    <span>Finish Reason: {result.finishReason}</span>
                    {result.usage && (
                      <span>Tokens: {result.usage.total_tokens || 'N/A'}</span>
                    )}
                  </div>
                  
                  {result.error && (
                    <div className="text-red-600 text-xs">
                      <span className="font-medium">Ошибка:</span> {result.error}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
