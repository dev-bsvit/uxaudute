import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { context } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Контекст обязателен для анализа' },
        { status: 400 }
      )
    }

    const prompt = `Ты Senior бизнес-аналитик с экспертизой в UX и продуктовой аналитике. Проанализируй UX проблемы с точки зрения бизнеса.

Данные UX анализа:
${context}

Создай бизнес-аналитику со следующей структурой:

## Бизнес-анализ UX проблем

### Влияние на бизнес-метрики
- Конверсия: влияние на conversion rate
- Retention: влияние на удержание пользователей
- Revenue: влияние на доходы
- CAC/LTV: влияние на стоимость привлечения и жизненную ценность

### ROI анализ улучшений
- Стоимость реализации (высокая/средняя/низкая)
- Ожидаемый эффект (%)
- Срок окупаемости
- Risk/Reward соотношение

### Приоритизация по RICE
Для каждой проблемы:
- Reach (охват): сколько пользователей затронуто
- Impact (влияние): насколько критично
- Confidence (уверенность): процент уверенности в успехе
- Effort (усилия): сложность реализации
- RICE Score: итоговый балл

### Рекомендации для продуктового роста
- Quick wins (быстрые победы)
- Strategic improvements (стратегические улучшения)
- Эксперименты для валидации

Используй количественные оценки там, где возможно. Отвечай на русском языке.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content || 'Не удалось создать бизнес-анализ'
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Business API error:', error)
    return NextResponse.json(
      { error: 'Не удалось выполнить бизнес-анализ. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

