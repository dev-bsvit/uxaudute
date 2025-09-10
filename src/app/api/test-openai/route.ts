import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    console.log('=== Тестируем OpenAI API ===')
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Ты опытный UX-дизайнер. Отвечай только в формате JSON.'
        },
        {
          role: 'user',
          content: 'Проанализируй этот экран и верни JSON с полем "screenType" и "userGoal".'
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const result = response.choices[0]?.message?.content || '{}'
    console.log('OpenAI test response:', result)
    
    return NextResponse.json({
      success: true,
      response: result,
      length: result.length
    })
    
  } catch (error) {
    console.error('OpenAI test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

