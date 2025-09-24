import { useState, useEffect, useCallback } from 'react'
import { languageDetector, LanguageDetectionResult } from '@/lib/i18n/language-detector'

export interface BrowserLanguageDetectionState {
  isDetecting: boolean
  detectionResult: LanguageDetectionResult | null
  error: string | null
}

/**
 * Хук для автоматического определения языка браузера
 */
export function useBrowserLanguageDetection() {
  const [state, setState] = useState<BrowserLanguageDetectionState>({
    isDetecting: false,
    detectionResult: null,
    error: null
  })

  /**
   * Выполняет определение языка
   */
  const detectLanguage = useCallback(async () => {
    setState(prev => ({
      ...prev,
      isDetecting: true,
      error: null
    }))

    try {
      const result = await languageDetector.detectLanguage()
      
      setState({
        isDetecting: false,
        detectionResult: result,
        error: null
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown detection error'
      
      setState({
        isDetecting: false,
        detectionResult: null,
        error: errorMessage
      })

      throw error
    }
  }, [])

  /**
   * Получает поддерживаемые языки
   */
  const getSupportedLanguages = useCallback(() => {
    return languageDetector.getSupportedLanguages()
  }, [])

  /**
   * Проверяет, поддерживается ли язык
   */
  const isLanguageSupported = useCallback((language: string) => {
    return languageDetector.isLanguageSupported(language)
  }, [])

  /**
   * Получает язык по умолчанию
   */
  const getDefaultLanguage = useCallback(() => {
    return languageDetector.getDefaultLanguage()
  }, [])

  /**
   * Получает наиболее подходящий язык из списка
   */
  const getBestMatchLanguage = useCallback((requestedLanguages: string[]) => {
    return languageDetector.getBestMatchLanguage(requestedLanguages)
  }, [])

  /**
   * Генерирует отчет о определении языка
   */
  const generateDetectionReport = useCallback(async () => {
    return await languageDetector.generateDetectionReport()
  }, [])

  return {
    ...state,
    detectLanguage,
    getSupportedLanguages,
    isLanguageSupported,
    getDefaultLanguage,
    getBestMatchLanguage,
    generateDetectionReport
  }
}

/**
 * Хук для автоматического определения языка при монтировании
 */
export function useAutoLanguageDetection(options: {
  autoStart?: boolean
  onDetected?: (result: LanguageDetectionResult) => void
  onError?: (error: string) => void
} = {}) {
  const { autoStart = true, onDetected, onError } = options
  const detection = useBrowserLanguageDetection()

  useEffect(() => {
    if (autoStart && !detection.detectionResult && !detection.isDetecting) {
      detection.detectLanguage()
        .then(result => {
          onDetected?.(result)
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          onError?.(errorMessage)
        })
    }
  }, [autoStart, detection, onDetected, onError])

  return detection
}