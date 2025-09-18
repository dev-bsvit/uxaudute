'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function FixAuditPage() {
  const [auditId, setAuditId] = useState('37a9841e-b002-4b96-be78-1270396d5dad')
  const [token, setToken] = useState('add9a179-f469-41b9-80a1-37c9ba432342')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const fixAudit = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/fix-audit-public', {
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
          <CardTitle>Исправить публичный доступ</CardTitle>
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
            onClick={fixAudit} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Исправляем...' : 'Исправить'}
          </Button>
          
          {result && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <pre className="text-sm overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
