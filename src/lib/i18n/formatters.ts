/**
 * Утилиты для форматирования дат, чисел и других данных в зависимости от языка
 */

export interface FormatOptions {
  language: string
}

/**
 * Форматирует дату в зависимости от языка
 */
export function formatDate(date: string | Date, options: FormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const locale = options.language === 'en' ? 'en-US' : 'ru-RU'
  
  return dateObj.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

/**
 * Форматирует дату и время в зависимости от языка
 */
export function formatDateTime(date: string | Date, options: FormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const locale = options.language === 'en' ? 'en-US' : 'ru-RU'
  
  return dateObj.toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Форматирует число в зависимости от языка
 */
export function formatNumber(number: number, options: FormatOptions): string {
  const locale = options.language === 'en' ? 'en-US' : 'ru-RU'
  
  return number.toLocaleString(locale)
}

/**
 * Форматирует процент в зависимости от языка
 */
export function formatPercent(number: number, options: FormatOptions): string {
  const locale = options.language === 'en' ? 'en-US' : 'ru-RU'
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(number / 100)
}

/**
 * Форматирует относительное время (например, "2 дня назад")
 */
export function formatRelativeTime(date: string | Date, options: FormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  const locale = options.language === 'en' ? 'en-US' : 'ru-RU'
  
  // Используем Intl.RelativeTimeFormat для локализованного форматирования
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  
  const intervals = [
    { unit: 'year' as const, seconds: 31536000 },
    { unit: 'month' as const, seconds: 2592000 },
    { unit: 'day' as const, seconds: 86400 },
    { unit: 'hour' as const, seconds: 3600 },
    { unit: 'minute' as const, seconds: 60 },
    { unit: 'second' as const, seconds: 1 }
  ]
  
  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds)
    if (count !== 0) {
      return rtf.format(-count, interval.unit)
    }
  }
  
  return rtf.format(0, 'second')
}

/**
 * Получает индикатор языка для отображения в UI
 */
export function getLanguageIndicator(language: string): { flag: string; name: string } {
  switch (language) {
    case 'en':
      return { flag: '🇺🇸', name: 'EN' }
    case 'ru':
      return { flag: '🇷🇺', name: 'RU' }
    default:
      return { flag: '🌐', name: language.toUpperCase() }
  }
}

/**
 * Форматирует множественные формы для русского языка
 */
export function formatPlural(count: number, forms: [string, string, string], language: string): string {
  if (language !== 'ru') {
    // Для английского языка используем простую логику
    return count === 1 ? forms[0] : forms[1]
  }
  
  // Для русского языка используем сложную логику множественных форм
  const cases = [2, 0, 1, 1, 1, 2]
  const index = (count % 100 > 4 && count % 100 < 20) 
    ? 2 
    : cases[Math.min(count % 10, 5)]
  
  return forms[index]
}

/**
 * Хук для использования форматтеров с текущим языком
 */
export function createFormatters(language: string) {
  const options: FormatOptions = { language }
  
  return {
    formatDate: (date: string | Date) => formatDate(date, options),
    formatDateTime: (date: string | Date) => formatDateTime(date, options),
    formatNumber: (number: number) => formatNumber(number, options),
    formatPercent: (number: number) => formatPercent(number, options),
    formatRelativeTime: (date: string | Date) => formatRelativeTime(date, options),
    getLanguageIndicator: () => getLanguageIndicator(language),
    formatPlural: (count: number, forms: [string, string, string]) => formatPlural(count, forms, language)
  }
}