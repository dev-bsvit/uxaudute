'use client'

import { useEffect, useState } from 'react'
import { translationService } from '@/lib/i18n/translation-service'
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from '@/lib/i18n/types'

interface TranslationPreloaderProps {
  children: React.ReactNode
  language: string
}

/**
 * Компонент для предзагрузки переводов перед рендерингом контента
 */
export function TranslationPreloader({ children, language }: TranslationPreloaderProps) {
  const [translationsLoaded, setTranslationsLoaded] = useState(false)

  useEffect(() => {
    const preloadTranslations = async () => {
      try {
        // Загружаем переводы для текущего языка
        await translationService.loadTranslations(language)
        
        // Если язык не fallback, загружаем и fallback переводы
        if (language !== FALLBACK_LANGUAGE) {
          await translationService.loadTranslations(FALLBACK_LANGUAGE)
        }
        
        setTranslationsLoaded(true)
      } catch (error) {
        console.error('Failed to preload translations:', error)
        // Даже при ошибке показываем контент
        setTranslationsLoaded(true)
      }
    }

    preloadTranslations()
  }, [language])

  // Не показываем контент до загрузки переводов
  if (!translationsLoaded) {
    return null
  }

  return <>{children}</>
}