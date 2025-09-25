'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DebugAnalysisDataProps {
  result: any
  title?: string
}

export function DebugAnalysisData({ result, title = "Debug Analysis Data" }: DebugAnalysisDataProps) {
  // Показываем только в development режиме
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-yellow-800">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <strong>Type:</strong> {typeof result}
          </div>
          
          <div>
            <strong>Is Array:</strong> {Array.isArray(result) ? 'Yes' : 'No'}
          </div>
          
          <div>
            <strong>Keys (if object):</strong>
            {typeof result === 'object' && result !== null ? (
              <ul className="list-disc list-inside ml-4">
                {Object.keys(result).map(key => (
                  <li key={key}>{key}: {typeof result[key]}</li>
                ))}
              </ul>
            ) : (
              'Not an object'
            )}
          </div>
          
          <div>
            <strong>Raw Data:</strong>
            <pre className="bg-white p-2 rounded border text-xs overflow-auto max-h-40">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
          
          {typeof result === 'string' && (
            <div>
              <strong>String Length:</strong> {result.length}
              <br />
              <strong>First 200 chars:</strong>
              <pre className="bg-white p-2 rounded border text-xs">
                {result.substring(0, 200)}...
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}