'use client'

import { ReactNode, useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { User, LogOut, Settings, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { signOut } from '@/lib/database'
import { User as SupabaseUser } from '@supabase/supabase-js'

interface LayoutProps {
  children: ReactNode
  title?: string
  transparentHeader?: boolean
}

export function Layout({ children, title = 'UX Audit', transparentHeader = false }: LayoutProps) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  // Навигация с Dashboard для быстрого анализа
  const navigation = [
    { name: t('navigation.dashboard'), href: `/${locale}/dashboard`, current: pathname === `/${locale}/dashboard` },
    { name: t('navigation.projects'), href: `/${locale}/projects`, current: pathname.startsWith(`/${locale}/projects`) },
  ]

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
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

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      setShowUserMenu(false)
      window.location.href = `/${locale}`
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
              <Link href={`/${locale}`} className={`flex items-center space-x-2 text-xl font-bold transition-colors ${
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
                          {user.user_metadata?.full_name || t('auth.user')}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      
                      <Link
                        href={`/${locale}/dashboard`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <span>🎯</span>
                        {t('navigation.dashboard')}
                      </Link>
                      
                      <Link
                        href={`/${locale}/projects`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        {t('navigation.projects')}
                      </Link>
                      
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link href={`/${locale}/dashboard`}>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    {t('auth.signIn')}
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
