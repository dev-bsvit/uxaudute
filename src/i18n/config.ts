import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

// Поддерживаемые локали
export const locales = ['ru', 'ua', 'en'] as const
export type Locale = (typeof locales)[number]

// Локаль по умолчанию
export const defaultLocale: Locale = 'ru'

// Проверка валидности локали
export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

// Конфигурация next-intl
export default getRequestConfig(async ({ locale }) => {
  // Если локаль не определена, используем локаль по умолчанию
  const validLocale = locale && isValidLocale(locale) ? locale : defaultLocale

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  }
})
