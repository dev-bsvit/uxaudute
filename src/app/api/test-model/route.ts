import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// POST /api/test-model - Тестировать конкретную модель
export async function POST(request: NextRequest) {
  try {
    const { model, prompt, max_tokens = 100 } = await request.json()

    if (!model) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Model ID is required' 
        },
        { status: 400 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured' 
        },
        { status: 500 }
      )
    }

    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    })

    console.log(`🧪 Тестируем модель: ${model}`)

    const startTime = Date.now()

    // Тестируем модель
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { 
          role: "user", 
          content: prompt || "Привет! Это тест модели. Ответь кратко." 
        }
      ],
      max_tokens: max_tokens,
      temperature: 0.7
    })

    const endTime = Date.now()
    const responseTime = endTime - startTime

    const result = completion.choices[0]?.message?.content || 'No response'

    console.log(`✅ Модель ${model} ответила за ${responseTime}ms`)

    return NextResponse.json({
      success: true,
      model: model,
      response: result,
      response_time_ms: responseTime,
      tokens_used: completion.usage?.total_tokens || 0,
      prompt_tokens: completion.usage?.prompt_tokens || 0,
      completion_tokens: completion.usage?.completion_tokens || 0,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error(`❌ Ошибка тестирования модели:`, error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to test model',
      details: error instanceof Error ? error.message : 'Unknown error',
      model: request.body ? JSON.parse(request.body).model : 'unknown',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
