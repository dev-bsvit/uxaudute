import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { promptService } from '@/lib/i18n/prompt-service'
import { PromptType } from '@/lib/i18n/types'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH API called ===')
    const { url, screenshot, context, language } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Определяем язык (простая логика)
    const detectedLanguage = language || 
      request.headers.get('accept-language')?.includes('ru') ? 'ru' : 'en'
    
    console.log(`🌐 Using language: ${detectedLanguage}`)

    // Загружаем промпт
    console.log(`🔍 Loading prompt for language: ${detectedLanguage}`)
    let mainPrompt = await promptService.loadPrompt(PromptType.JSON_STRUCTURED, detectedLanguage)
    
    // Объединяем с контекстом
    let finalPrompt = promptService.combineWithContext(mainPrompt, context, detectedLanguage)

    console.log('🔍 Final prompt ready, length:', finalPrompt.length)

    let analysisResult: string | null = null

    if (url) {
      // Анализ URL
      console.log('🔍 Analyzing URL:', url)
      const urlInstruction = detectedLanguage === 'ru'
        ? `\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
        : `\n\nAnalyze the website at URL: ${url}\n\nSince I cannot get a screenshot, conduct analysis based on general UX principles for this type of website.`
      
      const analysisPrompt = finalPrompt + urlInstruction
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      })

      analysisResult = completion.choices[0]?.message?.content || null
    }

    if (screenshot) {
      // Анализ скриншота
      console.log('🔍 Analyzing screenshot')
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: finalPrompt },
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
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: "json_object" }
      })

      analysisResult = completion.choices[0]?.message?.content || null
    }

    // Проверяем что получили результат
    if (!analysisResult) {
      console.error('❌ No analysis result received')
      return NextResponse.json(
        { error: 'Не удалось получить результат анализа' },
        { status: 500 }
      )
    }

    console.log('✅ Analysis completed successfully')

    return NextResponse.json({ 
      result: analysisResult
    })

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


