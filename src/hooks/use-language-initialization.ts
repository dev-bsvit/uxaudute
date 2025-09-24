import { useState, useEffect, useCallback } from 'react'
import { languageInitializer, InitializationResult } from '@/lib/i18n/language-initializer'
import { useLanguage } from '@/hooks/use-language'

export interface LanguageInitializationState {
  isInitializing: boolean
  isInitialized: boolean
  initializationResult: InitializationResult | null
  error: string | null
}

/**
 * Хук для управления инициализацией языковой системы
 */
export function useLanguageInitialization() {
  const { setLanguage } = useLanguage()
  const [state, setState] = useState<LanguageInitializationState>({
    isInitializing: false,
    isInitialized: false,
    initializationResult: null,
    error: null
  })

  /**
   * Инициализирует языковую систему
   */
  const initialize = useCallback(async (quick = false) => {
    setState(prev => ({
      ...prev,
      isInitializing: true,
      error: null
    }))

    try {
      const result = quick 
        ? await languageInitializer.quickInitialize()
        : await languageInitializer.initialize()

      // Устанавливаем определенный язык
      await setLanguage(result.language)

      setState({
        isInitializing: false,
        isInitialized: true,
        initializationResult: result,
        error: null
      })

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error'
      
      setState({
        isInitializing: false,
        isInitialized: false,
        initializationResult: null,
        error: errorMessage
      })

      throw error
    }
  }, [setLanguage])

  /**
   * Быстрая инициализация
   */
  const quickInitialize = useCallback(() => {
    return initialize(true)
  }, [initialize])

  /**
   * Полная инициализация
   */
  const fullInitialize = useCallback(() => {
    return initialize(false)
  }, [initialize])

  /**
   * Переинициализация системы
   */
  const reinitialize = useCallback(async () => {
    languageInitializer.reset()
    return await initialize()
  }, [initialize])

  /**
   * Проверяет готовность системы
   */
  const isReady = useCallback(() => {
    return state.isInitialized && !state.isInitializing && !state.error
  }, [state])

  /**
   * Получает отчет об инициализации
   */
  const getInitializationReport = useCallback(async () => {
    return await languageInitializer.generateInitializationReport()
  }, [])

  return {
    ...state,
    initialize: fullInitialize,
    quickInitialize,
    reinitialize,
    isReady,
    getInitializationReport
  }
}

/**
 * Хук для автоматической инициализации при монтировании компонента
 */
export function useAutoLanguageInitialization(options: {
  quick?: boolean
  autoStart?: boolean
} = {}) {
  const { quick = true, autoStart = true } = options
  const initialization = useLanguageInitialization()

  useEffect(() => {
    if (autoStart && !initialization.isInitialized && !initialization.isInitializing) {
      if (quick) {
        initialization.quickInitialize().catch(error => {
          console.error('Auto language initialization failed:', error)
        })
      } else {
        initialization.initialize().catch(error => {
          console.error('Auto language initialization failed:', error)
        })
      }
    }
  }, [autoStart, quick, initialization])

  return initialization
}