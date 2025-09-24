import { useLanguage as useLanguageContext } from '@/components/language-provider'
import { getLanguageInfo } from '@/lib/i18n'

/**
 * Hook для работы с языковыми настройками
 */
export function useLanguage() {
  const context = useLanguageContext()
  
  return {
    ...context,
    
    /**
     * Получает информацию о текущем языке
     */
    getCurrentLanguageInfo: () => getLanguageInfo(context.currentLanguage),
    
    /**
     * Проверяет, является ли язык RTL
     */
    isRTL: () => {
      const langInfo = getLanguageInfo(context.currentLanguage)
      return langInfo?.isRTL || false
    },
    
    /**
     * Получает флаг текущего языка
     */
    getCurrentFlag: () => {
      const langInfo = getLanguageInfo(context.currentLanguage)
      return langInfo?.flag || '🌐'
    },
    
    /**
     * Получает нативное название текущего языка
     */
    getCurrentNativeName: () => {
      const langInfo = getLanguageInfo(context.currentLanguage)
      return langInfo?.nativeName || context.currentLanguage
    },
    
    /**
     * Переключает язык с обработкой ошибок
     */
    switchLanguage: async (language: string) => {
      try {
        await context.setLanguage(language)
        return { success: true }
      } catch (error) {
        console.error('Failed to switch language:', error)
        return { 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      }
    }
  }
}