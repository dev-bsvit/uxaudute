/**
 * Сервис для автоматического определения языка пользователя
 */

import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, isSupportedLanguage } from './types'
import { errorHandler, ErrorType } from './error-handler'

export interface LanguageDetectionResult {
  language: string
  source: 'user-preference' | 'browser' | 'default'
  confidence: number
}

export class LanguageDetector {
  private static instance: LanguageDetector

  static getInstance(): LanguageDetector {
    if (!LanguageDetector.instance) {
      LanguageDetector.instance = new LanguageDetector()
    }
    return LanguageDetector.instance
  }

  /**
   * Определяет предпочтительный язык пользователя
   */
  async detectLanguage(): Promise<LanguageDetectionResult> {
    try {
      console.log('🔍 Starting language detection...')

      // 1. Проверяем сохраненные предпочтения пользователя (база данных)
      const userPreference = await this.getUserPreference()
      if (userPreference) {
        console.log('✅ Found user preference in database:', userPreference)
        return {
          language: userPreference,
          source: 'user-preference',
          confidence: 1.0
        }
      }

      // 2. Проверяем localStorage
      const localStorageLanguage = this.getLocalStorageLanguage()
      if (localStorageLanguage) {
        console.log('✅ Found language in localStorage:', localStorageLanguage)
        return {
          language: localStorageLanguage,
          source: 'user-preference',
          confidence: 0.9
        }
      }

      // 3. Определяем по настройкам браузера
      const browserLanguage = this.getBrowserLanguage()
      if (browserLanguage) {
        console.log('✅ Detected browser language:', browserLanguage)
        return {
          language: browserLanguage,
          source: 'browser',
          confidence: 0.7
        }
      }

      // 4. Используем язык по умолчанию
      console.log('⚠️ Using default language:', DEFAULT_LANGUAGE)
      return {
        language: DEFAULT_LANGUAGE,
        source: 'default',
        confidence: 0.5
      }
    } catch (error) {
      console.error('❌ Language detection failed:', error)
      errorHandler.createError(
        ErrorType.LANGUAGE_DETECTION_FAILED,
        {},
        error as Error
      )

      return {
        language: DEFAULT_LANGUAGE,
        source: 'default',
        confidence: 0.0
      }
    }
  }

  /**
   * Получает языковые предпочтения из базы данных
   */
  private async getUserPreference(): Promise<string | null> {
    try {
      // Проверяем, есть ли авторизованный пользователь
      if (typeof window === 'undefined') return null

      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .single()

      const language = profile?.preferred_language
      
      if (language && isSupportedLanguage(language)) {
        return language
      }

      return null
    } catch (error) {
      console.warn('Failed to get user language preference:', error)
      return null
    }
  }

  /**
   * Получает язык из localStorage
   */
  private getLocalStorageLanguage(): string | null {
    try {
      if (typeof window === 'undefined') return null

      const language = localStorage.getItem('preferred_language')
      
      if (language && isSupportedLanguage(language)) {
        return language
      }

      return null
    } catch (error) {
      console.warn('Failed to get language from localStorage:', error)
      return null
    }
  }

  /**
   * Определяет язык по настройкам браузера
   */
  private getBrowserLanguage(): string | null {
    try {
      if (typeof window === 'undefined') return null

      // Получаем список языков браузера в порядке предпочтения
      const browserLanguages = this.getBrowserLanguages()
      console.log('🌐 Browser languages detected:', browserLanguages)
      
      // Ищем первый поддерживаемый язык
      for (const browserLang of browserLanguages) {
        const normalizedLang = this.normalizeLanguageCode(browserLang)
        console.log(`🔍 Checking browser language: ${browserLang} -> ${normalizedLang}`)
        
        if (isSupportedLanguage(normalizedLang)) {
          console.log(`✅ Found supported browser language: ${normalizedLang}`)
          return normalizedLang
        }
      }

      console.log('⚠️ No supported browser languages found')
      return null
    } catch (error) {
      console.warn('Failed to detect browser language:', error)
      return null
    }
  }

  /**
   * Получает список языков браузера
   */
  private getBrowserLanguages(): string[] {
    if (typeof window === 'undefined') return []

    const languages: string[] = []

    // navigator.languages (современные браузеры)
    if (navigator.languages && navigator.languages.length > 0) {
      languages.push(...navigator.languages)
    }

    // navigator.language (основной язык)
    if (navigator.language) {
      languages.push(navigator.language)
    }

    // Устаревшие свойства для совместимости
    const legacyLanguage = (navigator as any).userLanguage || 
                          (navigator as any).browserLanguage ||
                          (navigator as any).systemLanguage

    if (legacyLanguage) {
      languages.push(legacyLanguage)
    }

    // Удаляем дубликаты
    return [...new Set(languages)]
  }

  /**
   * Нормализует код языка (например, "en-US" -> "en")
   */
  private normalizeLanguageCode(languageCode: string): string {
    return languageCode.split('-')[0].toLowerCase()
  }

  /**
   * Получает информацию о поддерживаемых языках
   */
  getSupportedLanguages() {
    return SUPPORTED_LANGUAGES.map(lang => ({
      code: lang.code,
      name: lang.name,
      nativeName: lang.nativeName,
      flag: lang.flag
    }))
  }

  /**
   * Проверяет, поддерживается ли язык
   */
  isLanguageSupported(language: string): boolean {
    return isSupportedLanguage(language)
  }

  /**
   * Получает язык по умолчанию
   */
  getDefaultLanguage(): string {
    return DEFAULT_LANGUAGE
  }

  /**
   * Получает наиболее подходящий язык из списка
   */
  getBestMatchLanguage(requestedLanguages: string[]): string {
    for (const lang of requestedLanguages) {
      const normalized = this.normalizeLanguageCode(lang)
      if (isSupportedLanguage(normalized)) {
        return normalized
      }
    }
    return DEFAULT_LANGUAGE
  }

  /**
   * Создает отчет о определении языка для отладки
   */
  async generateDetectionReport(): Promise<string> {
    const result = await this.detectLanguage()
    const browserLanguages = this.getBrowserLanguages()
    const supportedLanguages = this.getSupportedLanguages()

    return JSON.stringify({
      detectedLanguage: result,
      browserLanguages,
      supportedLanguages,
      defaultLanguage: DEFAULT_LANGUAGE,
      timestamp: new Date().toISOString()
    }, null, 2)
  }
}

// Экспортируем singleton instance
export const languageDetector = LanguageDetector.getInstance()