'use client'

import { useEffect } from 'react'
import { useAutoLanguageInitialization } from '@/hooks/use-language-initialization'
import { LanguageInitializationStatus } from './language-initialization-status'

interface LanguageAutoInitializerProps {
  showStatus?: boolean
  showDetails?: boolean
  quickInit?: boolean
}

/**
 * Компонент для автоматической инициализации языковой системы
 * Должен быть размещен в корне приложения
 */
export function LanguageAutoInitializer({
  showStatus = false,
  showDetails = false,
  quickInit = true
}: LanguageAutoInitializerProps) {
  const initialization = useAutoLanguageInitialization({
    quick: quickInit,
    autoStart: true
  })

  useEffect(() => {
    // Логируем результат инициализации для отладки
    if (initialization.isInitialized && initialization.initializationResult) {
      console.log('🌐 Language system auto-initialized:', initialization.initializationResult)
    }
    
    if (initialization.error) {
      console.error('❌ Language system auto-initialization failed:', initialization.error)
    }
  }, [initialization.isInitialized, initialization.error, initialization.initializationResult])

  return (
    <>
      {showStatus && (
        <LanguageInitializationStatus 
          showDetails={showDetails}
          autoHide={true}
          autoHideDelay={2000}
        />
      )}
    </>
  )
}