import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

interface BusinessTextDisplayProps {
  data: { result: string } | null
  isLoading?: boolean
  onGenerate?: () => void
}

export const BusinessTextDisplay: React.FC<BusinessTextDisplayProps> = ({ 
  data, 
  isLoading = false, 
  onGenerate 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Генерируем бизнес аналитику...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || !data.result) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Бизнес аналитика</span>
            {onGenerate && (
              <button
                onClick={onGenerate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Сгенерировать
              </button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Бизнес аналитика еще не сгенерирована</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Бизнес аналитика</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">
            {data.result}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
