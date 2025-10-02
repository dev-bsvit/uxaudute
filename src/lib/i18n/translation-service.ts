import { TranslationMap, FALLBACK_LANGUAGE } from './types'
import { errorHandler, ErrorType } from './error-handler'

class TranslationService {
  private translations: Record<string, TranslationMap> = {}
  private loadingPromises: Record<string, Promise<TranslationMap> | undefined> = {}

  /**
   * Загружает переводы для указанного языка
   */
  async loadTranslations(language: string): Promise<TranslationMap> {
    // Если переводы уже загружены, возвращаем их
    if (this.translations[language]) {
      return this.translations[language]
    }

    // Если уже идет загрузка, ждем ее завершения
    const existingPromise = this.loadingPromises[language]
    if (existingPromise) {
      return await existingPromise
    }

    // Начинаем загрузку
    this.loadingPromises[language] = this.fetchTranslations(language)
    
    try {
      const translations = await this.loadingPromises[language]
      this.translations[language] = translations
      return translations
    } catch (error) {
      delete this.loadingPromises[language]
      throw error
    }
  }

  /**
   * Загружает все файлы переводов для языка
   */
  private async fetchTranslations(language: string): Promise<TranslationMap> {
    return await errorHandler.handleErrorWithFallback(
      async () => {
        const translationFiles = [
          'common',
          'navigation',
          'analysis',
          'settings',
          'errors',
          'analysis-results',
          'dashboard',
          'projects',
          'components',
          'hypotheses',
          'business'
        ]
        const translations: TranslationMap = {}

        for (const file of translationFiles) {
          try {
            const response = await fetch(`/locales/${language}/${file}.json`)
            if (response.ok) {
              const fileTranslations = await response.json()
              translations[file] = fileTranslations
            } else {
              errorHandler.createError(
                ErrorType.TRANSLATION_FILE_NOT_FOUND,
                { file: `/locales/${language}/${file}.json` }
              )
            }
          } catch (error) {
            errorHandler.createError(
              ErrorType.TRANSLATION_FILE_NOT_FOUND,
              { file: `/locales/${language}/${file}.json` },
              error as Error
            )
          }
        }

        return translations
      },
      () => {
        // Fallback: возвращаем пустой объект
        console.warn(`Using empty translations as fallback for language: ${language}`)
        return {}
      },
      ErrorType.TRANSLATION_LOADING_FAILED,
      { language }
    )
  }

  /**
   * Получает перевод по ключу
   */
  getTranslation(
    key: string, 
    language: string, 
    params?: Record<string, string>
  ): string {
    const translation = this.getNestedTranslation(key, language)
    
    if (translation) {
      return this.interpolateParams(translation, params)
    }

    // Fallback на основной язык
    if (language !== FALLBACK_LANGUAGE) {
      const fallbackTranslation = this.getNestedTranslation(key, FALLBACK_LANGUAGE)
      if (fallbackTranslation) {
        console.warn(`Using fallback translation for key: ${key}`)
        return this.interpolateParams(fallbackTranslation, params)
      }
    }

    // Логируем отсутствующий ключ
    errorHandler.createError(
      ErrorType.TRANSLATION_KEY_NOT_FOUND,
      { key, language }
    )

    // В продакшене возвращаем пустую строку, в разработке - ключ для отладки
    if (process.env.NODE_ENV === 'development') {
      return `[${key}]`
    }
    return ''
  }

  /**
   * Получает вложенный перевод по точечной нотации
   */
  private getNestedTranslation(key: string, language: string): string | null {
    const translations = this.translations[language]
    if (!translations) return null

    const keys = key.split('.')
    let current: any = translations

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k]
      } else {
        return null
      }
    }

    return typeof current === 'string' ? current : null
  }

  /**
   * Интерполирует параметры в строку перевода
   */
  private interpolateParams(
    translation: string, 
    params?: Record<string, string>
  ): string {
    if (!params) return translation

    return translation.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return params[key] || match
    })
  }

  /**
   * Проверяет наличие перевода
   */
  hasTranslation(key: string, language: string): boolean {
    return this.getNestedTranslation(key, language) !== null
  }

  /**
   * Получает fallback перевод
   */
  getFallbackTranslation(key: string, params?: Record<string, string>): string {
    return this.getTranslation(key, FALLBACK_LANGUAGE, params)
  }

  /**
   * Очищает кэш переводов
   */
  clearCache(): void {
    this.translations = {}
    this.loadingPromises = {}
  }

  /**
   * Предзагружает переводы для языка
   */
  async preloadTranslations(language: string): Promise<void> {
    try {
      await this.loadTranslations(language)
    } catch (error) {
      console.error(`Failed to preload translations for ${language}:`, error)
    }
  }
}

export const translationService = new TranslationService()