'use client'

import { Layout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowRight, Zap, Shield, BarChart3, Users } from 'lucide-react'

export default function HomePage() {
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
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Hero секция */}
        <div className="text-center py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl shadow-xl">
                <span className="text-4xl">🎯</span>
              </div>
            </div>
            
            <h1 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">
              Профессиональный
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> UX Анализ</span>
            </h1>
            
            <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              Анализируйте пользовательский опыт с помощью GPT-4 на основе современных UX-методологий. 
              Получайте детальные рекомендации и структурированные отчеты для улучшения интерфейсов.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard">
                <Button size="lg" className="px-8 py-4 text-lg">
                  Начать анализ
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-2 border-slate-700 text-slate-700 hover:bg-slate-700 hover:text-white">
                  Мои проекты
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Особенности */}
        <div className="py-20 bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                Почему выбирают UX Audit?
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Современный подход к анализу пользовательского опыта с использованием ИИ и проверенных методологий
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="text-center border-0 shadow-lg hover:shadow-xl transition-shadow bg-white/70 backdrop-blur-sm">
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
    </Layout>
  )
}