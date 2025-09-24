'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'
import { useI18nError } from '@/hooks/use-i18n-error'
import { ErrorType } from '@/lib/i18n/error-handler'

interface TranslationErrorDisplayProps {
  showCriticalOnly?: boolean
  autoHide?: boolean
  autoHideDelay?: number
}

/**
 * Компонент для отображения ошибок перевода пользователю
 */
export function TranslationErrorDisplay({
  showCriticalOnly = true,
  autoHide = true,
  autoHideDelay = 5000
}: TranslationErrorDisplayProps) {
  const { getRecentErrors, hasCriticalErrors } = useI18nError()
  const [isVisible, setIsVisible] = useState(false)
  const [currentError, setCurrentError] = useState<string | null>(null)

  useEffect(() => {
    const checkForErrors = () => {
      if (showCriticalOnly && !hasCriticalErrors()) {
        setIsVisible(false)
        return
      }

      const recentErrors = getRecentErrors(1)
      if (recentErrors.length > 0) {
        const error = recentErrors[0]
        
        // Показываем только определенные типы ошибок пользователю
        const userVisibleErrors = [
          ErrorType.TRANSLATION_LOADING_FAILED,
          ErrorType.LANGUAGE_SWITCH_FAILED,
          ErrorType.NETWORK_CONNECTION_FAILED,
          ErrorType.NETWORK_TIMEOUT
        ]

        if (userVisibleErrors.includes(error.type)) {
          setCurrentError(error.message)
          setIsVisible(true)

          if (autoHide) {
            setTimeout(() => {
              setIsVisible(false)
            }, autoHideDelay)
          }
        }
      }
    }

    // Проверяем ошибки каждые 2 секунды
    const interval = setInterval(checkForErrors, 2000)
    
    // Проверяем сразу
    checkForErrors()

    return () => clearInterval(interval)
  }, [showCriticalOnly, hasCriticalErrors, getRecentErrors, autoHide, autoHideDelay])

  const handleRetry = () => {
    // Перезагружаем страницу для повторной попытки
    window.location.reload()
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible || !currentError) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium mb-1">Проблема с загрузкой</p>
              <p className="text-sm">{currentError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-800"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              className="flex items-center gap-1 text-xs"
            >
              <RefreshCw className="h-3 w-3" />
              Повторить
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  )
}

/**
 * Компонент для отображения индикатора fallback режима
 */
export function FallbackIndicator() {
  const { getRecentErrors } = useI18nError()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    const checkFallbackUsage = () => {
      const recentErrors = getRecentErrors(5)
      const hasFallbackErrors = recentErrors.some(error => error.fallbackUsed)
      setShowIndicator(hasFallbackErrors)
    }

    const interval = setInterval(checkFallbackUsage, 3000)
    checkFallbackUsage()

    return () => clearInterval(interval)
  }, [getRecentErrors])

  if (!showIndicator) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="bg-yellow-100 border border-yellow-300 rounded-lg px-3 py-2 text-sm text-yellow-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>Используется резервный режим</span>
        </div>
      </div>
    </div>
  )
}