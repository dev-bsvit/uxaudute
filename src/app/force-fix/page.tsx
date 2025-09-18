'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function ForceFixPage() {
  const [auditId, setAuditId] = useState('37a9841e-b002-4b96-be78-1270396d5dad')
  const [token, setToken] = useState('fa179d92-0a86-4922-89f0-4b60c16c01bb')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const forceFix = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/force-fix-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auditId, token })
      })
      
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-red-600">ПРИНУДИТЕЛЬНОЕ исправление</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Audit ID:</label>
            <Input
              value={auditId}
              onChange={(e) => setAuditId(e.target.value)}
              placeholder="Введите ID аудита"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Token:</label>
            <Input
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Введите токен"
            />
          </div>
          
          <Button 
            onClick={forceFix} 
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700"
          >
            {loading ? 'ПРИНУДИТЕЛЬНО исправляем...' : 'ПРИНУДИТЕЛЬНО исправить'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {result?.success && (
            <div className="mt-4 p-4 bg-green-100 rounded">
              <p className="text-green-800 font-medium">✅ ПРИНУДИТЕЛЬНО исправлено!</p>
              <p className="text-sm text-green-700 mt-2">
                Теперь попробуйте открыть публичную ссылку:
              </p>
              <a 
                href={`/public/audit/${auditId}?token=${token}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline block mt-2"
              >
                Открыть публичную ссылку
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
