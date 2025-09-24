'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/components/language-provider'
import { Loader2 } from 'lucide-react'

interface SmoothLanguageInitializerProps {
  children: React.ReactNode
  showLoadingScreen?: boolean
  loadingMessage?: string
  minLoadingTime?: number
}

/**
 * Компонент для плавной инициализации языка с экраном загрузки
 */
export function SmoothLanguageInitializer({
  children,
  showLoadingScreen = true,
  loadingMessage = 'Загрузка языковых настроек...',
  minLoadingTime = 500
}: SmoothLanguageInitializerProps) {
  const { isLoading, currentLanguage } = useLanguage()
  const [showLoading, setShowLoading] = useState(true)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [hasInitialized, setHasInitialized] = useState(false)

  // Проверяем, была ли уже инициализация (для предотвращения повторных экранов загрузки)
  useEffect(() => {
    const wasInitialized = sessionStorage.getItem('language_initialized')
    if (wasInitialized) {
      setHasInitialized(true)
      setShowLoading(false)
      setMinTimeElapsed(true)
    }
  }, [])

  // Устанавливаем минимальное время показа загрузки только при первой инициализации
  useEffect(() => {
    if (!hasInitialized) {
      const timer = setTimeout(() => {
        setMinTimeElapsed(true)
      }, minLoadingTime)

      return () => clearTimeout(timer)
    }
  }, [minLoadingTime, hasInitialized])

  // Скрываем загрузку когда язык загружен и прошло минимальное время
  useEffect(() => {
    if (!isLoading && minTimeElapsed && !hasInitialized) {
      setShowLoading(false)
      setHasInitialized(true)
      // Сохраняем флаг инициализации в sessionStorage
      sessionStorage.setItem('language_initialized', 'true')
    }
  }, [isLoading, minTimeElapsed, hasInitialized])

  // Показываем экран загрузки только при первой инициализации
  if (showLoading && showLoadingScreen && !hasInitialized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600 text-sm">{loadingMessage}</p>
          {currentLanguage && (
            <p className="text-xs text-gray-400">
              Язык: {currentLanguage.toUpperCase()}
            </p>
          )}
        </div>
      </div>
    )
  }

  return <>{children}</>
}