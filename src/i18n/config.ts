import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Поддерживаемые локали
export const locales = ['ru', 'uk'] as const
export type Locale = (typeof locales)[number]

// Локаль по умолчанию
export const defaultLocale: Locale = 'ru'

// Проверка валидности локали
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Конфигурация next-intl
export default getRequestConfig(async ({ locale }) => {
  // Проверяем, что локаль поддерживается
  if (!locale || !isValidLocale(locale)) {
    notFound()
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  }
})
