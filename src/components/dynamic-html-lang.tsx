'use client'

import { useEffect } from 'react'
import { useLanguage } from '@/hooks/use-language'

/**
 * Компонент для динамического обновления атрибута lang в HTML элементе
 */
export function DynamicHtmlLang() {
  const { currentLanguage, isLoading } = useLanguage()

  useEffect(() => {
    if (!isLoading && currentLanguage) {
      // Обновляем атрибут lang в HTML элементе
      document.documentElement.lang = currentLanguage
      
      // Также обновляем dir атрибут для RTL языков (если понадобится в будущем)
      const { getLanguageInfo } = require('@/lib/i18n')
      const languageInfo = getLanguageInfo(currentLanguage)
      
      if (languageInfo?.isRTL) {
        document.documentElement.dir = 'rtl'
      } else {
        document.documentElement.dir = 'ltr'
      }
    }
  }, [currentLanguage, isLoading])

  // Этот компонент не рендерит ничего видимого
  return null
}