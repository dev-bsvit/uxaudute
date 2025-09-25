import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { promptService } from '@/lib/i18n/prompt-service'
import { PromptType } from '@/lib/i18n/types'

export async function POST(request: NextRequest) {
  try {
    const { url, screenshot, context, language = 'ru' } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем основной промпт для выбранного языка и объединяем с контекстом
    const mainPrompt = await promptService.loadPrompt(PromptType.MAIN, language)
    const finalPrompt = promptService.combineWithContext(mainPrompt, context, language)

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


