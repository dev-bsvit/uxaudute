import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest } from '@/lib/ai-provider'
import { loadMainPrompt, combineWithContext } from '@/lib/prompt-loader'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH EXPERIMENTAL API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      provider = 'openai',  // По умолчанию OpenAI
      openrouterModel = 'sonoma',  // По умолчанию Sonoma для экспериментов
      auditId  // ID аудита для сохранения результата
    } = await request.json()
    
    console.log('Параметры запроса:', { 
      url: !!url, 
      screenshot: !!screenshot, 
      context: !!context,
      provider,
      openrouterModel
    })

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем основной промпт и объединяем с контекстом
    const mainPrompt = await loadMainPrompt()
    const finalPrompt = combineWithContext(mainPrompt, context)

    if (url) {
      // Анализ через выбранный AI провайдер
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const aiResponse = await executeAIRequest([
        { role: "user", content: analysisPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 2000,
        provider: provider as any,
        openrouterModel: openrouterModel as any
      })

      if (!aiResponse.success) {
        console.error('AI анализ не удался:', aiResponse.error)
        return NextResponse.json(
          { error: `Не удалось выполнить анализ через ${provider}. Попробуйте другой провайдер.` },
          { status: 500 }
        )
      }

      console.log(`✅ Анализ выполнен через ${aiResponse.provider} (${aiResponse.model})`)
      
      // Сохраняем результат в базу данных если есть auditId
      if (auditId) {
        try {
          const { error: auditUpdateError } = await supabase
            .from('audits')
            .update({
              result_data: { analysis_result: aiResponse.content },
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', auditId)
          
          if (auditUpdateError) {
            console.error('Ошибка обновления audits:', auditUpdateError)
          } else {
            console.log('✅ Аудит успешно обновлен с результатом')
          }
        } catch (saveError) {
          console.error('Ошибка сохранения результата:', saveError)
        }
      }

      return NextResponse.json({ 
        success: true,
        data: aiResponse.content,
        provider: aiResponse.provider,
        model: aiResponse.model,
        usage: aiResponse.usage,
        experimental: true
      })
    }

    if (screenshot) {
      // Анализ скриншота через выбранный AI провайдер
      console.log(`Анализируем скриншот через ${provider} (${openrouterModel})...`)
      
      // Шаг 1: Описываем что видим на картинке
      const descriptionPrompt = `Ты эксперт по UX дизайну. Внимательно изучи это изображение интерфейса и опиши:

1. Тип интерфейса (веб-сайт, мобильное приложение, дашборд и т.д.)
2. Основные элементы, которые ты видишь (заголовки, кнопки, формы, меню и т.д.)
3. Цветовую схему и визуальный стиль
4. Расположение ключевых элементов
5. Текстовый контент, который можно прочитать

Будь максимально детальным в описании. Это поможет для дальнейшего UX анализа.`

      // Для изображений пока используем только OpenAI (GPT-4o Vision)
      // TODO: Добавить поддержку изображений в OpenRouter когда будет доступно
      const descriptionResponse = await executeAIRequest([
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
      ], {
        temperature: 0.3,
        max_tokens: 1000,
        provider: 'openai'  // Принудительно OpenAI для изображений
      })

      if (!descriptionResponse.success) {
        console.error('Описание изображения не удалось:', descriptionResponse.error)
        return NextResponse.json(
          { error: 'Не удалось описать изображение. Попробуйте позже.' },
          { status: 500 }
        )
      }

      const description = descriptionResponse.content
      console.log(`✅ Описание создано через ${descriptionResponse.provider}`)
      
      // Шаг 2: Проводим UX анализ на основе описания через выбранный провайдер
      const analysisPrompt = `${finalPrompt}

Описание интерфейса из изображения:
${description}

Теперь проведи профессиональный UX анализ этого интерфейса, основываясь на описании выше.`

      const analysisResponse = await executeAIRequest([
        { role: "user", content: analysisPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 2000,
        provider: provider as any,
        openrouterModel: openrouterModel as any
      })

      if (!analysisResponse.success) {
        console.error('UX анализ не удался:', analysisResponse.error)
        return NextResponse.json(
          { error: `Не удалось выполнить UX анализ через ${provider}. Попробуйте другой провайдер.` },
          { status: 500 }
        )
      }

      const analysis = analysisResponse.content
      console.log(`✅ UX анализ выполнен через ${analysisResponse.provider}`)
      
      // Объединяем описание и анализ
      const result = `# UX Анализ интерфейса (Экспериментальный)

## Описание интерфейса
${description}

---

${analysis}`

      // Сохраняем результат в базу данных если есть auditId
      if (auditId) {
        try {
          const { error: auditUpdateError } = await supabase
            .from('audits')
            .update({
              result_data: { analysis_result: result },
              status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', auditId)
          
          if (auditUpdateError) {
            console.error('Ошибка обновления audits:', auditUpdateError)
          } else {
            console.log('✅ Аудит успешно обновлен с результатом')
          }
        } catch (saveError) {
          console.error('Ошибка сохранения результата:', saveError)
        }
      }

      return NextResponse.json({ 
        success: true,
        data: result,
        provider: analysisResponse.provider,
        model: analysisResponse.model,
        usage: analysisResponse.usage,
        experimental: true,
        note: 'Описание изображения выполнено через OpenAI, анализ через выбранный провайдер'
      })
    }

  } catch (error) {
    console.error('Research experimental API error:', error)
    
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
