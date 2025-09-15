import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { context, userId } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Контекст обязателен для анализа' },
        { status: 400 }
      )
    }

    // Проверяем и списываем кредиты для A/B теста
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Используем тестового пользователя если userId не передан
    const testUserId = userId || 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'
    const abTestCost = 1 // A/B тест стоит 1 кредит

    // Проверяем баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', testUserId)
      .single()

    if (balanceError) {
      console.error('Error checking balance:', balanceError)
      return NextResponse.json(
        { error: 'Ошибка проверки баланса кредитов' },
        { status: 500 }
      )
    }

    const currentBalance = balanceData?.balance || 0

    if (currentBalance < abTestCost) {
      return NextResponse.json(
        { 
          error: 'Недостаточно кредитов для проведения A/B теста',
          required: abTestCost,
          available: currentBalance,
          message: 'Пополните баланс кредитов для продолжения'
        },
        { status: 402 } // Payment Required
      )
    }

    // Списываем кредиты напрямую
    const newBalance = currentBalance - abTestCost
    
    const { error: updateError } = await supabaseClient
      .from('user_balances')
      .update({ balance: newBalance })
      .eq('user_id', testUserId)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return NextResponse.json(
        { error: 'Ошибка списания кредитов' },
        { status: 500 }
      )
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: testUserId,
        type: 'debit',
        amount: -abTestCost,
        balance_after: newBalance,
        source: 'ab_test',
        description: 'A/B тестирование'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json(
        { error: 'Ошибка создания транзакции' },
        { status: 500 }
      )
    }

    console.log(`✅ Списано ${abTestCost} кредитов для A/B теста. Новый баланс: ${newBalance}`)

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
