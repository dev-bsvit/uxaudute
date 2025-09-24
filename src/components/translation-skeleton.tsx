'use client'

import { useTranslation } from '@/hooks/use-translation-safe'

interface TranslationSkeletonProps {
  translationKey: string
  fallback?: string
  params?: Record<string, string>
  className?: string
  skeletonWidth?: string
  children?: React.ReactNode
}

/**
 * Компонент для безопасного отображения переводов со скелетоном
 */
export function TranslationSkeleton({
  translationKey,
  fallback = '',
  params,
  className = '',
  skeletonWidth = 'w-20',
  children
}: TranslationSkeletonProps) {
  const { t, isReady } = useTranslation()

  // Если переводы не готовы, показываем скелетон
  if (!isReady()) {
    return (
      <div className={`animate-pulse bg-gray-200 h-4 rounded ${skeletonWidth} ${className}`} />
    )
  }

  const translation = fallback ? t(translationKey) || fallback : t(translationKey)

  // Если есть children, используем их как render prop
  if (children && typeof children === 'function') {
    return (children as (translation: string) => React.ReactNode)(translation)
  }

  return <span className={className}>{translation}</span>
}

/**
 * Хук для безопасного использования переводов с автоматическим fallback
 */
export function useSafeTranslation() {
  const { t, isReady, currentLanguage } = useTranslation()

  const safeT = (key: string, fallback?: string, params?: Record<string, string>): string => {
    if (!isReady()) {
      return fallback || ''
    }
    
    const translation = t(key, params)
    
    // Если перевод не найден и есть fallback, используем его
    if ((!translation || translation === `[${key}]`) && fallback) {
      return fallback
    }
    
    return translation
  }

  return {
    t: safeT,
    isReady,
    currentLanguage
  }
}