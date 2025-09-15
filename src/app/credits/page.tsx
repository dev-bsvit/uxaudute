'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Section } from '@/components/ui/section'
import CreditsBalance from '@/components/CreditsBalance'
import CreditsPurchase from '@/components/CreditsPurchase'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshBalance, setRefreshBalance] = useState(0)
  const router = useRouter()

  // Для демонстрации используем существующего пользователя
  const testUserId = 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'

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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Баланс кредитов</h2>
            <div className="text-sm text-gray-500 mb-4">
              Последнее обновление: {new Date().toLocaleString('ru-RU')}
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-2">13</div>
            <div className="text-lg text-gray-600">кредитов</div>
          </div>

          {/* Покупка кредитов */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Пополнить баланс</h2>
            <p className="text-gray-600 mb-6">Выберите пакет кредитов для покупки</p>
            <CreditsPurchase 
              userId={testUserId}
              onPurchaseComplete={handlePurchaseComplete}
            />
          </div>

          {/* История транзакций */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">История транзакций</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium text-gray-900">➕ Test addition of credits</div>
                  <div className="text-sm text-gray-500">12.09.2025, 15:19:55</div>
                </div>
                <div className="font-medium text-green-600">+10</div>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                <div>
                  <div className="font-medium text-gray-900">➖ Test deduction for research audit</div>
                  <div className="text-sm text-gray-500">12.09.2025, 15:19:39</div>
                </div>
                <div className="font-medium text-red-600">-2</div>
              </div>
            </div>
          </div>

          {/* Информация о системе */}
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Как работает система кредитов
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
              <div>
                <h4 className="font-medium mb-2">Типы аудитов:</h4>
                <ul className="space-y-1">
                  <li>• Основной аудит: 2 кредита</li>
                  <li>• Дополнительный аудит: 1 кредит</li>
                  <li>• Бизнес-анализ: 1 кредит</li>
                  <li>• A/B тестирование: 1 кредит</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Особенности:</h4>
                <ul className="space-y-1">
                  <li>• Grace-лимит: -1 кредит</li>
                  <li>• Кредиты не сгорают</li>
                  <li>• Тестовые аккаунты: бесплатно</li>
                  <li>• Командные аккаунты: общий пул</li>
                </ul>
              </div>
            </div>
          </div>

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

