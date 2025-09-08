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

    const prompt = `Ты Senior Product Manager и эксперт по созданию продуктовых гипотез. Создай продуктовые гипотезы на основе UX проблем.

Данные UX анализа:
${context}

Создай гипотезы со следующей структурой:

## Продуктовые гипотезы для UX улучшений

### Гипотеза #1: [Краткое название]
**Проблема**: Из UX анализа
**Мы верим, что**: [описание решения]
**Приведет к**: [ожидаемый результат]
**Для**: [целевая аудитория]
**Мы узнаем это по**: [метрики успеха]

**ICE Score оценка**:
- Impact (Влияние): X/10
- Confidence (Уверенность): X/10  
- Ease (Простота): X/10
- **Общий балл**: XX/30

**План валидации**:
- MVP для тестирования
- Способы измерения
- Критерии принятия/отклонения

### Гипотеза #2: [Название]
[Аналогичная структура]

### Roadmap гипотез
- Последовательность тестирования
- Зависимости между гипотезами
- Timeline на квартал

### Success Metrics Framework
- North Star метрика
- Leading indicators
- Lagging indicators
- Guardrail метрики

### Learning Agenda
- Ключевые вопросы для исследования
- Методы сбора данных (аналитика, интервью, опросы)
- План итераций

Используй фреймворки Lean Startup и Jobs-to-be-Done. Отвечай на русском языке.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content || 'Не удалось создать гипотезы'
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Hypotheses API error:', error)
    return NextResponse.json(
      { error: 'Не удалось создать гипотезы. Попробуйте позже.' },
      { status: 500 }
    )
  }
}



