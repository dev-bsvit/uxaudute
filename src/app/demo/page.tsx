'use client'

import { useState, useEffect } from 'react'

export default function DemoPage() {
  const [balance, setBalance] = useState<number | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/credits/demo-balance')
        const data = await response.json()
        
        if (data.success) {
          setBalance(data.balance)
          setTransactions(data.transactions)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 UX Audit Platform - Демо
          </h1>
          <p className="text-gray-600">
            Демонстрация системы кредитов и токеномики
          </p>
        </div>

        {/* Статус */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-green-100 text-green-800">
            ✅ Система токеномики активна
          </div>
        </div>

        {/* Баланс */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Мой баланс</h2>
          
          {loading && (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-gray-600">Загрузка баланса...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-red-800">
                <strong>Ошибка:</strong> {error}
              </div>
            </div>
          )}

          {balance !== null && !loading && !error && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {balance} кредитов
                </div>
                <div className="text-sm text-gray-500">
                  Grace-лимит: не использован
                </div>
              </div>

              {/* Транзакции */}
              {transactions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">📋 История транзакций</h3>
                  <div className="space-y-2">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                        <div>
                          <div className="font-medium text-gray-900">
                            {transaction.type === 'credit' ? '➕' : '➖'} {transaction.description}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(transaction.created_at).toLocaleString('ru-RU')}
                          </div>
                        </div>
                        <div className={`font-medium ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.type === 'credit' ? '+' : ''}{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Информация о системе */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            🎯 Как работает система кредитов
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

        {/* Stripe интеграция */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            💳 Stripe интеграция
          </h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">API endpoints созданы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-700">UI компоненты готовы</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Требуется настройка ключей в Vercel</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-gray-700">Требуется создание webhook в Stripe</span>
            </div>
          </div>
        </div>

        {/* Ссылки */}
        <div className="mt-8 text-center">
          <div className="space-x-4">
            <a 
              href="/credits" 
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Перейти к полной версии
            </a>
            <a 
              href="/api/credits/demo-balance" 
              target="_blank"
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Посмотреть API
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

