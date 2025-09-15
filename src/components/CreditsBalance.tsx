'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface CreditsBalanceProps {
  userId?: string
  showTransactions?: boolean
}

interface BalanceData {
  balance: number
  grace_limit_used: boolean
  last_updated: string
}

interface Transaction {
  id: string
  type: 'credit' | 'debit'
  amount: number
  source: string
  description: string
  balance_after: number
  created_at: string
}

export default function CreditsBalance({ userId, showTransactions = false }: CreditsBalanceProps) {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchBalance = async () => {
      try {
        setLoading(true)
        setError(null)

        // Получаем баланс
        const balanceResponse = await fetch('/api/credits/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        })

        if (!balanceResponse.ok) {
          throw new Error('Failed to fetch balance')
        }

        const data = await balanceResponse.json()
        
        // Устанавливаем баланс
        setBalance({
          balance: data.balance || 0,
          grace_limit_used: data.grace_limit_used || false,
          last_updated: new Date().toISOString()
        })

        // Устанавливаем транзакции если нужно
        if (showTransactions) {
          setTransactions(data.transactions || [])
        }
      } catch (err) {
        console.error('Error fetching balance:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()
  }, [userId, showTransactions])

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Загрузка баланса...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 text-sm">
        Ошибка загрузки баланса: {error}
      </div>
    )
  }

  if (!balance) {
    return (
      <div className="text-gray-500 text-sm">
        Баланс не найден
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Основной баланс */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Баланс кредитов</h3>
            <p className="text-sm text-gray-600">
              Последнее обновление: {new Date(balance.last_updated).toLocaleString('ru-RU')}
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-blue-600">
              {balance.balance}
            </div>
            <div className="text-sm text-gray-500">
              кредитов
            </div>
          </div>
        </div>
        
        {balance.grace_limit_used && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">
              ⚠️ Использован grace-лимит. Пополните баланс для продолжения работы.
            </p>
          </div>
        )}
      </div>

      {/* Транзакции */}
      {showTransactions && transactions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">История транзакций</h4>
          <div className="space-y-2">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      transaction.type === 'credit' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === 'credit' ? '+' : '-'}
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {transaction.description}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {transaction.source} • {new Date(transaction.created_at).toLocaleString('ru-RU')}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-medium ${
                    transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'credit' ? '+' : ''}{transaction.amount}
                  </div>
                  <div className="text-xs text-gray-500">
                    Баланс: {transaction.balance_after}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
