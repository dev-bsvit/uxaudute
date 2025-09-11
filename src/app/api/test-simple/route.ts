import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Test-simple API called')
    const { imageUrl, context, targetAudience } = await request.json()
    console.log('Request data received')

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Простой промпт для тестирования
    const simplePrompt = `Ты UX-аналитик. Проанализируй изображение и верни JSON в формате:
{
  "screenType": "тип экрана",
  "mainProblems": ["проблема 1", "проблема 2"],
  "recommendations": ["рекомендация 1", "рекомендация 2"],
  "confidence": 85
}

Отвечай ТОЛЬКО JSON, без дополнительного текста.`

    const messages = [
      {
        role: 'system' as const,
        content: simplePrompt
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Проанализируй это изображение. ${context ? `Контекст: ${context}` : ''} ${targetAudience ? `Аудитория: ${targetAudience}` : ''}`
          },
          {
            type: 'image_url' as const,
            image_url: {
              url: imageUrl,
              detail: 'high' as const
            }
          }
        ]
      }
    ]

    console.log('Sending to OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 1000,
      temperature: 0.3,
    })
    console.log('OpenAI response received')

    const analysisResult = response.choices[0]?.message?.content
    console.log('Analysis result length:', analysisResult?.length)

    if (!analysisResult) {
      throw new Error('No analysis result received')
    }

    // Простой парсинг JSON
    let parsedResult
    try {
      // Ищем JSON в ответе
      let jsonString = analysisResult.trim()
      const jsonStart = jsonString.indexOf('{')
      const jsonEnd = jsonString.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1)
      }
      
      parsedResult = JSON.parse(jsonString)
      console.log('JSON parsed successfully')
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse AI response as JSON',
        rawResponse: analysisResult,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      version: 'simple-test',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in test-simple:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
