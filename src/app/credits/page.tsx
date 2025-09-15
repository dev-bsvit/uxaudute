'use client'

import { useState } from 'react'
import CreditsBalance from '@/components/CreditsBalance'
import CreditsPurchase from '@/components/CreditsPurchase'

export default function CreditsPage() {
  const [activeTab, setActiveTab] = useState<'balance' | 'purchase'>('balance')
  const [refreshBalance, setRefreshBalance] = useState(0)

  // Для демонстрации используем существующего пользователя
  const testUserId = 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'

  const handlePurchaseComplete = () => {
    setRefreshBalance(prev => prev + 1)
    setActiveTab('balance')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Система кредитов UX Audit
          </h1>
          <p className="text-gray-600">
            Управляйте своим балансом кредитов и покупайте дополнительные пакеты
          </p>
        </div>

        {/* Навигация */}
        <div className="flex space-x-1 bg-white rounded-lg p-1 mb-8 border border-gray-200">
          <button
            onClick={() => setActiveTab('balance')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'balance'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Мой баланс
          </button>
          <button
            onClick={() => setActiveTab('purchase')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
              activeTab === 'purchase'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Пополнить баланс
          </button>
        </div>

        {/* Контент */}
        <div className="bg-white rounded-lg shadow-sm">
          {activeTab === 'balance' && (
            <div className="p-6">
              <CreditsBalance 
                userId={testUserId} 
                showTransactions={true}
                key={refreshBalance} // Принудительное обновление при покупке
              />
            </div>
          )}

          {activeTab === 'purchase' && (
            <div className="p-6">
              <CreditsPurchase 
                userId={testUserId}
                onPurchaseComplete={handlePurchaseComplete}
              />
            </div>
          )}
        </div>

        {/* Информация о системе */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6">
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
        <div className="mt-6 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✅ Система токеномики активна
          </div>
        </div>
      </div>
    </div>
  )
}

