import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest } from '@/lib/ai-provider'
import { loadJSONPromptV2 } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 ТЕСТ ИСПОЛЬЗОВАНИЯ ТОКЕНОВ')
    
    const { locale = 'ru' } = await request.json()
    
    // Загружаем промпт
    const jsonPrompt = await loadJSONPromptV2(locale)
    console.log(`📏 Длина промпта: ${jsonPrompt.length} символов`)
    
    // Простой контекст для теста
    const context = "Проанализируй экран входа в мобильное приложение банка"
    const finalPrompt = `${jsonPrompt}\n\nКонтекст: ${context}`
    
    console.log(`📏 Длина финального промпта: ${finalPrompt.length} символов`)
    
    // Выполняем запрос
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
    
    // Анализируем результат
    const responseLength = aiResponse.content.length
    const usage = aiResponse.usage
    
    console.log('📊 РЕЗУЛЬТАТЫ ТЕСТА:')
    console.log(`📏 Длина ответа: ${responseLength} символов`)
    console.log(`📊 Использование токенов:`, usage)
    
    // Пытаемся парсить JSON
    let parsedResult = null
    try {
      parsedResult = JSON.parse(aiResponse.content)
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
      promptLength: jsonPrompt.length,
      finalPromptLength: finalPrompt.length,
      responseLength: responseLength,
      usage: usage,
      jsonValid: parsedResult !== null,
      parsedResult: parsedResult,
      rawResponse: aiResponse.content.substring(0, 500) + '...' // Первые 500 символов
    })
    
  } catch (error) {
    console.error('❌ Ошибка теста:', error)
    return NextResponse.json({
      error: 'Ошибка теста',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
