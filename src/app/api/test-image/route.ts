import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { screenshot } = await request.json()
    
    console.log('=== Тестируем OpenAI с изображением ===')
    console.log('Screenshot URL:', screenshot)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Опиши что ты видишь на этом изображении. Отвечай только в формате JSON с полями "description" и "elements".'
            },
            {
              type: 'image_url',
              image_url: {
                url: screenshot,
                detail: 'high'
              }
            }
          ]
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })

    const result = response.choices[0]?.message?.content || '{}'
    console.log('OpenAI response:', result)
    
    return NextResponse.json({
      success: true,
      response: result,
      length: result.length
    })
    
  } catch (error) {
    console.error('Test image error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}







