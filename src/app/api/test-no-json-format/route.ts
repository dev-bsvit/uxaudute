import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { loadJSONPromptV2 } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 ТЕСТ БЕЗ response_format')
    
    const { locale = 'ru' } = await request.json()
    
    // Загружаем промпт
    const jsonPrompt = await loadJSONPromptV2(locale)
    const context = "Проанализируй экран входа в мобильное приложение банка"
    const finalPrompt = `${jsonPrompt}\n\nКонтекст: ${context}`
    
    console.log(`📏 Длина промпта: ${finalPrompt.length} символов`)
    
    // Запрос БЕЗ response_format
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: finalPrompt }],
      temperature: 0.7,
      max_tokens: 8000
      // НЕТ response_format!
    })
    
    const content = completion.choices[0]?.message?.content || 'Нет ответа'
    const finishReason = completion.choices[0]?.finish_reason
    const usage = completion.usage
    
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТА БЕЗ response_format:')
    console.log(`📏 Длина ответа: ${content.length} символов`)
    console.log(`🏁 Finish reason: ${finishReason}`)
    console.log(`📊 Usage:`, usage)
    
    // Пытаемся парсить JSON
    let parsedResult = null
    let jsonValid = false
    try {
      parsedResult = JSON.parse(content)
      jsonValid = true
      console.log('✅ JSON валиден')
      console.log('📋 Ключи в ответе:', Object.keys(parsedResult))
      
      // Подсчитываем элементы
      const questionsCount = parsedResult.uxSurvey?.questions?.length || 0
      const fearsCount = parsedResult.audience?.fears?.length || 0
      const problemsCount = parsedResult.problemsAndSolutions?.length || 0
      
      console.log(`❓ Вопросов: ${questionsCount}`)
      console.log(`😰 Страхов: ${fearsCount}`)
      console.log(`🔧 Проблем: ${problemsCount}`)
      
    } catch (error) {
      console.log('❌ JSON невалиден:', error)
    }
    
    return NextResponse.json({
      success: true,
      promptLength: finalPrompt.length,
      responseLength: content.length,
      finishReason: finishReason,
      usage: usage,
      jsonValid: jsonValid,
      parsedResult: parsedResult,
      rawResponse: content.substring(0, 1000) + '...' // Первые 1000 символов
    })
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error)
    return NextResponse.json({
      error: 'Ошибка теста',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
