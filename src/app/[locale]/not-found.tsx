'use client'

import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  const router = useRouter()
  const locale = useLocale()

  const handleGoHome = () => {
    router.push(`/${locale}`)
  }

  const handleGoBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-2">
            {locale === 'uk' ? 'Сторінку не знайдено' : 'Страница не найдена'}
          </h2>
          <p className="text-gray-600 mb-8">
            {locale === 'uk' 
              ? 'Вибачте, але сторінка, яку ви шукаєте, не існує.' 
              : 'Извините, но страница, которую вы ищете, не существует.'
            }
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleGoHome}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Home className="w-4 h-4 mr-2" />
            {locale === 'uk' ? 'На головну' : 'На главную'}
          </Button>
          
          <Button 
            onClick={handleGoBack}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {locale === 'uk' ? 'Назад' : 'Назад'}
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            {locale === 'uk' 
              ? 'Якщо ви вважаєте, що це помилка, будь ласка, зв\'яжіться з нами.' 
              : 'Если вы считаете, что это ошибка, пожалуйста, свяжитесь с нами.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}
