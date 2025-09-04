'use client'

import { Layout } from '@/components/layout'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MacbookScrollDemo } from '@/components/macbook-demo'
import { HeroSection } from '@/components/hero-section'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react'

export default function HomePage() {
  // Версия 1.1 - обновленная структура
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-blue-600" />,
      title: "GPT-4 Анализ",
      description: "Мощный ИИ анализирует ваши интерфейсы на основе эвристик Нильсена и WCAG 2.2"
    },
    {
      icon: <Shield className="w-8 h-8 text-green-600" />,
      title: "Методологии UX",
      description: "Основано на проверенных принципах: Fitts' Law, Hick-Hyman, ISO 9241"
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-purple-600" />,
      title: "Детальные отчеты",
      description: "Структурированные рекомендации с процентными оценками и планами улучшения"
    },
    {
      icon: <Users className="w-8 h-8 text-orange-600" />,
      title: "Управление проектами",
      description: "Организуйте свои исследования, сохраняйте историю и отслеживайте прогресс"
    }
  ]

  return (
    <Layout transparentHeader={true}>
      {/* Hero секция с градиентом на всю ширину */}
      <HeroSection />
      
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Macbook Scroll Demo */}
          <div className="py-20">
            <MacbookScrollDemo />
          </div>

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
                Готовы улучшить пользовательский опыт?
              </h2>
              <p className="text-lg text-slate-600 mb-8">
                Начните анализ своих интерфейсов прямо сейчас. Войдите в систему и создайте свой первый проект.
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Начать бесплатно
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}