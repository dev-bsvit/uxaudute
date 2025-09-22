'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Settings, Globe, User, Bell, Shield, Palette } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { LanguageSelect } from '@/components/language-select'

export default function SettingsPage() {
  const t = useTranslations()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)

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
              Войдите для доступа к настройкам
            </h2>
            <p className="text-lg text-slate-600">
              Управляйте своими настройками и предпочтениями
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="min-h-screen bg-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-8">
            {/* Заголовок */}
            <div className="text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-4">
                Настройки
              </h1>
              <p className="text-lg text-slate-600">
                Управляйте своими настройками и предпочтениями
              </p>
            </div>

            {/* Настройки языка */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Язык интерфейса
                </CardTitle>
                <CardDescription>
                  Выберите язык для отображения интерфейса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Текущий язык</h4>
                      <p className="text-sm text-gray-600">
                        Изменения вступят в силу после перезагрузки страницы
                      </p>
                    </div>
                    <LanguageSelect />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Профиль пользователя */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Профиль пользователя
                </CardTitle>
                <CardDescription>
                  Информация о вашем аккаунте
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Имя</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {user.user_metadata?.full_name || 'Не указано'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900 mt-1">{user.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">ID пользователя</label>
                      <p className="text-sm text-gray-500 mt-1 font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Дата регистрации</label>
                      <p className="text-sm text-gray-900 mt-1">
                        {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Уведомления */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Уведомления
                </CardTitle>
                <CardDescription>
                  Настройте, какие уведомления вы хотите получать
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Email уведомления</h4>
                      <p className="text-sm text-gray-600">
                        Получать уведомления о новых аудитах и обновлениях
                      </p>
                    </div>
                    <Badge variant="outline">В разработке</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push уведомления</h4>
                      <p className="text-sm text-gray-600">
                        Получать уведомления в браузере
                      </p>
                    </div>
                    <Badge variant="outline">В разработке</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Безопасность */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Безопасность
                </CardTitle>
                <CardDescription>
                  Управление безопасностью вашего аккаунта
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Смена пароля</h4>
                      <p className="text-sm text-gray-600">
                        Измените пароль для вашего аккаунта
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      В разработке
                    </Button>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Двухфакторная аутентификация</h4>
                      <p className="text-sm text-gray-600">
                        Добавьте дополнительный уровень безопасности
                      </p>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      В разработке
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Внешний вид */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Внешний вид
                </CardTitle>
                <CardDescription>
                  Настройте внешний вид интерфейса
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Темная тема</h4>
                      <p className="text-sm text-gray-600">
                        Переключитесь на темную тему интерфейса
                      </p>
                    </div>
                    <Badge variant="outline">В разработке</Badge>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Компактный режим</h4>
                      <p className="text-sm text-gray-600">
                        Уменьшите размеры элементов интерфейса
                      </p>
                    </div>
                    <Badge variant="outline">В разработке</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Статус системы */}
            <div className="text-center">
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✅ Все настройки сохранены
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}

