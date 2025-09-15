import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { loadMainPrompt, combineWithContext } from '@/lib/prompt-loader'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { url, screenshot, context, userId } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Проверяем и списываем кредиты для UX аудита
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Используем тестового пользователя если userId не передан
    const testUserId = userId || 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'
    const auditCost = 2 // Основной аудит стоит 2 кредита

    // Проверяем баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .rpc('get_user_balance', { user_uuid: testUserId })

    if (balanceError) {
      console.error('Error checking balance:', balanceError)
      return NextResponse.json(
        { error: 'Ошибка проверки баланса кредитов' },
        { status: 500 }
      )
    }

    const currentBalance = balanceData || 0

    if (currentBalance < auditCost) {
      return NextResponse.json(
        { 
          error: 'Недостаточно кредитов для проведения аудита',
          required: auditCost,
          available: currentBalance,
          message: 'Пополните баланс кредитов для продолжения'
        },
        { status: 402 } // Payment Required
      )
    }

    // Списываем кредиты
    const { data: deductResult, error: deductError } = await supabaseClient
      .rpc('deduct_credits', {
        user_uuid: testUserId,
        amount: auditCost,
        source: 'audit',
        description: 'UX аудит интерфейса'
      })

    if (deductError || !deductResult) {
      console.error('Error deducting credits:', deductError)
      return NextResponse.json(
        { error: 'Ошибка списания кредитов' },
        { status: 500 }
      )
    }

    console.log(`✅ Списано ${auditCost} кредитов для UX аудита. Новый баланс: ${currentBalance - auditCost}`)

    // Загружаем основной промпт и объединяем с контекстом
    const mainPrompt = await loadMainPrompt()
    const finalPrompt = combineWithContext(mainPrompt, context)

    if (url) {
      // Реальный анализ через OpenAI
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const result = completion.choices[0]?.message?.content || 'Не удалось получить анализ'
      return NextResponse.json({ result })
    }

    if (screenshot) {
      // Реальный анализ скриншота через GPT-4o Vision
      // screenshot приходит как data:image/...;base64,... строка
      
      // Шаг 1: Описываем что видим на картинке
      const descriptionPrompt = `Ты эксперт по UX дизайну. Внимательно изучи это изображение интерфейса и опиши:

1. Тип интерфейса (веб-сайт, мобильное приложение, дашборд и т.д.)
2. Основные элементы, которые ты видишь (заголовки, кнопки, формы, меню и т.д.)
3. Цветовую схему и визуальный стиль
4. Расположение ключевых элементов
5. Текстовый контент, который можно прочитать

Будь максимально детальным в описании. Это поможет для дальнейшего UX анализа.`

      const descriptionCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: descriptionPrompt },
              {
                type: "image_url",
                image_url: {
                  url: screenshot,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.3,
        max_tokens: 1000,
      })

      const description = descriptionCompletion.choices[0]?.message?.content || 'Не удалось описать изображение'
      
      // Шаг 2: Проводим UX анализ на основе описания
      const analysisPrompt = `${finalPrompt}

Описание интерфейса из изображения:
${description}

Теперь проведи профессиональный UX анализ этого интерфейса, основываясь на описании выше.`

      const analysisCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const analysis = analysisCompletion.choices[0]?.message?.content || 'Не удалось получить анализ'
      
      // Объединяем описание и анализ
      const result = `# UX Анализ интерфейса

## Описание интерфейса
${description}

---

${analysis}`

      return NextResponse.json({ result })
    }

  } catch (error) {
    console.error('Research API error:', error)
    
    // Детальная информация об ошибке для отладки
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Не удалось выполнить анализ. Попробуйте позже.' },
      { status: 500 }
    )
  }
}


