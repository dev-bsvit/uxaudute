/**
 * Сервис для обработки ошибок в многоязычной системе
 */

import { FALLBACK_LANGUAGE } from './types'

export enum ErrorType {
  TRANSLATION_KEY_NOT_FOUND = 'translation.keyNotFound',
  TRANSLATION_FILE_NOT_FOUND = 'translation.fileNotFound',
  TRANSLATION_LOADING_FAILED = 'translation.loadingFailed',
  PROMPT_NOT_FOUND = 'prompt.notFound',
  PROMPT_LOADING_FAILED = 'prompt.loadingFailed',
  PROMPT_INVALID_FORMAT = 'prompt.invalidFormat',
  LANGUAGE_UNSUPPORTED = 'language.unsupported',
  LANGUAGE_SWITCH_FAILED = 'language.switchFailed',
  LANGUAGE_DETECTION_FAILED = 'language.detectionFailed',
  LANGUAGE_SAVE_FAILED = 'language.saveFailed',
  NETWORK_CONNECTION_FAILED = 'network.connectionFailed',
  NETWORK_TIMEOUT = 'network.timeout',
  NETWORK_SERVER_ERROR = 'network.serverError',
  GENERAL_UNKNOWN_ERROR = 'general.unknownError'
}

export interface I18nError {
  type: ErrorType
  message: string
  params?: Record<string, string | number>
  originalError?: Error
  fallbackUsed?: boolean
}

export class I18nErrorHandler {
  private static instance: I18nErrorHandler
  private errorLog: I18nError[] = []
  private maxLogSize = 100

  static getInstance(): I18nErrorHandler {
    if (!I18nErrorHandler.instance) {
      I18nErrorHandler.instance = new I18nErrorHandler()
    }
    return I18nErrorHandler.instance
  }

  /**
   * Создает новую ошибку i18n
   */
  createError(
    type: ErrorType,
    params?: Record<string, string | number>,
    originalError?: Error
  ): I18nError {
    const error: I18nError = {
      type,
      message: this.getErrorMessage(type, params),
      params,
      originalError,
      fallbackUsed: false
    }

    this.logError(error)
    return error
  }

  /**
   * Логирует ошибку
   */
  private logError(error: I18nError): void {
    // Добавляем в лог
    this.errorLog.unshift({
      ...error,
      // Добавляем timestamp
      params: {
        ...error.params,
        timestamp: Date.now()
      }
    })

    // Ограничиваем размер лога
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize)
    }

    // Логируем в консоль для разработки
    if (process.env.NODE_ENV === 'development') {
      console.warn('I18n Error:', error.type, error.params, error.originalError)
    }
  }

  /**
   * Получает сообщение об ошибке (базовое, без переводов)
   */
  private getErrorMessage(type: ErrorType, params?: Record<string, string | number>): string {
    const messages: Record<ErrorType, string> = {
      [ErrorType.TRANSLATION_KEY_NOT_FOUND]: `Translation key not found: ${params?.key || 'unknown'}`,
      [ErrorType.TRANSLATION_FILE_NOT_FOUND]: `Translation file not found: ${params?.file || 'unknown'}`,
      [ErrorType.TRANSLATION_LOADING_FAILED]: `Failed to load translations for language: ${params?.language || 'unknown'}`,
      [ErrorType.PROMPT_NOT_FOUND]: `Prompt not found for language: ${params?.language || 'unknown'}`,
      [ErrorType.PROMPT_LOADING_FAILED]: `Failed to load prompt: ${params?.promptType || 'unknown'}`,
      [ErrorType.PROMPT_INVALID_FORMAT]: `Invalid prompt format for: ${params?.promptType || 'unknown'}`,
      [ErrorType.LANGUAGE_UNSUPPORTED]: `Unsupported language: ${params?.language || 'unknown'}`,
      [ErrorType.LANGUAGE_SWITCH_FAILED]: `Failed to switch language to: ${params?.language || 'unknown'}`,
      [ErrorType.LANGUAGE_DETECTION_FAILED]: 'Failed to detect browser language',
      [ErrorType.LANGUAGE_SAVE_FAILED]: 'Failed to save language preference',
      [ErrorType.NETWORK_CONNECTION_FAILED]: 'Network connection failed',
      [ErrorType.NETWORK_TIMEOUT]: 'Request timeout',
      [ErrorType.NETWORK_SERVER_ERROR]: 'Server error occurred',
      [ErrorType.GENERAL_UNKNOWN_ERROR]: 'An unknown error occurred'
    }

    return messages[type] || 'Unknown error'
  }

  /**
   * Получает локализованное сообщение об ошибке
   */
  async getLocalizedErrorMessage(
    error: I18nError,
    language: string = FALLBACK_LANGUAGE
  ): Promise<string> {
    try {
      // Пытаемся загрузить переводы ошибок
      const response = await fetch(`/locales/${language}/errors.json`)
      if (!response.ok) {
        throw new Error(`Failed to load error translations for ${language}`)
      }

      const errorTranslations = await response.json()
      
      // Получаем путь к переводу (например, "translation.keyNotFound")
      const keyPath = error.type.split('.')
      let translation = errorTranslations
      
      for (const key of keyPath) {
        translation = translation?.[key]
      }

      if (typeof translation === 'string') {
        // Заменяем параметры в переводе
        return this.interpolateParams(translation, error.params)
      }

      // Если перевод не найден, возвращаем базовое сообщение
      return error.message
    } catch (err) {
      // Если не удалось загрузить переводы, возвращаем базовое сообщение
      return error.message
    }
  }

  /**
   * Заменяет параметры в строке перевода
   */
  private interpolateParams(
    template: string,
    params?: Record<string, string | number>
  ): string {
    if (!params) return template

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key]?.toString() || match
    })
  }

  /**
   * Обрабатывает ошибку с fallback механизмом
   */
  async handleErrorWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    errorType: ErrorType,
    params?: Record<string, string | number>
  ): Promise<T> {
    try {
      return await operation()
    } catch (originalError) {
      const error = this.createError(errorType, params, originalError as Error)
      error.fallbackUsed = true
      
      console.warn('Using fallback due to error:', error)
      return fallback()
    }
  }

  /**
   * Получает последние ошибки
   */
  getRecentErrors(limit: number = 10): I18nError[] {
    return this.errorLog.slice(0, limit)
  }

  /**
   * Очищает лог ошибок
   */
  clearErrorLog(): void {
    this.errorLog = []
  }

  /**
   * Проверяет, есть ли критические ошибки
   */
  hasCriticalErrors(): boolean {
    const criticalTypes = [
      ErrorType.TRANSLATION_LOADING_FAILED,
      ErrorType.LANGUAGE_SWITCH_FAILED,
      ErrorType.NETWORK_CONNECTION_FAILED
    ]

    return this.errorLog.some(error => 
      criticalTypes.includes(error.type) && 
      Date.now() - (error.params?.timestamp as number || 0) < 60000 // последние 60 секунд
    )
  }

  /**
   * Создает отчет об ошибках для отправки в службу поддержки
   */
  generateErrorReport(): string {
    const recentErrors = this.getRecentErrors(20)
    
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
      language: typeof window !== 'undefined' ? window.navigator.language : 'unknown',
      errors: recentErrors.map(error => ({
        type: error.type,
        message: error.message,
        params: error.params,
        fallbackUsed: error.fallbackUsed
      }))
    }, null, 2)
  }
}

// Экспортируем singleton instance
export const errorHandler = I18nErrorHandler.getInstance()