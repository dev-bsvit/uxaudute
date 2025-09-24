export * from './types'
export * from './translation-service'
export * from './prompt-service'

import { translationService } from './translation-service'
import { promptService } from './prompt-service'
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, isSupportedLanguage } from './types'

/**
 * Инициализирует систему i18n
 */
export async function initializeI18n(language: string = DEFAULT_LANGUAGE): Promise<void> {
  try {
    // Предзагружаем переводы для выбранного языка
    await translationService.preloadTranslations(language)
    
    // Предзагружаем fallback переводы если нужно
    if (language !== FALLBACK_LANGUAGE) {
      await translationService.preloadTranslations(FALLBACK_LANGUAGE)
    }

    // Предзагружаем промпты
    await promptService.preloadPrompts(language)
    if (language !== FALLBACK_LANGUAGE) {
      await promptService.preloadPrompts(FALLBACK_LANGUAGE)
    }

    console.log(`i18n initialized for language: ${language}`)
  } catch (error) {
    console.error('Failed to initialize i18n:', error)
    throw error
  }
}

/**
 * Получает язык браузера
 */
export function getBrowserLanguage(): string {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  const browserLang = navigator.language.split('-')[0]
  const supportedCodes = SUPPORTED_LANGUAGES.map(lang => lang.code)
  
  return supportedCodes.includes(browserLang) ? browserLang : DEFAULT_LANGUAGE
}

// Экспортируем функцию из types
export { isSupportedLanguage }

/**
 * Получает информацию о языке по коду
 */
export function getLanguageInfo(code: string) {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code)
}

/**
 * Очищает весь кэш i18n
 */
export function clearI18nCache(): void {
  translationService.clearCache()
  promptService.clearCache()
}

// Экспортируем сервисы
export { translationService, promptService }