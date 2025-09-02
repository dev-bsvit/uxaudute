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

    const prompt = `Ты Senior UX-аналитик. Объедини все данные из предыдущего анализа в структурированный отчет.

Предыдущий анализ:
${context}

Создай объединенный отчет со следующей структурой:

## Объединенный UX отчет

### Исполнительное резюме
- Ключевые выводы (3-4 пункта)
- Приоритетные проблемы
- Рекомендуемые действия

### Детальный анализ
- Основные находки по категориям
- Количественные метрики из опросов
- Приоритизация проблем (высокая/средняя/низкая)

### План действий
- Краткосрочные улучшения (1-2 недели)
- Среднесрочные улучшения (1-2 месяца)  
- Долгосрочные улучшения (3+ месяца)

### Ожидаемые результаты
- Метрики для отслеживания
- Ожидаемые улучшения KPI

Будь конкретен и структурирован. Отвечай на русском языке.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content || 'Не удалось создать объединенный отчет'
    return NextResponse.json({ result })

  } catch (error) {
    console.error('Collect API error:', error)
    return NextResponse.json(
      { error: 'Не удалось объединить данные. Попробуйте позже.' },
      { status: 500 }
    )
  }
}
