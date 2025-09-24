import { useState, useCallback } from 'react'
import { errorHandler, I18nError, ErrorType } from '@/lib/i18n/error-handler'
import { useLanguage } from '@/hooks/use-language'

/**
 * Хук для работы с ошибками в многоязычной системе
 */
export function useI18nError() {
  const { currentLanguage } = useLanguage()
  const [lastError, setLastError] = useState<I18nError | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Создает и обрабатывает ошибку
   */
  const createError = useCallback((
    type: ErrorType,
    params?: Record<string, string | number>,
    originalError?: Error
  ) => {
    const error = errorHandler.createError(type, params, originalError)
    setLastError(error)
    return error
  }, [])

  /**
   * Получает локализованное сообщение об ошибке
   */
  const getLocalizedErrorMessage = useCallback(async (error: I18nError) => {
    setIsLoading(true)
    try {
      const message = await errorHandler.getLocalizedErrorMessage(error, currentLanguage)
      return message
    } catch (err) {
      console.warn('Failed to get localized error message:', err)
      return error.message
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage])

  /**
   * Выполняет операцию с обработкой ошибок
   */
  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback: () => T,
    errorType: ErrorType,
    params?: Record<string, string | number>
  ): Promise<T> => {
    setIsLoading(true)
    try {
      const result = await errorHandler.handleErrorWithFallback(
        operation,
        fallback,
        errorType,
        params
      )
      setLastError(null) // Очищаем ошибку при успехе
      return result
    } catch (error) {
      const i18nError = createError(errorType, params, error as Error)
      throw i18nError
    } finally {
      setIsLoading(false)
    }
  }, [createError])

  /**
   * Очищает последнюю ошибку
   */
  const clearError = useCallback(() => {
    setLastError(null)
  }, [])

  /**
   * Получает последние ошибки
   */
  const getRecentErrors = useCallback((limit?: number) => {
    return errorHandler.getRecentErrors(limit)
  }, [])

  /**
   * Проверяет наличие критических ошибок
   */
  const hasCriticalErrors = useCallback(() => {
    return errorHandler.hasCriticalErrors()
  }, [])

  /**
   * Генерирует отчет об ошибках
   */
  const generateErrorReport = useCallback(() => {
    return errorHandler.generateErrorReport()
  }, [])

  return {
    lastError,
    isLoading,
    createError,
    getLocalizedErrorMessage,
    withErrorHandling,
    clearError,
    getRecentErrors,
    hasCriticalErrors,
    generateErrorReport
  }
}