'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Globe, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface LanguageSwitcherProps {
  postId: string
  currentLanguage: string
  onLanguageChange: (lang: string, translationData: any) => void
}

const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
]

export function LanguageSwitcher({ postId, currentLanguage, onLanguageChange }: LanguageSwitcherProps) {
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([currentLanguage])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAvailableTranslations()
  }, [postId])

  const loadAvailableTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_post_translations')
        .select('language')
        .eq('post_id', postId)

      if (!error && data) {
        const langs = data.map(t => t.language)
        setAvailableLanguages([currentLanguage, ...langs])
      }
    } catch (error) {
      console.error('Error loading translations:', error)
    }
  }

  const handleLanguageChange = async (langCode: string) => {
    if (langCode === currentLanguage) return

    setLoading(true)
    try {
      // Если это оригинальный язык статьи, просто перезагружаем
      if (langCode === currentLanguage) {
        window.location.reload()
        return
      }

      // Загружаем перевод
      const { data, error } = await supabase
        .from('blog_post_translations')
        .select('*')
        .eq('post_id', postId)
        .eq('language', langCode)
        .single()

      if (error || !data) {
        alert('Перевод не найден')
        return
      }

      onLanguageChange(langCode, data)
    } catch (error) {
      console.error('Error switching language:', error)
      alert('Ошибка при переключении языка')
    } finally {
      setLoading(false)
    }
  }

  const currentLang = languages.find(l => l.code === currentLanguage)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Globe className="w-4 h-4 mr-2" />
          {currentLang?.flag} {currentLang?.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => {
          const isAvailable = availableLanguages.includes(lang.code)
          const isCurrent = lang.code === currentLanguage

          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => isAvailable && handleLanguageChange(lang.code)}
              disabled={!isAvailable}
              className="flex items-center justify-between"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
              {isCurrent && <Check className="w-4 h-4 text-blue-600" />}
              {!isAvailable && <span className="text-xs text-slate-400 ml-2">(недоступно)</span>}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
