'use client'

import { useState } from 'react'
import { Layout } from '@/components/layout'
import { ActionPanel } from '@/components/action-panel'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Download, Share } from 'lucide-react'
import { type ActionType } from '@/lib/utils'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Mock data
const auditData = {
  id: '1',
  name: 'Главная страница',
  projectId: '1',
  projectName: 'Интернет-магазин электроники',
  type: 'Начать исследование',
  status: 'completed',
  createdAt: '2024-01-15T10:00:00',
  result: `# Результат UX исследования

## 1. Описание экрана

Проанализирована главная страница интернет-магазина электроники. Основные элементы:
- Шапка с логотипом, поиском и корзиной
- Главный баннер с акционными предложениями  
- Каталог категорий товаров
- Блок популярных товаров
- Футер с контактной информацией

Общий layout использует стандартную структуру F-паттерна для e-commerce.

## 2. UX-опрос

1. **Понятна ли основная цель сайта пользователю с первого взгляда?**
   - Да, четко видно что это интернет-магазин электроники

2. **Легко ли найти нужную категорию товаров?**
   - Каталог расположен на видном месте, но требует доработки

3. **Удобен ли поиск по сайту?**
   - Поисковая строка заметна, но отсутствуют подсказки

4. **Вызывает ли доверие дизайн сайта?**
   - Профессиональный вид, но нужны отзывы и сертификаты

5. **Понятен ли процесс покупки?**
   - Требуется более явная кнопка "В корзину"

## 3. Проблемы и рекомендации

### Проблема 1: Низкий контраст CTA-кнопок
**Описание**: Основные кнопки имеют контраст 3.2:1
**Влияние**: Снижение конверсии, проблемы с доступностью
**Рекомендация**: Увеличить контраст до 4.5:1, изменить цвет на #0066CC

### Проблема 2: Отсутствие breadcrumbs
**Описание**: Пользователь не понимает своё местоположение на сайте
**Влияние**: Увеличение показателя отказов на 15-20%
**Рекомендация**: Добавить навигационные хлебные крошки

### Проблема 3: Мелкий шрифт в описаниях
**Описание**: Размер шрифта 12px затрудняет чтение
**Влияние**: Плохая читаемость, особенно на мобильных
**Рекомендация**: Увеличить до 16px для основного текста

### Проблема 4: Неоптимальное расположение корзины
**Описание**: Иконка корзины слишком мелкая и не заметна
**Влияние**: Пользователи не находят свои товары
**Рекомендация**: Увеличить размер, добавить счетчик товаров

## 4. Self-check

**Уверенность анализа**: 85%

**Ограничения**:
- Анализ проведен без данных о поведении пользователей
- Отсутствуют A/B тесты предыдущих изменений
- Нет информации о целевой аудитории и её предпочтениях
- Не учтены технические ограничения реализации

**Рекомендации по дополнительному исследованию**:
- Провести пользовательские интервью (5-7 человек)
- Настроить heat maps для понимания поведения
- Запустить юзабилити-тестирование критических сценариев`,
  confidence: 85
}

export default function AuditPage() {
  const params = useParams()
  const auditId = params.id
  const [activeTab, setActiveTab] = useState<'result' | 'collected' | 'expert'>('result')

  const handleAction = (action: ActionType) => {
    console.log('Action:', action)
    // TODO: Implement action handlers
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export audit')
  }

  const handleShare = () => {
    // TODO: Implement share functionality  
    console.log('Share audit')
  }

  return (
    <Layout title={`Аудит: ${auditData.name}`}>
      <div className="space-y-6">
        {/* Навигация назад и действия */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href={`/projects/${auditData.projectId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад к проекту
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {auditData.name}
              </h1>
              <p className="text-gray-600">
                {auditData.projectName} • {auditData.type}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Табы */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'result', label: 'Результат анализа' },
              { id: 'collected', label: 'Собранные данные' },
              { id: 'expert', label: 'Экспертные заключения' }
            ].map((tab) => (
                          <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Контент табов */}
        <div className="space-y-6">
          {activeTab === 'result' && (
            <Card>
              <CardContent className="pt-6">
                <div className="prose max-w-none">
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                    {auditData.result}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'collected' && (
            <Card>
              <CardHeader>
                <CardTitle>Собранные данные</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Здесь будут отображаться все предыдущие ответы ассистента, 
                  собранные в единый документ при использовании функции &quot;Собрать в один&quot;.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'expert' && (
            <Card>
              <CardHeader>
                <CardTitle>Экспертные заключения</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Результаты бизнес-аналитики, A/B тестов и созданных гипотез 
                  будут отображаться в этом разделе.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Панель действий */}
        <ActionPanel onAction={handleAction} />
      </div>
    </Layout>
  )
}
