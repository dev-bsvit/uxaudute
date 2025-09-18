'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Layout } from '@/components/layout'
import { CreditsBalance } from '@/components/credits-balance'
import { CreditsPurchase } from '@/components/credits-purchase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CreditCard, Gift, Zap, Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function CreditsPage() {
  const t = useTranslations()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  if (!user) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Необходима авторизация
              </h2>
              <p className="text-lg text-slate-600">
                Войдите в систему для управления кредитами
              </p>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Управление кредитами
          </h1>
          <p className="text-xl text-slate-600">
            Пополните баланс для продолжения анализа
          </p>
        </div>

        {/* Текущий баланс */}
        <CreditsBalance />

        {/* Пакеты кредитов */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                Стартовый пакет
              </CardTitle>
              <div className="text-3xl font-bold text-blue-600">10 кредитов</div>
              <div className="text-2xl font-bold">$5</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 5 анализов UX</li>
                <li>• Базовые рекомендации</li>
                <li>• Экспорт результатов</li>
              </ul>
              <Button className="w-full mt-4" variant="outline">
                Купить за $5
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-200 relative">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-purple-600 text-white">Популярный</Badge>
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-600" />
                Профессиональный
              </CardTitle>
              <div className="text-3xl font-bold text-purple-600">50 кредитов</div>
              <div className="text-2xl font-bold">$20</div>
              <div className="text-sm text-green-600">Экономия $5</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 25 анализов UX</li>
                <li>• Расширенные рекомендации</li>
                <li>• AB тесты</li>
                <li>• Приоритетная поддержка</li>
              </ul>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700">
                Купить за $20
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-gold-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                Бизнес пакет
              </CardTitle>
              <div className="text-3xl font-bold text-yellow-600">150 кредитов</div>
              <div className="text-2xl font-bold">$50</div>
              <div className="text-sm text-green-600">Экономия $25</div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• 75 анализов UX</li>
                <li>• Все функции</li>
                <li>• Бизнес аналитика</li>
                <li>• Персональный менеджер</li>
              </ul>
              <Button className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white">
                Купить за $50
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Компонент покупки */}
        <CreditsPurchase />

        {/* Информация о кредитах */}
        <Card>
          <CardHeader>
            <CardTitle>Как работают кредиты?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Расход кредитов:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• UX анализ: 2 кредита</li>
                  <li>• AB тесты: 1 кредит</li>
                  <li>• Гипотезы: 1 кредит</li>
                  <li>• Бизнес аналитика: 2 кредита</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Получение кредитов:</h3>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• Регистрация: 5 кредитов</li>
                  <li>• Покупка пакетов</li>
                  <li>• Реферальная программа</li>
                  <li>• Специальные акции</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
