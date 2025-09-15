'use client'

import { useEffect, useState } from 'react'

export default function TestPublicAuditPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const testPublicAudit = async () => {
      try {
        setLoading(true)
        console.log('🔍 Тестируем публичный аудит...')
        
        // Сначала создаем публичную ссылку
        const createResponse = await fetch('/api/audits/366c138f-b05a-4c25-9bde-ca0e2fc82391/public-link', {
          method: 'POST'
        })
        const createData = await createResponse.json()
        
        console.log('🔍 Результат создания ссылки:', createData)

        if (!createResponse.ok) {
          throw new Error(createData.error || 'Ошибка создания публичной ссылки')
        }

        // Теперь получаем данные аудита
        const getResponse = await fetch(`/api/public/audit/366c138f-b05a-4c25-9bde-ca0e2fc82391?token=${createData.token}`)
        const getData = await getResponse.json()

        console.log('🔍 Результат получения аудита:', getData)

        if (!getResponse.ok) {
          throw new Error(getData.error || 'Ошибка получения аудита')
        }

        setResult({
          createResult: createData,
          getResult: getData
        })
      } catch (err) {
        console.error('❌ Ошибка тестирования:', err)
        setError(err instanceof Error ? err.message : 'Ошибка тестирования')
      } finally {
        setLoading(false)
      }
    }

    testPublicAudit()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Тестируем публичный аудит...</p>
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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Ошибка тестирования</h1>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Тест публичного аудита</h1>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Результат создания публичной ссылки:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result?.createResult, null, 2)}
            </pre>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Результат получения аудита:</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(result?.getResult, null, 2)}
            </pre>
          </div>

          {result?.createResult?.publicUrl && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Публичная ссылка:</h2>
              <a 
                href={result.createResult.publicUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                {result.createResult.publicUrl}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
