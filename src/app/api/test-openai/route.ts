import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST OPENAI API вызван ===')
    
    // Простой тест OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ 
        role: "user", 
        content: "Привет! Это тест. Ответь просто 'Тест прошел успешно'." 
      }],
      temperature: 0.7,
      max_tokens: 100
    })

    const result = completion.choices[0]?.message?.content || 'Нет ответа'
    console.log('OpenAI ответил:', result)
    
    return NextResponse.json({
      success: true,
      message: 'OpenAI API работает',
      response: result
    })
    
  } catch (error) {
    console.error('Ошибка в test-openai API:', error)
    return NextResponse.json({
      success: false,
      error: 'Ошибка OpenAI API',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}