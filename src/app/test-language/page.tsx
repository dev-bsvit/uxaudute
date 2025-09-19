'use client'

import { LanguageSelect } from '@/components/language-select'
import { useLocale } from 'next-intl'

export default function TestLanguagePage() {
  const locale = useLocale()

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4">Тест селекта языков</h1>
        <p className="mb-4">Текущая локаль: <strong>{locale}</strong></p>
        <div className="mb-4">
          <LanguageSelect />
        </div>
        <p className="text-sm text-gray-600">
          Откройте консоль браузера (F12) чтобы увидеть отладочную информацию
        </p>
      </div>
    </div>
  )
}
