'use client'

import { useEffect, useState } from 'react'

export default function TestPublicPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testAPI = async () => {
      try {
        setLoading(true)
        console.log('🔍 Тестируем API...')
        
        const response = await fetch('/api/public/audit/366c138f-b05a-4c25-9bde-ca0e2fc82391?token=a9bad717-fff0-412e-b153-239ad054129c')
        const data = await response.json()

        console.log('🔍 Ответ API:', { status: response.status, data })

        if (!response.ok) {
          throw new Error(data.error || 'Ошибка API')
        }

        setResult(data)
      } catch (err) {
        console.error('❌ Ошибка API:', err)
        setError(err instanceof Error ? err.message : 'Ошибка API')
      } finally {
        setLoading(false)
      }
    }

    testAPI()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Тестируем API...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <span className="text-red-600 text-2xl">❌</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка API</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Тест публичного API</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Результат API:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
