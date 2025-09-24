'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Globe, Check } from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'
import { useTranslation } from '@/hooks/use-translation'
import { Language } from '@/lib/i18n'

interface LanguageSelectorProps {
  variant?: 'header' | 'settings'
  showFlags?: boolean
  showNativeNames?: boolean
  className?: string
}

export function LanguageSelector({ 
  variant = 'header', 
  showFlags = true, 
  showNativeNames = true,
  className = '' 
}: LanguageSelectorProps) {
  const { 
    currentLanguage, 
    availableLanguages, 
    switchLanguage, 
    getCurrentFlag, 
    getCurrentNativeName,
    isLoading 
  } = useLanguage()
  
  const { t } = useTranslation()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isChanging, setIsChanging] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Закрываем dropdown при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLanguageChange = async (languageCode: string) => {
    if (languageCode === currentLanguage || isChanging) return

    setIsChanging(true)
    setIsOpen(false)

    try {
      console.log('🔄 Switching language to:', languageCode)
      const result = await switchLanguage(languageCode)
      if (!result.success) {
        console.error('Failed to switch language:', result.error)
        // Можно показать уведомление об ошибке
      } else {
        console.log('✅ Language switched successfully to:', languageCode)
      }
    } catch (error) {
      console.error('Error switching language:', error)
    } finally {
      setIsChanging(false)
    }
  }

  const getButtonContent = () => {
    if (isChanging) {
      return (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-sm">{t('common.loading')}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        {showFlags && (
          <span className="text-lg" role="img" aria-label={`${currentLanguage} flag`}>
            {getCurrentFlag()}
          </span>
        )}
        {variant === 'settings' && (
          <Globe className="w-4 h-4 text-gray-500" />
        )}
        <span className="text-sm font-medium">
          {showNativeNames ? getCurrentNativeName() : currentLanguage.toUpperCase()}
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
    )
  }

  const getButtonStyles = () => {
    const baseStyles = "flex items-center gap-2 px-3 py-2 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    
    if (variant === 'header') {
      return `${baseStyles} text-gray-700 hover:text-gray-900 hover:bg-gray-100`
    }
    
    return `${baseStyles} border border-gray-300 bg-white text-gray-700 hover:bg-gray-50`
  }

  const getDropdownStyles = () => {
    const baseStyles = "absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[160px]"
    
    if (variant === 'header') {
      return `${baseStyles} right-0`
    }
    
    return `${baseStyles} left-0`
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-500">{t('common.loading')}</span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isChanging}
        className={getButtonStyles()}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('navigation.language')}
      >
        {getButtonContent()}
      </button>

      {isOpen && (
        <div className={getDropdownStyles()} role="listbox">
          {availableLanguages.map((language: Language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`
                w-full flex items-center gap-3 px-4 py-2 text-sm text-left transition-colors
                hover:bg-gray-100 focus:bg-gray-100 focus:outline-none
                ${currentLanguage === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'}
              `}
              role="option"
              aria-selected={currentLanguage === language.code}
            >
              {showFlags && (
                <span className="text-lg" role="img" aria-label={`${language.name} flag`}>
                  {language.flag}
                </span>
              )}
              
              <div className="flex-1">
                <div className="font-medium">
                  {showNativeNames ? language.nativeName : language.name}
                </div>
                {variant === 'settings' && showNativeNames && (
                  <div className="text-xs text-gray-500">
                    {language.name}
                  </div>
                )}
              </div>

              {currentLanguage === language.code && (
                <Check className="w-4 h-4 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// Компонент для использования в настройках с дополнительной информацией
export function LanguageSelectorDetailed({ className = '' }: { className?: string }) {
  return (
    <LanguageSelector
      variant="settings"
      showFlags={true}
      showNativeNames={true}
      className={className}
    />
  )
}

// Компонент для использования в header с минимальным дизайном
export function LanguageSelectorCompact({ className = '' }: { className?: string }) {
  return (
    <LanguageSelector
      variant="header"
      showFlags={true}
      showNativeNames={false}
      className={className}
    />
  )
}