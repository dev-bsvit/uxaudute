import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    console.log('=== BUSINESS WITH CREDITS API вызван ===')
    const { context, auditId } = await request.json()

    if (!context) {
      return NextResponse.json(
        { error: 'Контекст обязателен для анализа' },
        { status: 400 }
      )
    }

    // Получаем пользователя из заголовков для проверки кредитов
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем кредиты перед запуском бизнес анализа
    console.log('🔍 Проверяем кредиты для пользователя:', user.id)
    console.log('🔍 Тип аудита: business')
    
    const creditsCheck = await checkCreditsForAudit(user.id, 'business')
    console.log('🔍 Результат проверки кредитов:', JSON.stringify(creditsCheck, null, 2))
    
    if (!creditsCheck.canProceed) {
      console.log('❌ Недостаточно кредитов:', creditsCheck)
      return NextResponse.json({
        error: 'Insufficient credits',
        message: creditsCheck.message,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance,
        is_test_account: creditsCheck.isTestAccount
      }, { status: 402 }) // 402 Payment Required
    }

    console.log('✅ Кредиты проверены успешно:', creditsCheck)

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

    // Сохраняем результат бизнес аналитики в базу данных
    if (auditId) {
      try {
        console.log('Сохраняем результат бизнес аналитики в базу:', auditId)
        
        // Получаем текущие данные аудита
        const { data: currentAudit, error: fetchError } = await supabase
          .from('audits')
          .select('result_data')
          .eq('id', auditId)
          .single()

        if (fetchError) {
          console.error('Ошибка получения данных аудита:', fetchError)
        } else {
          // Обновляем result_data с бизнес аналитикой
          const { error: updateError } = await supabase
            .from('audits')
            .update({
              result_data: {
                ...currentAudit?.result_data,
                business_analytics: { result }
              }
            })
            .eq('id', auditId)

          if (updateError) {
            console.error('Ошибка сохранения бизнес аналитики:', updateError)
          } else {
            console.log('✅ Бизнес аналитика успешно сохранена в базу')
          }
        }
      } catch (saveError) {
        console.error('Ошибка при сохранении бизнес аналитики:', saveError)
      }
    }

    // Списываем кредиты после успешного выполнения бизнес анализа
    if (auditId) {
      console.log('Списываем кредиты за бизнес анализ:', auditId)
      const deductResult = await deductCreditsForAudit(
        user.id,
        'business',
        auditId,
        `Business analytics for audit: ${auditId}`
      )

      if (!deductResult.success) {
        console.error('Ошибка списания кредитов:', deductResult)
        // Не прерываем выполнение, так как анализ уже выполнен
      } else {
        console.log('✅ Кредиты успешно списаны:', deductResult)
      }
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({ 
      result,
      credits_info: {
        deducted: auditId ? true : false,
        is_test_account: creditsCheck.isTestAccount,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance
      }
    })

  } catch (error) {
    console.error('Ошибка в business-with-credits API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
