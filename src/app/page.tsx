'use client'

import { Layout } from '@/components/layout'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HeroSection } from '@/components/ui/hero-section'
import { Section } from '@/components/ui/section'
import { PageContent } from '@/components/ui/page-content'
import { FeatureGrid } from '@/components/ui/feature-grid'
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
      <HeroSection 
        title="UX Audit Platform"
        description="Профессиональный анализ пользовательского опыта с использованием ИИ"
      />
      
      <Section background="default">
        <PageContent maxWidth="6xl">
          {/* Особенности */}
          <FeatureGrid columns={4}>
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </FeatureGrid>
        </PageContent>
      </Section>

      {/* CTA секция */}
      <Section background="muted" spacing="xl">
        <PageContent maxWidth="3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">
              Готовы улучшить пользовательский опыт?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Начните анализ своих интерфейсов прямо сейчас. Войдите в систему и создайте свой первый проект.
            </p>
            <Link href="/dashboard">
              <Button size="lg" className="px-8 py-4 text-lg">
                Начать бесплатно
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </PageContent>
      </Section>
    </Layout>
  )
}