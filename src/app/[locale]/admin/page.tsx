'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Layout } from '@/components/layout'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { Trash2, Eye, DollarSign, Users, CreditCard } from 'lucide-react'

interface UserData {
  id: string
  email: string
  created_at: string
  user_metadata: any
  profiles?: {
    full_name: string
    avatar_url: string
  }
  user_balances?: {
    balance: number
  }
}

export default function AdminPage() {
  const t = useTranslations()
  const [user, setUser] = useState<User | null>(null)
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState<any[]>([])

  useEffect(() => {
    // Проверяем, что пользователь авторизован
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        loadData()
      } else {
        setLoading(false)
      }
    })
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Загружаем пользователей через API
      const response = await fetch('/api/list-users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
      } else {
        console.error('Ошибка загрузки пользователей:', data.error)
      }

      // Загружаем транзакции
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          profiles(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (transactionsError) {
        console.error('Ошибка загрузки транзакций:', transactionsError)
      } else {
        setTransactions(transactionsData || [])
      }

    } catch (error) {
      console.error('Ошибка загрузки данных:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/delete-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
        alert('Пользователь удален')
      } else {
        alert('Ошибка удаления пользователя')
      }
    } catch (error) {
      console.error('Ошибка удаления:', error)
      alert('Ошибка удаления пользователя')
    }
  }

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
                Доступ запрещен
              </h2>
              <p className="text-lg text-slate-600">
                Необходима авторизация для доступа к админ панели
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900">Админ панель</h1>
          <Button onClick={loadData} variant="outline">
            Обновить данные
          </Button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Транзакции</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transactions.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Общий баланс</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.reduce((sum, user) => sum + (user.user_balances?.balance || 0), 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(user => user.user_balances?.balance && user.user_balances.balance > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Список пользователей */}
        <Card>
          <CardHeader>
            <CardTitle>Пользователи</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium">
                        {user.profiles?.full_name?.[0] || user.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium">{user.profiles?.full_name || 'Без имени'}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Регистрация: {new Date(user.created_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {user.user_balances?.balance || 0} кредитов
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteUser(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Транзакции */}
        <Card>
          <CardHeader>
            <CardTitle>Последние транзакции</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {transactions.slice(0, 20).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.profiles?.full_name || transaction.profiles?.email}</p>
                    <p className="text-sm text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={transaction.type === 'credit' ? 'default' : 'secondary'}>
                      {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                    </Badge>
                    <p className="text-sm text-gray-500">Баланс: {transaction.balance_after}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}
