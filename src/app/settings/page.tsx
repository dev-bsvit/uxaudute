'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { SidebarDemo } from '@/components/sidebar-demo';
import { PageHeader } from '@/components/ui/page-header';
import { PageContent } from '@/components/ui/page-content';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Palette, 
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  // Настройки профиля
  const [profileSettings, setProfileSettings] = useState({
    fullName: '',
    email: '',
    company: '',
    position: ''
  });

  // Настройки уведомлений
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    auditComplete: true,
    weeklyReports: false,
    marketingEmails: false
  });

  // Настройки интерфейса
  const [interfaceSettings, setInterfaceSettings] = useState({
    theme: 'light',
    language: 'ru',
    compactMode: false,
    showTips: true
  });

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser(user);
        setProfileSettings({
          fullName: user.user_metadata?.full_name || '',
          email: user.email || '',
          company: user.user_metadata?.company || '',
          position: user.user_metadata?.position || ''
        });
      }
      setLoading(false);
    });

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: profileSettings.fullName,
          company: profileSettings.company,
          position: profileSettings.position
        }
      });

      if (error) throw error;
      showMessage('success', 'Профиль успешно обновлен');
    } catch (error) {
      showMessage('error', 'Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Здесь можно добавить сохранение настроек уведомлений в базу данных
      showMessage('success', 'Настройки уведомлений сохранены');
    } catch (error) {
      showMessage('error', 'Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterface = async () => {
    setSaving(true);
    try {
      // Здесь можно добавить сохранение настроек интерфейса
      showMessage('success', 'Настройки интерфейса сохранены');
    } catch (error) {
      showMessage('error', 'Ошибка при сохранении настроек');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
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
              Управляйте своим профилем и предпочтениями
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarDemo user={user}>
      <PageContent maxWidth="4xl">
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <PageHeader 
              title="Настройки"
              description="Управляйте своим профилем и предпочтениями приложения"
            />
            <Badge variant="outline" className="text-sm">
              Версия 1.0
            </Badge>
          </div>

          {message && (
            <div className={`flex items-center gap-2 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              {message.text}
            </div>
          )}

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Профиль
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Уведомления
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Интерфейс
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Безопасность
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Информация профиля</CardTitle>
              <CardDescription>
                Обновите свою личную информацию и контактные данные
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Полное имя</Label>
                  <Input
                    id="fullName"
                    value={profileSettings.fullName}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Введите ваше имя"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileSettings.email}
                    disabled
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="company">Компания</Label>
                  <Input
                    id="company"
                    value={profileSettings.company}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, company: e.target.value }))}
                    placeholder="Название компании"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Должность</Label>
                  <Input
                    id="position"
                    value={profileSettings.position}
                    onChange={(e) => setProfileSettings(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ваша должность"
                  />
                </div>
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Сохранение...' : 'Сохранить профиль'}
                </Button>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Настройки уведомлений</CardTitle>
              <CardDescription>
                Выберите, какие уведомления вы хотите получать
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email уведомления</Label>
                  <p className="text-sm text-gray-500">Получать уведомления на email</p>
                </div>
                <Switch
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Завершение анализа</Label>
                  <p className="text-sm text-gray-500">Уведомления о готовности результатов</p>
                </div>
                <Switch
                  checked={notificationSettings.auditComplete}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, auditComplete: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Еженедельные отчеты</Label>
                  <p className="text-sm text-gray-500">Сводка активности за неделю</p>
                </div>
                <Switch
                  checked={notificationSettings.weeklyReports}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Маркетинговые письма</Label>
                  <p className="text-sm text-gray-500">Новости и обновления продукта</p>
                </div>
                <Switch
                  checked={notificationSettings.marketingEmails}
                  onCheckedChange={(checked) => 
                    setNotificationSettings(prev => ({ ...prev, marketingEmails: checked }))
                  }
                />
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveNotifications} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="interface" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Настройки интерфейса</CardTitle>
              <CardDescription>
                Персонализируйте внешний вид и поведение приложения
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Язык интерфейса</Label>
                  <p className="text-sm text-gray-500">Выберите предпочитаемый язык</p>
                </div>
                <select 
                  className="px-3 py-2 border border-gray-300 rounded-md"
                  value={interfaceSettings.language}
                  onChange={(e) => setInterfaceSettings(prev => ({ ...prev, language: e.target.value }))}
                >
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                </select>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Компактный режим</Label>
                  <p className="text-sm text-gray-500">Уменьшить отступы и размеры элементов</p>
                </div>
                <Switch
                  checked={interfaceSettings.compactMode}
                  onCheckedChange={(checked) => 
                    setInterfaceSettings(prev => ({ ...prev, compactMode: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Показывать подсказки</Label>
                  <p className="text-sm text-gray-500">Отображать всплывающие подсказки</p>
                </div>
                <Switch
                  checked={interfaceSettings.showTips}
                  onCheckedChange={(checked) => 
                    setInterfaceSettings(prev => ({ ...prev, showTips: checked }))
                  }
                />
              </div>

              <Separator />
              
              <div className="flex justify-end">
                <Button onClick={handleSaveInterface} disabled={saving}>
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Сохранение...' : 'Сохранить настройки'}
                </Button>
              </div>
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Безопасность аккаунта</CardTitle>
              <CardDescription>
                Управляйте безопасностью вашего аккаунта
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Смена пароля</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Регулярно обновляйте пароль для защиты аккаунта
                  </p>
                  <Button variant="outline">
                    Изменить пароль
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Двухфакторная аутентификация</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Добавьте дополнительный уровень защиты
                  </p>
                  <Button variant="outline">
                    Настроить 2FA
                  </Button>
                </div>

                <Separator />

                <div>
                  <Label className="text-base font-medium">Активные сессии</Label>
                  <p className="text-sm text-gray-500 mb-3">
                    Просмотрите и управляйте активными сессиями
                  </p>
                  <Button variant="outline">
                    Управлять сессиями
                  </Button>
                </div>

                <Separator />

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <Label className="text-base font-medium text-red-800">Удаление аккаунта</Label>
                  <p className="text-sm text-red-600 mb-3">
                    Это действие нельзя отменить. Все ваши данные будут удалены.
                  </p>
                  <Button variant="destructive">
                    Удалить аккаунт
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContent>
    </SidebarDemo>
  );
}