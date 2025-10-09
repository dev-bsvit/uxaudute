'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import CreditsBalance from '@/components/CreditsBalance'
import CreditsPurchase from '@/components/CreditsPurchase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { CreditCard, TrendingUp, History, Info } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export default function CreditsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshBalance, setRefreshBalance] = useState(0)
  const { t } = useTranslation()

  // Используем реального пользователя
  const userId = user?.id

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

  const handlePurchaseComplete = () => {
    setRefreshBalance(prev => prev + 1)
  }

  const auditTypeItems = [
    { key: 'main', badge: 'main' },
    { key: 'additional', badge: 'additional' },
    { key: 'business', badge: 'business' },
    { key: 'abTest', badge: 'abTest' }
  ] as const

  const featureItems = ['graceLimit', 'noExpiry', 'testAccounts', 'teamAccounts'] as const

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
              {t('components.creditsPage.loginTitle')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('components.creditsPage.loginDescription')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <PageHeader
          breadcrumbs={[
            { label: 'Главная', href: '/home' },
            { label: t('components.creditsPage.title') }
          ]}
          icon={<CreditCard className="w-5 h-5 text-slate-700" />}
          title={t('components.creditsPage.title')}
          subtitle={t('components.creditsPage.description')}
        />

        <div className="px-8 space-y-8">
          
          {/* Баланс кредитов */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">{t('components.credits.balanceTitle')}</CardTitle>
              <CreditCard className="h-6 w-6 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <CreditsBalance
                userId={userId}
                showTransactions={false}
                key={refreshBalance}
              />
            </CardContent>
          </Card>

          {/* Покупка кредитов */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('components.creditsPage.purchaseTitle')}
              </CardTitle>
              <CardDescription>
                {t('components.creditsPage.purchaseDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditsPurchase 
                userId={userId}
                onPurchaseComplete={handlePurchaseComplete}
              />
            </CardContent>
          </Card>

          {/* История транзакций */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                {t('components.creditsPage.historyTitle')}
              </CardTitle>
              <CardDescription>
                {t('components.creditsPage.historyDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreditsBalance
                userId={userId}
                showTransactions={true}
                key={refreshBalance}
              />
            </CardContent>
          </Card>

          {/* Информация о системе */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                {t('components.creditsPage.infoTitle')}
              </CardTitle>
              <CardDescription>
                {t('components.creditsPage.infoDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">{t('components.creditsPage.auditTypesTitle')}</h4>
                  <div className="space-y-2">
                    {auditTypeItems.map((item) => (
                      <div key={item.key} className="flex justify-between items-center p-2 bg-muted rounded">
                        <span className="text-sm">{t(`components.creditsPage.auditTypes.${item.key}` as const)}</span>
                        <Badge variant="outline">{t(`components.creditsPage.auditBadges.${item.badge}` as const)}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-3 text-foreground">{t('components.creditsPage.featuresTitle')}</h4>
                  <div className="space-y-2">
                    {featureItems.map((featureKey, index) => (
                      <div key={featureKey} className="flex items-center gap-2 p-2 bg-muted rounded">
                        <div className={`w-2 h-2 rounded-full ${['bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500'][index % 4]}`}></div>
                        <span className="text-sm">{t(`components.creditsPage.features.${featureKey}` as const)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Статус системы */}
          <div className="text-center">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              {t('components.creditsPage.statusActive')}
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
