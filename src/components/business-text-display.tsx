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
        <div className="max-w-none">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 space-y-4">
            {data.result.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {paragraph.split('\n').map((line, lineIndex) => {
                  // Обработка заголовков
                  if (line.startsWith('### ')) {
                    return (
                      <h3 key={lineIndex} className="text-lg font-semibold text-gray-900 mt-6 mb-3 border-b border-gray-200 pb-2">
                        {line.replace('### ', '')}
                      </h3>
                    )
                  }
                  if (line.startsWith('## ')) {
                    return (
                      <h2 key={lineIndex} className="text-xl font-semibold text-gray-900 mt-8 mb-4 border-b border-gray-300 pb-2">
                        {line.replace('## ', '')}
                      </h2>
                    )
                  }
                  if (line.startsWith('# ')) {
                    return (
                      <h1 key={lineIndex} className="text-2xl font-bold text-gray-900 mt-8 mb-6 border-b-2 border-gray-400 pb-3">
                        {line.replace('# ', '')}
                      </h1>
                    )
                  }
                  // Обработка списков
                  if (line.startsWith('- ')) {
                    return (
                      <div key={lineIndex} className="ml-6 mb-2 flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-gray-700">{line.replace('- ', '')}</span>
                      </div>
                    )
                  }
                  if (line.match(/^\d+\. /)) {
                    return (
                      <div key={lineIndex} className="ml-6 mb-2 flex items-start">
                        <span className="text-blue-600 mr-2 font-semibold">{line.match(/^\d+\./)?.[0]}</span>
                        <span className="text-gray-700">{line.replace(/^\d+\. /, '')}</span>
                      </div>
                    )
                  }
                  // Обычный текст
                  return (
                    <span key={lineIndex} className="text-gray-700">
                      {line}
                    </span>
                  )
                })}
              </p>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
