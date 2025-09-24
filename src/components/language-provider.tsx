'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { 
  LanguageContextType, 
  Language, 
  SUPPORTED_LANGUAGES, 
  DEFAULT_LANGUAGE,
  translationService,
  isSupportedLanguage
} from '@/lib/i18n'
import { languageInitializer } from '@/lib/i18n/language-initializer'
import { TranslationPreloader } from './translation-preloader'

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [currentLanguage, setCurrentLanguage] = useState<string>(DEFAULT_LANGUAGE)
  const [isLoading, setIsLoading] = useState(true)
  const [availableLanguages] = useState<Language[]>(SUPPORTED_LANGUAGES)

  // Инициализация языка при загрузке
  useEffect(() => {
    initializeLanguage()
  }, [])

  /**
   * Инициализирует язык при первой загрузке
   */
  const initializeLanguage = async () => {
    try {
      setIsLoading(true)
      console.log('🚀 Starting language provider initialization...')
      
      // Сначала проверяем сохраненный язык в localStorage
      const savedLanguage = getSavedLanguage()
      if (savedLanguage && isSupportedLanguage(savedLanguage)) {
        console.log('📱 Found saved language in localStorage:', savedLanguage)
        setCurrentLanguage(savedLanguage)
        
        // Быстро загружаем переводы для сохраненного языка
        try {
          await translationService.loadTranslations(savedLanguage)
          console.log('✅ Translations loaded for saved language:', savedLanguage)
        } catch (error) {
          console.warn('⚠️ Failed to load translations for saved language:', error)
        }
        
        setIsLoading(false)
        
        // Запускаем полную инициализацию в фоне
        languageInitializer.initialize().then(fullResult => {
          console.log('🎯 Background initialization completed:', fullResult)
          // Если определенный язык отличается от сохраненного, обновляем
          if (fullResult.language !== savedLanguage) {
            console.log('🔄 Updating language from background detection:', fullResult.language)
            setCurrentLanguage(fullResult.language)
            saveLanguageToStorage(fullResult.language)
          }
        }).catch(error => {
          console.warn('⚠️ Background initialization failed:', error)
        })
        
        return
      }
      
      // Если нет сохраненного языка, используем инициализатор
      const result = await languageInitializer.quickInitialize()
      
      console.log('📋 Language initialization result:', result)
      setCurrentLanguage(result.language)
      
      // Сохраняем выбранный язык в localStorage
      saveLanguageToStorage(result.language)
      
      console.log('✅ Language provider initialized with language:', result.language)
      
      // Запускаем полную инициализацию в фоне для предзагрузки всех ресурсов
      languageInitializer.initialize().then(fullResult => {
        console.log('🎯 Full language initialization completed:', fullResult)
      }).catch(error => {
        console.warn('⚠️ Background initialization failed:', error)
      })
      
    } catch (error) {
      console.error('❌ Failed to initialize language provider:', error)
      // В случае ошибки используем язык по умолчанию
      setCurrentLanguage(DEFAULT_LANGUAGE)
      saveLanguageToStorage(DEFAULT_LANGUAGE)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Изменяет текущий язык
   */
  const setLanguage = async (language: string): Promise<void> => {
    if (!isSupportedLanguage(language)) {
      console.error(`Unsupported language: ${language}`)
      return
    }

    if (language === currentLanguage) {
      return
    }

    try {
      setIsLoading(true)
      
      // Загружаем переводы для нового языка
      await translationService.loadTranslations(language)
      
      // Обновляем состояние
      setCurrentLanguage(language)
      
      // Сохраняем в localStorage
      saveLanguageToStorage(language)
      
      // Сохраняем в базу данных для авторизованных пользователей
      await saveLanguageToDatabase(language)
      
      console.log(`Language changed to: ${language}`)
      
    } catch (error) {
      console.error('Failed to change language:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Функция перевода
   */
  const t = (key: string, params?: Record<string, string>): string => {
    // Если переводы еще загружаются, возвращаем пустую строку вместо ключа
    if (isLoading) {
      return ''
    }
    return translationService.getTranslation(key, currentLanguage, params)
  }



  /**
   * Получает сохраненный язык из localStorage
   */
  const getSavedLanguage = (): string | null => {
    if (typeof window === 'undefined') return null
    
    try {
      return localStorage.getItem('preferred_language')
    } catch (error) {
      console.error('Failed to get language from localStorage:', error)
      return null
    }
  }

  /**
   * Сохраняет язык в localStorage
   */
  const saveLanguageToStorage = (language: string): void => {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem('preferred_language', language)
      console.log('💾 Language saved to localStorage:', language)
    } catch (error) {
      console.error('Failed to save language to localStorage:', error)
    }
  }

  /**
   * Сохраняет язык в базу данных для авторизованных пользователей
   */
  const saveLanguageToDatabase = async (language: string): Promise<void> => {
    try {
      const { userSettingsService } = await import('@/lib/i18n/user-settings')
      
      // Проверяем, авторизован ли пользователь
      const { supabase } = await import('@/lib/supabase')
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Пользователь не авторизован, сохраняем только в localStorage
        return
      }

      // Используем сервис для сохранения языковых предпочтений
      await userSettingsService.saveLanguagePreference(user.id, language)
      
    } catch (error) {
      console.error('Error saving language to database:', error)
    }
  }

  const contextValue: LanguageContextType = {
    currentLanguage,
    availableLanguages,
    setLanguage,
    t,
    isLoading
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      <TranslationPreloader language={currentLanguage}>
        {children}
      </TranslationPreloader>
    </LanguageContext.Provider>
  )
}

/**
 * Hook для использования языкового контекста
 */
export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

/**
 * Hook для получения только функции перевода
 */
export function useTranslation() {
  const { t, currentLanguage, isLoading } = useLanguage()
  return { t, currentLanguage, isLoading }
}