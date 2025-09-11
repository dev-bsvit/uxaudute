import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    console.log('Test-prompt-v2 API called')
    const { imageUrl, context, targetAudience } = await request.json()
    console.log('Request data:', { imageUrl: imageUrl?.substring(0, 50) + '...', context, targetAudience })

    if (!imageUrl) {
      console.log('Error: No image URL provided')
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Загружаем новый промпт
    const promptPath = path.join(process.cwd(), 'prompts', 'json-structured-prompt-v2.md')
    console.log('Loading prompt from:', promptPath)
    const prompt = fs.readFileSync(promptPath, 'utf8')
    console.log('Prompt loaded, length:', prompt.length)

    // Формируем сообщение для AI
    const messages = [
      {
        role: 'system' as const,
        content: prompt
      },
      {
        role: 'user' as const,
        content: [
          {
            type: 'text' as const,
            text: `Проанализируй этот скриншот интерфейса. ${context ? `Контекст: ${context}` : ''} ${targetAudience ? `Целевая аудитория: ${targetAudience}` : ''}`
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

    console.log('Sending request to OpenAI...')
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 4000,
      temperature: 0.3,
    })
    console.log('OpenAI response received')

    const analysisResult = response.choices[0]?.message?.content

    if (!analysisResult) {
      throw new Error('No analysis result received')
    }

    // Парсим JSON ответ
    let parsedResult
    try {
      // Пытаемся найти JSON в ответе (может быть обернут в markdown или иметь дополнительный текст)
      let jsonString = analysisResult.trim()
      
      // Убираем markdown блоки если есть
      if (jsonString.includes('```json')) {
        const jsonMatch = jsonString.match(/```json\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonString = jsonMatch[1]
        }
      } else if (jsonString.includes('```')) {
        const jsonMatch = jsonString.match(/```\s*([\s\S]*?)\s*```/)
        if (jsonMatch) {
          jsonString = jsonMatch[1]
        }
      }
      
      // Ищем JSON объект в тексте
      const jsonStart = jsonString.indexOf('{')
      const jsonEnd = jsonString.lastIndexOf('}')
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        jsonString = jsonString.substring(jsonStart, jsonEnd + 1)
      }
      
      parsedResult = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      console.error('Raw response:', analysisResult)
      return NextResponse.json({ 
        error: 'Failed to parse AI response as JSON',
        rawResponse: analysisResult,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown parse error'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      version: 'v2',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in test-prompt-v2:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
