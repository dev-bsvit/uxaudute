'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { SidebarDemo } from '@/components/sidebar-demo'
import CreditsBalance from '@/components/CreditsBalance'
import CreditsPurchase from '@/components/CreditsPurchase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CreditCard, TrendingUp, History, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export default function CreditsPage() {
  const t = useTranslations()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshBalance, setRefreshBalance] = useState(0)

  // Используем реального пользователя
  const userId = user?.id

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

  const handlePurchaseComplete = () => {
    setRefreshBalance(prev => prev + 1)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              {t('credits.signInRequired')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('credits.signInDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Заголовок */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                {t('credits.title')}
              </h1>
              <p className="text-lg text-slate-600">
                {t('credits.description')}
              </p>
            </div>
            
            {/* Баланс кредитов */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-2xl font-bold">{t('credits.balance')}</CardTitle>
                <CreditCard className="h-6 w-6 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <CreditsBalance
                  userId={userId}
                  showTransactions={false}
                  key={refreshBalance}
                />
              </CardContent>
            </Card>

            {/* Покупка кредитов */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Пополнить баланс
                </CardTitle>
                <CardDescription>
                  Выберите пакет кредитов для пополнения баланса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreditsPurchase 
                  userId={userId}
                  onPurchaseComplete={handlePurchaseComplete}
                />
              </CardContent>
            </Card>

            {/* История транзакций */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  История транзакций
                </CardTitle>
                <CardDescription>
                  Последние операции с вашим балансом кредитов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CreditsBalance
                  userId={userId}
                  showTransactions={true}
                  key={refreshBalance}
                />
              </CardContent>
            </Card>

            {/* Информация о системе */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Как работает система кредитов
                </CardTitle>
                <CardDescription>
                  Подробная информация о типах аудитов и особенностях системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Типы аудитов</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Основной аудит</span>
                        <Badge variant="outline">2 кредита</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Дополнительный аудит</span>
                        <Badge variant="outline">1 кредит</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">Бизнес-анализ</span>
                        <Badge variant="outline">1 кредит</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">A/B тестирование</span>
                        <Badge variant="outline">1 кредит</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-foreground">Особенности</h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Grace-лимит: -1 кредит</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">Кредиты не сгорают</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Тестовые аккаунты: бесплатно</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <span className="text-sm">Командные аккаунты: общий пул</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Статус системы */}
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Система токеномики активна
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}