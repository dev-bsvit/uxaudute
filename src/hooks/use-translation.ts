import { useLanguage } from '@/components/language-provider'

/**
 * Hook для получения функции перевода и информации о языке
 */
export function useTranslation() {
  const { t, currentLanguage, isLoading } = useLanguage()
  
  return {
    t,
    currentLanguage,
    isLoading,
    /**
     * Переводит ключ с параметрами
     */
    translate: (key: string, params?: Record<string, string>) => t(key, params),
    
    /**
     * Проверяет, загружаются ли переводы
     */
    isTranslationLoading: isLoading
  }
}