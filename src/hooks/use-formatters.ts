import { useLanguage } from '@/hooks/use-language'
import { createFormatters } from '@/lib/i18n/formatters'

/**
 * Хук для использования локализованных форматтеров
 */
export function useFormatters() {
  const { currentLanguage } = useLanguage()
  
  return createFormatters(currentLanguage)
}