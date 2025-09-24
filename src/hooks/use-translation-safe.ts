import { useTranslation as useTranslationOriginal } from '@/components/language-provider'
import { translationService } from '@/lib/i18n/translation-service'

/**
 * Безопасный хук для переводов, который не показывает ключи во время загрузки
 */
export function useTranslation() {
  const { t: originalT, currentLanguage, isLoading } = useTranslationOriginal()
  
  /**
   * Безопасная функция перевода
   */
  const t = (key: string, params?: Record<string, string>): string => {
    // Если система загружается, возвращаем пустую строку
    if (isLoading) {
      return ''
    }
    
    // Проверяем, есть ли перевод
    const hasTranslation = translationService.hasTranslation(key, currentLanguage)
    
    if (!hasTranslation) {
      // В режиме разработки показываем ключ для отладки
      if (process.env.NODE_ENV === 'development') {
        return `[${key}]`
      }
      // В продакшене возвращаем пустую строку
      return ''
    }
    
    return originalT(key, params)
  }

  /**
   * Функция перевода с fallback значением
   */
  const tWithFallback = (key: string, fallback: string, params?: Record<string, string>): string => {
    if (isLoading) {
      return fallback
    }
    
    const translation = originalT(key, params)
    
    // Если перевод не найден (возвращается ключ), используем fallback
    if (translation === `[${key}]` || translation === '') {
      return fallback
    }
    
    return translation
  }

  /**
   * Проверяет готовность переводов
   */
  const isReady = (): boolean => {
    return !isLoading
  }

  return { 
    t, 
    tWithFallback,
    currentLanguage, 
    isLoading,
    isReady
  }
}