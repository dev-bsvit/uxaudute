'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Section } from '@/components/ui/section'
import CreditsBalance from '@/components/CreditsBalance'
import CreditsPurchase from '@/components/CreditsPurchase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { CreditCard, TrendingUp, History, Info } from 'lucide-react'

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshBalance, setRefreshBalance] = useState(0)
  const router = useRouter()

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

  const handleAuthChange = (user: User | null) => {
    setUser(user)
  }

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
              Войдите для управления кредитами
            </h2>
            <p className="text-lg text-slate-600">
              Управляйте своим балансом кредитов и покупайте дополнительные пакеты
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <PageContent maxWidth="7xl">
        <div className="space-y-8">
          <PageHeader 
            title="Счет"
            description="Управляйте своим балансом кредитов и покупайте дополнительные пакеты для проведения аудитов."
          />
          
          {/* Баланс кредитов */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">Баланс кредитов</CardTitle>
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                Последнее обновление: {new Date().toLocaleString('ru-RU')}
              </div>
              <div className="text-4xl font-bold text-primary mb-2">13</div>
              <p className="text-lg text-muted-foreground">кредитов</p>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-green-600 font-semibold">+</span>
                    </div>
                    <div>
                      <p className="font-medium">Test addition of credits</p>
                      <p className="text-sm text-muted-foreground">12.09.2025, 15:19:55</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    +10 кредитов
                  </Badge>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-semibold">-</span>
                    </div>
                    <div>
                      <p className="font-medium">Test deduction for research audit</p>
                      <p className="text-sm text-muted-foreground">12.09.2025, 15:19:39</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    -2 кредита
                  </Badge>
                </div>
              </div>
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
      </PageContent>
    </SidebarDemo>
  )
}

