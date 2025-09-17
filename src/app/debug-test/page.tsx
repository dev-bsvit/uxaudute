'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function DebugTestPage() {
  const [url, setUrl] = useState('https://example.com')
  const [context, setContext] = useState('Тестовый контекст')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testAPI = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/debug-test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          context,
          auditId: 'test-audit-id'
        })
      })
      
      const data = await response.json()
      setResult({ status: response.status, data })
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Debug Test - Проверка API</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>
          
          <div>
            <Label htmlFor="context">Контекст</Label>
            <Textarea
              id="context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Тестовый контекст"
            />
          </div>
          
          <Button onClick={testAPI} disabled={loading}>
            {loading ? 'Тестируем...' : 'Тестировать API'}
          </Button>
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">Результат:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




