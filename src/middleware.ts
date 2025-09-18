import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/config'
import { NextRequest, NextResponse } from 'next/server'

const intlMiddleware = createMiddleware({
  // Список всех поддерживаемых локалей
  locales,
  
  // Локаль по умолчанию
  defaultLocale,
  
  // Всегда добавлять префикс локали
  localePrefix: 'always'
})

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Проверяем на дублирующиеся локали (например, /ru/uk, /uk/ru)
  const pathSegments = pathname.split('/').filter(Boolean)
  
  if (pathSegments.length >= 2) {
    const firstSegment = pathSegments[0]
    const secondSegment = pathSegments[1]
    
    // Если первые два сегмента - это локали, это неправильный URL
    if (locales.includes(firstSegment as any) && locales.includes(secondSegment as any)) {
      // Редиректим на правильную локаль
      const correctPath = `/${firstSegment}`
      return NextResponse.redirect(new URL(correctPath, request.url))
    }
  }
  
  // Применяем стандартный middleware next-intl
  return intlMiddleware(request)
}

export const config = {
  // Применять middleware ко всем путям, кроме статических файлов и API
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
}
