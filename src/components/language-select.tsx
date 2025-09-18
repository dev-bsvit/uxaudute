'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'
import { ChevronDown, Globe } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' }
]

export function LanguageSelect() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  // Закрытие по клику вне области
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const switchLanguage = (newLocale: string) => {
    // Получаем путь без локали
    let pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/'
    
    // Убираем дублирующиеся слеши
    pathWithoutLocale = pathWithoutLocale.replace(/\/+/g, '/')
    
    // Если путь пустой или только слеш, делаем его пустым
    if (pathWithoutLocale === '/' || pathWithoutLocale === '') {
      pathWithoutLocale = ''
    }
    
    // Создаем новый путь с новой локалью
    const newPath = `/${newLocale}${pathWithoutLocale}`
    
    console.log('Switching language:', {
      currentLocale: locale,
      newLocale,
      currentPath: pathname,
      pathWithoutLocale,
      newPath
    })
    
    // Принудительно перезагружаем страницу
    window.location.href = newPath
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors border border-gray-200 hover:border-gray-300"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage.flag}</span>
        <span className="hidden md:inline">{currentLanguage.name}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-in slide-in-from-top-2 duration-200">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                switchLanguage(lang.code)
                setIsOpen(false)
              }}
              className={`flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                locale === lang.code ? 'bg-blue-50 text-blue-700 font-medium' : ''
              }`}
            >
              <span className="text-lg">{lang.flag}</span>
              <span className="flex-1 text-left">{lang.name}</span>
              {locale === lang.code && (
                <span className="text-blue-600 font-bold">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
