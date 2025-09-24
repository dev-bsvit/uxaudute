import { useState, useEffect, useCallback } from 'react'
import { languageReadinessChecker, ReadinessCheckResult } from '@/lib/i18n/language-readiness-checker'
import { useLanguage } from '@/components/language-provider'

export interface LanguageReadinessState {
  isChecking: boolean
  isReady: boolean
  result: ReadinessCheckResult | null
  error: string | null
}

/**
 * Хук для проверки готовности языковой системы
 */
export function useLanguageReadiness() {
  const { currentLanguage } = useLanguage()
  const [state, setState] = useState<LanguageReadinessState>({
    isChecking: false,
    isReady: false,
    result: null,
    error: null
  })

  /**
   * Выполняет проверку готовности
   */
  const checkReadiness = useCallback(async (language?: string) => {
    setState(prev => ({
      ...prev,
      isChecking: true,
      error: null
    }))

    try {
      const result = await languageReadinessChecker.checkReadiness(language || currentLanguage)
      
      setState({
        isChecking: false,
        isReady: result.isReady,
        result,
        error: null
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown readiness check error'
      
      setState({
        isChecking: false,
        isReady: false,
        result: null,
        error: errorMessage
      })

      throw error
    }
  }, [currentLanguage])

  /**
   * Быстрая проверка готовности
   */
  const quickCheck = useCallback(async (language?: string) => {
    try {
      const isReady = await languageReadinessChecker.quickReadinessCheck(language || currentLanguage)
      
      setState(prev => ({
        ...prev,
        isReady
      }))

      return isReady
    } catch (error) {
      console.warn('Quick readiness check failed:', error)
      return false
    }
  }, [currentLanguage])

  /**
   * Ожидает готовности системы
   */
  const waitForReadiness = useCallback(async (
    language?: string,
    timeout = 10000,
    checkInterval = 100
  ) => {
    setState(prev => ({
      ...prev,
      isChecking: true,
      error: null
    }))

    try {
      const result = await languageReadinessChecker.waitForReadiness(
        language || currentLanguage,
        timeout,
        checkInterval
      )
      
      setState({
        isChecking: false,
        isReady: result.isReady,
        result,
        error: null
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Readiness timeout error'
      
      setState({
        isChecking: false,
        isReady: false,
        result: null,
        error: errorMessage
      })

      throw error
    }
  }, [currentLanguage])

  /**
   * Генерирует отчет о готовности
   */
  const generateReport = useCallback(async () => {
    return await languageReadinessChecker.generateReadinessReport()
  }, [])

  return {
    ...state,
    checkReadiness,
    quickCheck,
    waitForReadiness,
    generateReport
  }
}

/**
 * Хук для автоматической проверки готовности при изменении языка
 */
export function useAutoLanguageReadiness(options: {
  autoCheck?: boolean
  checkInterval?: number
  onReady?: (result: ReadinessCheckResult) => void
  onError?: (error: string) => void
} = {}) {
  const { autoCheck = true, checkInterval = 1000, onReady, onError } = options
  const { currentLanguage } = useLanguage()
  const readiness = useLanguageReadiness()

  useEffect(() => {
    if (autoCheck && currentLanguage) {
      readiness.checkReadiness(currentLanguage)
        .then(result => {
          if (result.isReady) {
            onReady?.(result)
          }
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          onError?.(errorMessage)
        })
    }
  }, [autoCheck, currentLanguage, readiness, onReady, onError])

  // Периодическая проверка готовности
  useEffect(() => {
    if (autoCheck && checkInterval > 0 && !readiness.isReady) {
      const interval = setInterval(() => {
        readiness.quickCheck(currentLanguage)
      }, checkInterval)

      return () => clearInterval(interval)
    }
  }, [autoCheck, checkInterval, readiness.isReady, readiness, currentLanguage])

  return readiness
}