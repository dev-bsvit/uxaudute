'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' }
]

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  console.log('LanguageSwitcher - Current locale:', locale)
  console.log('LanguageSwitcher - Current pathname:', pathname)

  const switchLanguage = (newLocale: string) => {
    console.log('Switching language from', locale, 'to', newLocale)
    console.log('Current pathname:', pathname)
    
    // Заменяем текущую локаль в пути
    const newPath = pathname.replace(`/${locale}`, `/${newLocale}`)
    console.log('New path:', newPath)
    
    // Принудительно перезагружаем страницу
    window.location.href = newPath
  }

  return (
    <div className="flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => {
            console.log('Button clicked:', lang.code)
            switchLanguage(lang.code)
          }}
          className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
            locale === lang.code 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
          style={{ border: '1px solid #ccc' }}
        >
          <span className="flex items-center gap-2">
            <span>{lang.flag}</span>
            <span className="hidden sm:inline">{lang.name}</span>
          </span>
        </button>
      ))}
    </div>
  )
}
