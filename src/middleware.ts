import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  // Список всех поддерживаемых локалей
  locales,
  
  // Локаль по умолчанию
  defaultLocale,
  
  // Не добавлять префикс локали для defaultLocale
  localePrefix: 'as-needed'
})

export const config = {
  // Применять middleware ко всем путям, кроме статических файлов и API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
