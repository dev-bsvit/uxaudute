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
  Globe,
  Save,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { LanguageSelectorDetailed } from '@/components/language-selector';
import { useTranslation } from '@/hooks/use-translation';

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();
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
      showMessage('success', t('settings.profileSaved'));
    } catch (error) {
      showMessage('error', t('settings.profileError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Здесь можно добавить сохранение настроек уведомлений в базу данных
      showMessage('success', t('settings.notificationsSaved'));
    } catch (error) {
      showMessage('error', t('settings.notificationsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveInterface = async () => {
    setSaving(true);
    try {
      // Здесь можно добавить сохранение настроек интерфейса
      showMessage('success', t('settings.interfaceSaved'));
    } catch (error) {
      showMessage('error', t('settings.interfaceError'));
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
              title={t('settings.title')}
              description={t('settings.subtitle')}
            />
            <Badge variant="outline" className="text-sm">
              {t('settings.version', { version: '1.0' })}
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
                {t('settings.profile')}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                {t('settings.notifications')}
              </TabsTrigger>
              <TabsTrigger value="interface" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('settings.interface')}
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
              <CardTitle>{t('settings.interfaceSettings')}</CardTitle>
              <CardDescription>
                {t('settings.interfaceDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.language')}</Label>
                  <p className="text-sm text-gray-500">{t('settings.languageDescription')}</p>
                </div>
                <LanguageSelectorDetailed />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t('settings.compactMode')}</Label>
                  <p className="text-sm text-gray-500">{t('settings.compactModeDescription')}</p>
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
                  <Label>{t('settings.showTips')}</Label>
                  <p className="text-sm text-gray-500">{t('settings.showTipsDescription')}</p>
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
                  {saving ? t('settings.saving') : t('settings.saveInterface')}
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