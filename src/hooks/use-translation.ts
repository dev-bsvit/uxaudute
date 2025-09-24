import { useLanguage } from '@/components/language-provider'
import { translationService } from '@/lib/i18n/translation-service'

/**
 * Hook для получения функции перевода и информации о языке
 */
export function useTranslation() {
  const { t: originalT, currentLanguage, isLoading } = useLanguage()
  
  /**
   * Безопасная функция перевода, которая не показывает ключи во время загрузки
   */
  const t = (key: string, params?: Record<string, string>): string => {
    // Если переводы загружаются, возвращаем пустую строку
    if (isLoading) {
      return ''
    }
    
    const translation = originalT(key, params)
    
    // В продакшене не показываем ключи переводов
    if (process.env.NODE_ENV === 'production' && translation.startsWith('[') && translation.endsWith(']')) {
      return ''
    }
    
    return translation
  }

  /**
   * Функция перевода с fallback значением
   */
  const tWithFallback = (key: string, fallback: string, params?: Record<string, string>): string => {
    if (isLoading) {
      return fallback
    }
    
    const translation = originalT(key, params)
    
    // Если перевод не найден, используем fallback
    if (!translation || translation === `[${key}]` || translation === '') {
      return fallback
    }
    
    return translation
  }
  
  return {
    t,
    tWithFallback,
    currentLanguage,
    isLoading,
    /**
     * Переводит ключ с параметрами
     */
    translate: (key: string, params?: Record<string, string>) => t(key, params),
    
    /**
     * Проверяет, загружаются ли переводы
     */
    isTranslationLoading: isLoading,

    /**
     * Проверяет готовность переводов
     */
    isReady: () => !isLoading
  }
}