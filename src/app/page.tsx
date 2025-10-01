'use client'

import { Layout } from '@/components/layout'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeroSection } from '@/components/hero-section'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { ensureUserHasInitialBalance } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'

export default function HomePage() {
  // Версия 1.1.2 - исправлено отображение проблем и решений
  const [mounted, setMounted] = useState(false)
  const { t } = useTranslation()
  
  useEffect(() => {
    setMounted(true)
    
    // Проверяем баланс всех авторизованных пользователей
    const checkUserBalance = async () => {
      try {
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
        
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          console.log('🔍 Главная страница: проверяем баланс пользователя', user.email, user.id)
          
          // Проверяем баланс через API
          const response = await fetch('/api/credits/balance', {
            headers: {
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            }
          })
          const data = await response.json()
          console.log('🔍 Главная страница: результат проверки баланса', data)
          
          if (data.success && data.balance === 0) {
            console.log('🔍 Главная страница: обнаружен нулевой баланс, создаем начальный баланс')
            await ensureUserHasInitialBalance(user.id)
          }
        }
      } catch (error) {
        console.error('❌ Ошибка проверки баланса на главной странице:', error)
      }
    }
    
    // Запускаем проверку через 3 секунды после загрузки страницы
    setTimeout(checkUserBalance, 3000)
    
    // Дополнительно проверяем всех новых пользователей
    setTimeout(async () => {
      try {
        console.log('🔍 Проверяем всех новых пользователей на наличие кредитов...')
        const response = await fetch('/api/ensure-all-users-have-credits', {
          method: 'POST'
        })
        const data = await response.json()
        console.log('🔍 Результат проверки всех пользователей:', data)
      } catch (error) {
        console.error('❌ Ошибка проверки всех пользователей:', error)
      }
    }, 5000)
  }, [])
  
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: t('analysis.features.gpt4Analysis.title'),
      description: t('analysis.features.gpt4Analysis.description')
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: t('analysis.features.uxMethodologies.title'),
      description: t('analysis.features.uxMethodologies.description')
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: t('analysis.features.detailedReports.title'),
      description: t('analysis.features.detailedReports.description')
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: t('analysis.features.projectManagement.title'),
      description: t('analysis.features.projectManagement.description')
    }
  ]

  return (
    <Layout transparentHeader={true}>
      {/* Hero секция с градиентом на всю ширину */}
      <HeroSection />
      
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Особенности */}
          <div className="py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {features.map((feature, index) => (
                  <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow bg-white">
                    <CardHeader>
                      <div className="flex justify-center mb-4">
                        {feature.icon}
                      </div>
                      <CardTitle className="text-xl text-slate-900">
                        {feature.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">
                        {feature.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>

          {/* CTA секция */}
          <div className="py-20 text-center">
            <div className="max-w-3xl mx-auto px-6">
              <h2 className="text-3xl font-bold text-slate-900 mb-6">
                {t('analysis.cta.title')}
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                {t('analysis.cta.description')}
              </p>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 py-4 text-lg">
                    {t('analysis.cta.startFree')}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/credits">
                  <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                    {t('analysis.cta.manageCredits')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}