'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestJsonPage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTest = async (testType: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-json-parsing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType })
      })

      const data = await response.json()
      setResults(prev => [...prev, { testType, ...data, timestamp: new Date().toLocaleTimeString() }])
    } catch (error) {
      console.error('Ошибка теста:', error)
      setResults(prev => [...prev, { 
        testType, 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearResults = () => setResults([])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">🧪 Тест JSON Парсинга</h1>
        <p className="text-gray-600">Проверяем, что исправления работают корректно</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Button 
          onClick={() => runTest('valid')} 
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          ✅ Валидный JSON
        </Button>
        
        <Button 
          onClick={() => runTest('truncated')} 
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700"
        >
          ⚠️ Обрезанный JSON
        </Button>
        
        <Button 
          onClick={() => runTest('broken')} 
          disabled={loading}
          className="bg-red-600 hover:bg-red-700"
        >
          ❌ Сломанный JSON
        </Button>
        
        <Button 
          onClick={() => runTest('corrupted')} 
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          🔧 Поврежденный JSON
        </Button>
      </div>

      <div className="flex gap-2">
        <Button onClick={clearResults} variant="outline">
          🗑️ Очистить результаты
        </Button>
        <Button 
          onClick={() => {
            runTest('valid')
            setTimeout(() => runTest('truncated'), 500)
            setTimeout(() => runTest('broken'), 1000)
            setTimeout(() => runTest('corrupted'), 1500)
          }} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          🚀 Запустить все тесты
        </Button>
      </div>

      {loading && (
        <div className="text-center py-4">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Выполняется тест...</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? '✅' : '❌'} Тест: {result.testType}
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.recoveryMethod || 'error'}
                </Badge>
                <span className="text-sm text-gray-500 ml-auto">{result.timestamp}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {result.success ? (
                <div className="space-y-2">
                  <p><strong>Метод восстановления:</strong> {result.recoveryMethod}</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div className={result.hasScreenDescription ? 'text-green-600' : 'text-red-600'}>
                      📱 Screen Description: {result.hasScreenDescription ? '✅' : '❌'}
                    </div>
                    <div className={result.hasUxSurvey ? 'text-green-600' : 'text-red-600'}>
                      📊 UX Survey: {result.hasUxSurvey ? '✅' : '❌'}
                    </div>
                    <div className={result.hasAudience ? 'text-green-600' : 'text-red-600'}>
                      👥 Audience: {result.hasAudience ? '✅' : '❌'}
                    </div>
                    <div className={result.hasBehavior ? 'text-green-600' : 'text-red-600'}>
                      🎯 Behavior: {result.hasBehavior ? '✅' : '❌'}
                    </div>
                    <div className={result.hasProblemsAndSolutions ? 'text-green-600' : 'text-red-600'}>
                      🔧 Problems: {result.hasProblemsAndSolutions ? '✅' : '❌'}
                    </div>
                    <div className={result.hasSelfCheck ? 'text-green-600' : 'text-red-600'}>
                      ✅ Self Check: {result.hasSelfCheck ? '✅' : '❌'}
                    </div>
                  </div>
                  <p><strong>Confidence:</strong> {result.confidence}%</p>
                </div>
              ) : (
                <div className="text-red-600">
                  <p><strong>Ошибка:</strong> {result.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-blue-900 mb-2">📊 Статистика тестов</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <strong>Всего тестов:</strong> {results.length}
              </div>
              <div className="text-green-600">
                <strong>Успешных:</strong> {results.filter(r => r.success).length}
              </div>
              <div className="text-red-600">
                <strong>Ошибок:</strong> {results.filter(r => !r.success).length}
              </div>
              <div>
                <strong>Успешность:</strong> {Math.round((results.filter(r => r.success).length / results.length) * 100)}%
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
