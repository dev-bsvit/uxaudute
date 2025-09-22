import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest } from '@/lib/ai-provider'
import { loadJSONPromptV2 } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 DEBUG: Получаем полный ответ от GPT')
    
    const { locale = 'ru', screenshot } = await request.json()
    
    // Загружаем промпт
    const jsonPrompt = await loadJSONPromptV2(locale)
    console.log(`📏 Длина промпта: ${jsonPrompt.length} символов`)
    
    // Простой контекст для теста
    const context = "Проанализируй экран входа в мобильное приложение банка"
    const finalPrompt = `${jsonPrompt}\n\nКонтекст: ${context}`
    
    console.log(`📏 Длина финального промпта: ${finalPrompt.length} символов`)
    
    // Выполняем запрос БЕЗ обработки
    const aiResponse = await executeAIRequest([
      { role: "user", content: finalPrompt }
    ], {
      temperature: 0.7,
      max_tokens: 8000,
      provider: 'openai'
    })
    
    if (!aiResponse.success) {
      return NextResponse.json({
        error: 'AI запрос не удался',
        details: aiResponse.error
      }, { status: 500 })
    }
    
    // Возвращаем ВСЕ данные
    return NextResponse.json({
      success: true,
      // Полный сырой ответ
      rawResponse: aiResponse.content,
      rawResponseLength: aiResponse.content.length,
      
      // Метаданные
      provider: aiResponse.provider,
      model: aiResponse.model,
      usage: aiResponse.usage,
      
      // Промпт данные
      promptLength: jsonPrompt.length,
      finalPromptLength: finalPrompt.length,
      
      // Попытка парсинга JSON
      jsonParseAttempt: (() => {
        try {
          const parsed = JSON.parse(aiResponse.content)
          return {
            success: true,
            keys: Object.keys(parsed),
            questionsCount: parsed.uxSurvey?.questions?.length || 0,
            fearsCount: parsed.audience?.fears?.length || 0,
            problemsCount: parsed.problemsAndSolutions?.length || 0
          }
        } catch (error) {
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error)
          }
        }
      })(),
      
      // Первые и последние символы для проверки обрезки
      responseStart: aiResponse.content.substring(0, 200),
      responseEnd: aiResponse.content.substring(Math.max(0, aiResponse.content.length - 200)),
      
      // Проверка на обрезку
      isTruncated: !aiResponse.content.endsWith('}'),
      endsWithBrace: aiResponse.content.endsWith('}')
    })
    
  } catch (error) {
    console.error('❌ Ошибка debug:', error)
    return NextResponse.json({
      error: 'Ошибка debug',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
