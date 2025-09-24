'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Monitor, 
  User, 
  Settings,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check
} from 'lucide-react'
import { useBrowserLanguageDetection } from '@/hooks/use-browser-language-detection'
import { useLanguage } from '@/components/language-provider'

/**
 * Компонент для отладки определения языка (только в режиме разработки)
 */
export function LanguageDetectionDebug() {
  const { currentLanguage, availableLanguages } = useLanguage()
  const detection = useBrowserLanguageDetection()
  const [isExpanded, setIsExpanded] = useState(false)
  const [reportCopied, setReportCopied] = useState(false)

  // Скрываем в продакшене
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'user-preference':
        return <User className="h-4 w-4" />
      case 'browser':
        return <Monitor className="h-4 w-4" />
      case 'default':
        return <Settings className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'user-preference':
        return 'Настройки пользователя'
      case 'browser':
        return 'Браузер'
      case 'default':
        return 'По умолчанию'
      default:
        return 'Неизвестно'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.7) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleCopyReport = async () => {
    try {
      const report = await detection.generateDetectionReport()
      await navigator.clipboard.writeText(report)
      setReportCopied(true)
      setTimeout(() => setReportCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy report:', error)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="bg-gray-900 text-white border-gray-700 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span>Language Debug</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
            >
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Текущий:</span>
              <Badge variant="outline" className="text-white border-gray-600">
                {currentLanguage.toUpperCase()}
              </Badge>
            </div>

            {detection.detectionResult && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Источник:</span>
                <div className="flex items-center gap-1">
                  {getSourceIcon(detection.detectionResult.source)}
                  <span className="text-xs">{getSourceLabel(detection.detectionResult.source)}</span>
                </div>
              </div>
            )}

            {detection.detectionResult && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Уверенность:</span>
                <span className={`font-mono ${getConfidenceColor(detection.detectionResult.confidence)}`}>
                  {(detection.detectionResult.confidence * 100).toFixed(0)}%
                </span>
              </div>
            )}

            <div className="flex gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={detection.detectLanguage}
                disabled={detection.isDetecting}
                className="flex-1 h-7 text-xs border-gray-600 text-gray-300 hover:text-white"
              >
                {detection.isDetecting ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyReport}
                className="h-7 px-2 border-gray-600 text-gray-300 hover:text-white"
              >
                {reportCopied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {isExpanded && (
              <div className="mt-3 pt-2 border-t border-gray-700 space-y-2">
                <div className="text-xs">
                  <div className="text-gray-400 mb-1">Доступные языки:</div>
                  <div className="flex flex-wrap gap-1">
                    {availableLanguages.map(lang => (
                      <Badge 
                        key={lang.code} 
                        variant={lang.code === currentLanguage ? "default" : "outline"}
                        className="text-xs h-5 border-gray-600"
                      >
                        {lang.flag} {lang.code}
                      </Badge>
                    ))}
                  </div>
                </div>

                {detection.error && (
                  <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                    <div className="font-medium mb-1">Ошибка:</div>
                    <div className="font-mono text-xs">{detection.error}</div>
                  </div>
                )}

                {typeof window !== 'undefined' && (
                  <div className="text-xs">
                    <div className="text-gray-400 mb-1">Браузер:</div>
                    <div className="font-mono text-xs text-gray-300">
                      {navigator.language} ({navigator.languages?.join(', ')})
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}