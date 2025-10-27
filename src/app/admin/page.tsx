'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  CreditCard, 
  BarChart3, 
  Search, 
  Plus, 
  Minus, 
  Trash2,
  Eye,
  Edit
} from 'lucide-react'

interface User {
  id: string
  email: string
  created_at: string
  hasBalance: boolean
  balance: number
}

interface Transaction {
  id: string
  user_id: string
  type: 'credit' | 'debit'
  amount: number
  balance_after: number
  source: string
  description: string
  created_at: string
}

interface OnboardingData {
  id: string
  user_id: string
  first_name: string
  role: string
  interests: string[]
  source: string
  completed: boolean
  completed_at: string
  created_at: string
  user_email?: string
}

export default function AdminPanel() {
  const router = useRouter()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [onboardingData, setOnboardingData] = useState<OnboardingData[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Проверка прав администратора
  const checkAdminRights = (user: SupabaseUser) => {
    const adminEmails = [
      'designbsvit@gmail.com'
    ]
    
    return adminEmails.includes(user.email || '')
  }

  // Проверка доступа при загрузке страницы
  useEffect(() => {
    const checkAccess = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          // Пользователь не авторизован - перенаправляем на главную
          router.push('/')
          return
        }

        setUser(user)
        
        if (!checkAdminRights(user)) {
          // Пользователь не админ - перенаправляем на главную
          router.push('/')
          return
        }

        // Пользователь админ - разрешаем доступ
        setIsAdmin(true)
        setIsChecking(false)
        
        // Загружаем данные
        loadUsers()
        loadTransactions()
        loadOnboardingData()

      } catch (error) {
        console.error('Ошибка проверки доступа:', error)
        router.push('/')
      }
    }

    checkAccess()
  }, [router])

  // Загрузка пользователей
  const loadUsers = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/list-users')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
      } else {
        setError('Ошибка загрузки пользователей')
      }
    } catch (err) {
      setError('Ошибка загрузки пользователей')
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка транзакций
  const loadTransactions = async () => {
    try {
      const response = await fetch('/api/admin/transactions')
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
      }
    } catch (err) {
      console.error('Ошибка загрузки транзакций:', err)
    }
  }

  // Загрузка данных онбординга
  const loadOnboardingData = async () => {
    try {
      const response = await fetch('/api/admin/onboarding')
      const data = await response.json()

      if (data.success) {
        setOnboardingData(data.data)
      }
    } catch (err) {
      console.error('Ошибка загрузки данных онбординга:', err)
    }
  }

  // Удален старый useEffect - теперь загрузка происходит в checkAccess

  // Фильтрация пользователей
  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Добавление кредитов
  const addCredits = async (userId: string, amount: number) => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/add-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, amount })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Добавлено ${amount} кредитов пользователю`)
        loadUsers()
        loadTransactions()
        setCreditAmount('')
      } else {
        setError(data.error || 'Ошибка добавления кредитов')
      }
    } catch (err) {
      setError('Ошибка добавления кредитов')
    } finally {
      setIsLoading(false)
    }
  }

  // Удаление пользователя
  const deleteUser = async (userId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/delete-user', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Пользователь удален успешно')
        loadUsers()
      } else {
        setError(data.error || 'Ошибка удаления пользователя')
      }
    } catch (err) {
      setError('Ошибка удаления пользователя')
    } finally {
      setIsLoading(false)
    }
  }

  // Статистика
  const totalUsers = users.length
  const totalCredits = users.reduce((sum, user) => sum + user.balance, 0)
  const recentTransactions = transactions.slice(0, 5)

  // Показываем загрузку во время проверки доступа
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Проверка прав доступа...</p>
        </div>
      </div>
    )
  }

  // Если пользователь не админ, показываем сообщение об отказе в доступе
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Доступ запрещен</h1>
          <p className="text-gray-600 mb-4">У вас нет прав для доступа к админ-панели</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться на главную
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Админ-панель</h1>
          <p className="text-gray-600 mt-2">Управление пользователями и кредитами</p>
        </div>

        {/* Уведомления */}
        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего пользователей</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего кредитов</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCredits}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Средний баланс</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalUsers > 0 ? Math.round(totalCredits / totalUsers) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Основной контент */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="credits">Кредиты</TabsTrigger>
            <TabsTrigger value="transactions">Транзакции</TabsTrigger>
            <TabsTrigger value="onboarding">Анкеты</TabsTrigger>
          </TabsList>

          {/* Вкладка пользователей */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление пользователями</CardTitle>
                <CardDescription>
                  Список всех пользователей системы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Поиск по email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{user.email}</p>
                            <p className="text-sm text-gray-500">
                              ID: {user.id}
                            </p>
                            <p className="text-sm text-gray-500">
                              Регистрация: {new Date(user.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <Badge variant={user.balance > 0 ? "default" : "secondary"}>
                            {user.balance} кредитов
                          </Badge>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteUser(user.id)}
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка кредитов */}
          <TabsContent value="credits" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Управление кредитами</CardTitle>
                <CardDescription>
                  Добавление и списание кредитов пользователям
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedUser ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">Выбранный пользователь:</h3>
                      <p className="text-sm text-gray-600">{selectedUser.email}</p>
                      <p className="text-sm text-gray-600">Текущий баланс: {selectedUser.balance} кредитов</p>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <Label htmlFor="creditAmount">Количество кредитов</Label>
                        <Input
                          id="creditAmount"
                          type="number"
                          value={creditAmount}
                          onChange={(e) => setCreditAmount(e.target.value)}
                          placeholder="Введите количество"
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => addCredits(selectedUser.id, Math.abs(Number(creditAmount)))}
                          disabled={!creditAmount || isLoading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Добавить
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => addCredits(selectedUser.id, -Math.abs(Number(creditAmount)))}
                          disabled={!creditAmount || isLoading}
                        >
                          <Minus className="h-4 w-4 mr-2" />
                          Списать
                        </Button>
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      onClick={() => setSelectedUser(null)}
                    >
                      Отменить выбор
                    </Button>
                  </div>
                ) : (
                  <p className="text-gray-500">
                    Выберите пользователя на вкладке "Пользователи" для управления кредитами
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка транзакций */}
          <TabsContent value="transactions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>История транзакций</CardTitle>
                <CardDescription>
                  Последние транзакции в системе
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-500">
                              Пользователь: {transaction.user_id}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(transaction.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <Badge variant={transaction.type === 'credit' ? "default" : "destructive"}>
                          {transaction.type === 'credit' ? '+' : '-'}{transaction.amount}
                        </Badge>
                        <p className="text-sm text-gray-500 mt-1">
                          Баланс: {transaction.balance_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Вкладка анкет онбординга */}
          <TabsContent value="onboarding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Данные анкет пользователей</CardTitle>
                <CardDescription>
                  Информация, собранная во время онбординга
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {onboardingData.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Пока нет данных анкет
                    </p>
                  ) : (
                    onboardingData.map((data) => (
                      <div key={data.id} className="p-6 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {data.first_name}
                              </h3>
                              <p className="text-sm text-gray-500">{data.user_email || data.user_id}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                              <div>
                                <p className="text-sm font-medium text-gray-700">Роль:</p>
                                <Badge variant="outline" className="mt-1">
                                  {data.role === 'designer' && 'Designer'}
                                  {data.role === 'researcher' && 'Researcher'}
                                  {data.role === 'marketer' && 'Marketer'}
                                  {data.role === 'product_manager' && 'Product Manager'}
                                  {data.role === 'founder_ceo' && 'Founder / CEO'}
                                  {data.role === 'student' && 'Student'}
                                  {data.role === 'other' && 'Other'}
                                </Badge>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-gray-700">Источник:</p>
                                <Badge variant="outline" className="mt-1">
                                  {data.source === 'linkedin' && 'LinkedIn'}
                                  {data.source === 'telegram' && 'Telegram'}
                                  {data.source === 'google' && 'Google'}
                                  {data.source === 'chatgpt' && 'ChatGPT'}
                                  {data.source === 'youtube' && 'YouTube'}
                                  {data.source === 'instagram' && 'Instagram'}
                                  {data.source === 'other' && 'Другое'}
                                </Badge>
                              </div>
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-700">Интересы:</p>
                              <div className="flex flex-wrap gap-2 mt-1">
                                {data.interests.map((interest, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {interest === 'ux_analysis' && 'UX анализ'}
                                    {interest === 'ab_test' && 'A/B тест'}
                                    {interest === 'hypotheses' && 'Гипотезы'}
                                    {interest === 'business_analytics' && 'Бизнес-аналитика'}
                                    {interest === 'surveys' && 'Опросы'}
                                    {interest === 'card_sorting' && 'Карточная сортировка'}
                                    {interest === 'comparative_analysis' && 'Сравнительный анализ'}
                                    {interest === 'other' && 'Другое'}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t">
                              <span>Создано: {new Date(data.created_at).toLocaleDateString()}</span>
                              {data.completed && data.completed_at && (
                                <span>Завершено: {new Date(data.completed_at).toLocaleDateString()}</span>
                              )}
                            </div>
                          </div>

                          <div>
                            <Badge variant={data.completed ? "default" : "secondary"}>
                              {data.completed ? 'Завершено' : 'В процессе'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
