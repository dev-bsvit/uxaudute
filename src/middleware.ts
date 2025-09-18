import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'

export default createMiddleware({
  // Список всех поддерживаемых локалей
  locales,
  
  // Локаль по умолчанию
  defaultLocale,
  
  // Всегда добавлять префикс локали
  localePrefix: 'always'
})

export const config = {
  // Применять middleware ко всем путям, кроме статических файлов и API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
