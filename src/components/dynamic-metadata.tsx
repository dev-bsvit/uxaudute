'use client'

import { useEffect } from 'react'
import { useTranslation } from '@/hooks/use-translation'

/**
 * Компонент для динамического обновления метаданных страницы
 */
export function DynamicMetadata() {
  const { t, isLoading } = useTranslation()

  useEffect(() => {
    if (!isLoading) {
      // Обновляем title страницы
      document.title = t('common.appTitle')
      
      // Обновляем meta description
      const metaDescription = document.querySelector('meta[name="description"]')
      if (metaDescription) {
        metaDescription.setAttribute('content', t('common.appDescription'))
      } else {
        // Создаем meta description если его нет
        const meta = document.createElement('meta')
        meta.name = 'description'
        meta.content = t('common.appDescription')
        document.head.appendChild(meta)
      }

      // Обновляем Open Graph title
      const ogTitle = document.querySelector('meta[property="og:title"]')
      if (ogTitle) {
        ogTitle.setAttribute('content', t('common.appTitle'))
      } else {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:title')
        meta.content = t('common.appTitle')
        document.head.appendChild(meta)
      }

      // Обновляем Open Graph description
      const ogDescription = document.querySelector('meta[property="og:description"]')
      if (ogDescription) {
        ogDescription.setAttribute('content', t('common.appDescription'))
      } else {
        const meta = document.createElement('meta')
        meta.setAttribute('property', 'og:description')
        meta.content = t('common.appDescription')
        document.head.appendChild(meta)
      }
    }
  }, [t, isLoading])

  // Этот компонент не рендерит ничего видимого
  return null
}