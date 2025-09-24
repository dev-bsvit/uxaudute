'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Globe, 
  RefreshCw,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { useLanguageInitialization } from '@/hooks/use-language-initialization'
import { useTranslation } from '@/hooks/use-translation'

interface LanguageInitializationStatusProps {
  showDetails?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

/**
 * Компонент для отображения статуса инициализации языковой системы
 */
export function LanguageInitializationStatus({
  showDetails = false,
  autoHide = true,
  autoHideDelay = 3000
}: LanguageInitializationStatusProps) {
  const { t } = useTranslation()
  const initialization = useLanguageInitialization()
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && initialization.isInitialized && !initialization.error) {
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, initialization.isInitialized, initialization.error])

  if (!isVisible) {
    return null
  }

  const getStatusIcon = () => {
    if (initialization.isInitializing) {
      return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
    }
    if (initialization.error) {
      return <XCircle className="h-5 w-5 text-red-600" />
    }
    if (initialization.isInitialized) {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    return <Globe className="h-5 w-5 text-gray-400" />
  }

  const getStatusText = () => {
    if (initialization.isInitializing) {
      return t('components.languageInit.initializing')
    }
    if (initialization.error) {
      return `${t('errors.general.unknownError')}: ${initialization.error}`
    }
    if (initialization.isInitialized) {
      return t('components.languageInit.ready')
    }
    return t('components.languageInit.waiting')
  }

  const getStatusColor = () => {
    if (initialization.isInitializing) return 'bg-blue-50 border-blue-200'
    if (initialization.error) return 'bg-red-50 border-red-200'
    if (initialization.isInitialized) return 'bg-green-50 border-green-200'
    return 'bg-gray-50 border-gray-200'
  }

  const getProgress = () => {
    if (!initialization.initializationResult) return 0
    
    const result = initialization.initializationResult
    let progress = 0
    
    if (result.translationsLoaded) progress += 40
    if (result.promptsLoaded) progress += 30
    if (result.userPreferenceSynced) progress += 30
    
    return progress
  }

  return (
    <div className="fixed top-4 left-4 z-50 max-w-sm">
      <Card className={`${getStatusColor()} shadow-lg`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
            {!initialization.error && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="ml-auto h-6 w-6 p-0"
              >
                ×
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        {(showDetails || initialization.error) && (
          <CardContent className="pt-0">
            {initialization.isInitializing && (
              <div className="space-y-2">
                <Progress value={getProgress()} className="h-2" />
                <p className="text-xs text-gray-600">
                  {t('components.languageInit.loadingTranslations')}
                </p>
              </div>
            )}

            {initialization.initializationResult && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span>Язык:</span>
                  <Badge variant="outline">
                    {initialization.initializationResult.language.toUpperCase()}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span>Источник:</span>
                  <span className="text-gray-600">
                    {initialization.initializationResult.detectionResult.source}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span>Время:</span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {initialization.initializationResult.initializationTime}ms
                  </span>
                </div>

                {initialization.initializationResult.errors.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                    <div className="flex items-center gap-1 text-yellow-800 mb-1">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Предупреждения:</span>
                    </div>
                    <ul className="text-yellow-700 space-y-1">
                      {initialization.initializationResult.errors.slice(0, 3).map((error, index) => (
                        <li key={index} className="truncate">• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {initialization.error && (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={initialization.reinitialize}
                  className="w-full flex items-center gap-2"
                >
                  <RefreshCw className="h-3 w-3" />
                  Повторить инициализацию
                </Button>
              </div>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}

/**
 * Простой индикатор загрузки для инициализации
 */
export function LanguageLoadingIndicator() {
  const initialization = useLanguageInitialization()

  if (!initialization.isInitializing) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-gray-600">Загрузка языковых настроек...</p>
      </div>
    </div>
  )
}