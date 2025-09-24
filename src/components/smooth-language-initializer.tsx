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

  // Устанавливаем минимальное время показа загрузки
  useEffect(() => {
    const timer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, minLoadingTime)

    return () => clearTimeout(timer)
  }, [minLoadingTime])

  // Скрываем загрузку когда язык загружен и прошло минимальное время
  useEffect(() => {
    if (!isLoading && minTimeElapsed) {
      setShowLoading(false)
    }
  }, [isLoading, minTimeElapsed])

  // Показываем экран загрузки
  if (showLoading && showLoadingScreen) {
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