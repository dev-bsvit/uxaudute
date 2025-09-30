import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

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

    // Простой промпт без сложных систем
    const isRussian = language === 'ru' || request.headers.get('accept-language')?.includes('ru')
    
    const basePrompt = isRussian ? 
      `Ты опытный UX-дизайнер-исследователь. Анализируй интерфейс и возвращай результат в JSON формате.

**КРИТИЧЕСКИ ВАЖНО: 
1. Отвечай ТОЛЬКО в JSON формате
2. НЕ добавляй никакого текста до или после JSON
3. НЕ оборачивай JSON в markdown блоки
4. Начинай ответ с { и заканчивай }
5. Используй эту структуру: {"screenDescription": {"screenType": "...", "userGoal": "...", "keyElements": [], "confidence": 85}, "uxSurvey": {"questions": [], "overallConfidence": 85}, "problemsAndSolutions": [], "metadata": {}}**

Отвечай на русском языке.` :
      `You are an experienced UX designer-researcher. Analyze the interface and return the result in JSON format.

**CRITICALLY IMPORTANT: 
1. Respond ONLY in JSON format
2. Do NOT add any text before or after JSON
3. Do NOT wrap JSON in markdown blocks
4. Start response with { and end with }
5. Use this structure: {"screenDescription": {"screenType": "...", "userGoal": "...", "keyElements": [], "confidence": 85}, "uxSurvey": {"questions": [], "overallConfidence": 85}, "problemsAndSolutions": [], "metadata": {}}**

Respond in English.`

    let finalPrompt = basePrompt
    if (context) {
      const contextLabel = isRussian ? '\n\nДополнительный контекст:\n' : '\n\nAdditional context:\n'
      finalPrompt = `${basePrompt}${contextLabel}${context}`
    }

    console.log('🔍 Simple prompt ready, length:', finalPrompt.length)

    let analysisResult: string | null = null

    if (url) {
      // Анализ URL
      console.log('🔍 Analyzing URL:', url)
      const urlInstruction = isRussian
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


