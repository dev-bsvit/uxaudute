'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface CreditsSidebarProps {
  userId?: string
  className?: string
}

interface BalanceData {
  balance: number
  grace_limit_used: boolean
}

export default function CreditsSidebar({ userId, className = '' }: CreditsSidebarProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/credits/demo-balance')
        const data = await response.json()

        if (data.success) {
          setBalance({
            balance: data.balance || 0,
            grace_limit_used: data.grace_limit_used || false
          })
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">💰 Баланс</h3>
        <Link 
          href="/credits" 
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          Управлять
        </Link>
      </div>

      {loading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
          <span className="text-xs text-gray-500">Загрузка...</span>
        </div>
      )}

      {error && (
        <div className="text-xs text-red-600">
          Ошибка загрузки
        </div>
      )}

      {balance && !loading && !error && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600">
              {balance.balance}
            </span>
            <span className="text-xs text-gray-500">кредитов</span>
          </div>
          
          {balance.grace_limit_used && (
            <div className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
              ⚠️ Grace-лимит использован
            </div>
          )}

          <div className="text-xs text-gray-500">
            {balance.balance >= 10 ? '✅ Достаточно для аудита' : '⚠️ Низкий баланс'}
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100">
        <Link 
          href="/credits" 
          className="block w-full text-center text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 py-2 px-3 rounded-md transition-colors"
        >
          Пополнить баланс
        </Link>
      </div>
    </div>
  )
}
