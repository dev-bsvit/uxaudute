'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings, ChevronDown, CreditCard, Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { signOut, ensureUserHasInitialBalance } from '@/lib/database'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface LayoutProps {
  children: ReactNode
  title?: string
  transparentHeader?: boolean
}

export function Layout({ children, title = 'UX Audit', transparentHeader = false }: LayoutProps) {
  const pathname = usePathname()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [creditsBalance, setCreditsBalance] = useState<number | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  
  // Навигация с Dashboard для быстрого анализа
  const navigation = [
    { name: 'Быстрый анализ', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Мои проекты', href: '/projects', current: pathname.startsWith('/projects') },
  ]

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      console.log('🔍 Начальная проверка пользователя:', user?.email, user?.id)
      console.log('🔍 Детали пользователя:', {
        hasUser: !!user,
        email: user?.email,
        id: user?.id,
        isGoogleOAuth: user?.app_metadata?.provider === 'google',
        providers: user?.app_metadata?.providers
      })
      
      setUser(user)
      
      // Если пользователь уже авторизован, убеждаемся что у него есть начальный баланс
      if (user) {
        console.log('🔍 Проверяем баланс для пользователя:', user.id, user.email)
        console.log('🔍 Вызываем ensureUserHasInitialBalance для существующего пользователя...')
        try {
          await ensureUserHasInitialBalance(user.id)
          console.log('✅ ensureUserHasInitialBalance выполнена успешно для существующего пользователя')
        } catch (error) {
          console.error('❌ Ошибка при проверке баланса:', error)
        }
        
        // Дополнительная проверка баланса через API для всех пользователей
        setTimeout(async () => {
          try {
            console.log('🔍 Дополнительная проверка баланса через API...')
            const response = await fetch('/api/credits/balance', {
              headers: {
                'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
              }
            })
            const data = await response.json()
            console.log('🔍 Результат дополнительной проверки баланса:', data)
            
            if (data.success && data.balance === 0) {
              console.log('🔍 Обнаружен нулевой баланс, создаем начальный баланс...')
              await ensureUserHasInitialBalance(user.id)
            }
          } catch (err) {
            console.error('❌ Ошибка дополнительной проверки баланса:', err)
          }
        }, 2000)
        
        // Дополнительная проверка всех новых пользователей
        setTimeout(async () => {
          try {
            console.log('🔍 Layout: проверяем всех новых пользователей...')
            const response = await fetch('/api/ensure-all-users-have-credits', {
              method: 'POST'
            })
            const data = await response.json()
            console.log('🔍 Layout: результат проверки всех пользователей:', data)
          } catch (err) {
            console.error('❌ Layout: ошибка проверки всех пользователей:', err)
          }
        }, 4000)
      }
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Auth state change:', event, session?.user?.email, session?.user?.id)
      console.log('🔄 Session details:', { 
        hasSession: !!session, 
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        event: event
      })
      setUser(session?.user ?? null)
      
      // Логируем ВСЕ события для отладки Google OAuth
      console.log('🔍 ВСЕ СОБЫТИЯ АУТЕНТИФИКАЦИИ:', {
        event: event,
        hasUser: !!session?.user,
        userEmail: session?.user?.email,
        userId: session?.user?.id,
        isGoogleOAuth: session?.user?.app_metadata?.provider === 'google',
        providers: session?.user?.app_metadata?.providers
      })
      
      // Если пользователь авторизовался, убеждаемся что у него есть начальный баланс
      // Расширяем условия для Google OAuth
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION')) {
        console.log('🔍 Создаем баланс для пользователя:', session.user.id, session.user.email, 'событие:', event)
        console.log('🔍 Вызываем ensureUserHasInitialBalance...')
        console.log('🔍 Текущее время:', new Date().toISOString())
        
        try {
          console.log('🔍 Начинаем вызов ensureUserHasInitialBalance...')
          await ensureUserHasInitialBalance(session.user.id)
          console.log('✅ ensureUserHasInitialBalance выполнена успешно')
          
          // Дополнительно проверим баланс через API
          setTimeout(async () => {
            try {
              console.log('🔍 Проверяем баланс через API через 1 секунду...')
              const response = await fetch('/api/credits/balance', {
                headers: {
                  'Authorization': `Bearer ${session.access_token}`
                }
              })
              const data = await response.json()
              console.log('🔍 Проверка баланса после ensureUserHasInitialBalance:', data)
              
              // Обновляем состояние баланса
              if (data.success) {
                setCreditsBalance(data.balance)
                console.log('🔍 Обновлен баланс в состоянии:', data.balance)
                
                // Если баланс все еще 0, попробуем еще раз создать начальный баланс
                if (data.balance === 0) {
                  console.log('🔍 Баланс все еще 0, повторная попытка создания начального баланса...')
                  await ensureUserHasInitialBalance(session.user.id)
                }
              }
            } catch (err) {
              console.error('❌ Ошибка проверки баланса:', err)
            }
          }, 1000)
        } catch (error) {
          console.error('❌ Ошибка при создании баланса:', error)
          console.error('❌ Детали ошибки:', error)
        }
      } else {
        console.log('🔍 Пользователь не авторизован или событие не подходит:', { 
          hasUser: !!session?.user, 
          event: event,
          shouldProcess: session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
        })
      }
    })

    // Закрываем меню при клике вне его
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-user-menu]')) {
        setShowUserMenu(false)
      }
    }

    document.addEventListener('click', handleClickOutside)

    return () => {
      subscription.unsubscribe()
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Загружаем баланс кредитов
  useEffect(() => {
    const fetchCreditsBalance = async () => {
      if (!user) return
      
      try {
        const { data: session } = await supabase.auth.getSession()
        if (!session?.session?.access_token) {
          console.log('No access token available')
          return
        }

        const response = await fetch('/api/credits/balance', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.session.access_token}`
          }
        })
        const data = await response.json()
        if (data.success) {
          setCreditsBalance(data.balance)
        } else {
          console.error('Error fetching balance:', data.error)
          // Fallback на демо API для отладки
          try {
            const demoResponse = await fetch('/api/credits/demo-balance')
            const demoData = await demoResponse.json()
            if (demoData.success) {
              setCreditsBalance(demoData.balance)
            }
          } catch (demoError) {
            console.error('Demo API also failed:', demoError)
          }
        }
      } catch (error) {
        console.error('Error fetching credits balance:', error)
      }
    }

    if (user) {
      fetchCreditsBalance()
    }
  }, [user])

  // Проверка прав администратора
  const checkAdminRights = (user: SupabaseUser) => {
    // Список email адресов администраторов
    const adminEmails = [
      'designbsvit@gmail.com'
    ]
    
    return adminEmails.includes(user.email || '')
  }

  // Обновляем статус админа при изменении пользователя
  useEffect(() => {
    if (user) {
      setIsAdmin(checkAdminRights(user))
    } else {
      setIsAdmin(false)
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setShowUserMenu(false)
      window.location.href = '/'
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return (
    <div className="min-h-screen">
      <header className={`${transparentHeader ? 'bg-transparent absolute top-0 left-0 right-0 z-50' : 'bg-white shadow-sm border-b'}`}>
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className={`flex items-center space-x-2 text-xl font-bold transition-colors ${
                transparentHeader 
                  ? 'text-white hover:text-blue-200' 
                  : 'text-blue-600 hover:text-blue-700'
              }`}>
                <img 
                  src="/logo.svg" 
                  alt="UX Audit" 
                  className="h-6 w-auto"
                />
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      transparentHeader
                        ? item.current
                          ? 'bg-white/20 text-white'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        : item.current
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {title !== 'UX Audit' && (
                <div className="text-sm text-gray-600 hidden sm:block">
                  {title}
                </div>
              )}
              
              {user ? (
                <div className="relative" data-user-menu>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm font-medium">
                      {user.user_metadata?.full_name || user.email?.split('@')[0]}
                    </span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user.user_metadata?.full_name || 'Пользователь'}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>

                      {/* Баланс кредитов */}
                      <div className="px-4 py-2 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Баланс кредитов</span>
                          <span className="text-lg font-bold text-blue-600">
                            {creditsBalance !== null ? creditsBalance : '...'}
                          </span>
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span>🎯</span>
                        Быстрый анализ
                      </Link>
                      
                      <Link
                        href="/projects"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Мои проекты
                      </Link>

                      <Link
                        href="/credits"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <CreditCard className="w-4 h-4" />
                        Счет
                      </Link>

                      {isAdmin && (
                        <Link
                          href="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Shield className="w-4 h-4" />
                          Админ-панель
                        </Link>
                      )}
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href="/dashboard">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Войти
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      <main>
        {children}
      </main>
    </div>
  )
}
