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

    const prompt = `Ты Senior Growth-хакер и эксперт по A/B тестированию. Создай готовые A/B тесты на основе UX проблем.

Данные UX анализа:
${context}

Создай план A/B тестов со следующей структурой:

## A/B тесты для UX улучшений

### Тест #1: [Название проблемы]
**Проблема**: Описание из UX анализа
**Гипотеза**: Если мы изменим X, то Y улучшится на Z%
**Вариант A (контроль)**: Текущее состояние
**Вариант B (тест)**: Конкретные изменения
**Метрики**: Что измеряем (conversion, time on page, etc.)
**Размер выборки**: Сколько пользователей нужно
**Длительность**: Рекомендуемый срок теста
**Критерии успеха**: Минимальное улучшение для significance

### Тест #2: [Название следующей проблемы]
[Аналогичная структура]

### План запуска тестов
- Последовательность запуска
- Приоритизация по impact/effort
- Roadmap на 3 месяца

### Технические требования
- Необходимые инструменты (Google Optimize, Optimizely, etc.)
- Настройка трекинга
- Требования к разработке

### Risk mitigation
- Возможные негативные эффекты
- План отката
- Monitoring план

Будь максимально конкретен и готов к реализации. Отвечай на русском языке.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const result = completion.choices[0]?.message?.content || 'Не удалось создать план A/B тестов'
    return NextResponse.json({ result })

  } catch (error) {
    console.error('AB Test API error:', error)
    return NextResponse.json(
      { error: 'Не удалось создать план A/B тестов. Попробуйте позже.' },
      { status: 500 }
    )
  }
}

