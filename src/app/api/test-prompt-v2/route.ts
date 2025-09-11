import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, context, targetAudience } = await request.json()

    if (!imageUrl) {
      return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
    }

    // Загружаем новый промпт
    const fs = require('fs')
    const path = require('path')
    const promptPath = path.join(process.cwd(), 'prompts', 'json-structured-prompt-v2.md')
    const prompt = fs.readFileSync(promptPath, 'utf8')

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

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 4000,
      temperature: 0.3,
    })

    const analysisResult = response.choices[0]?.message?.content

    if (!analysisResult) {
      throw new Error('No analysis result received')
    }

    // Парсим JSON ответ
    let parsedResult
    try {
      parsedResult = JSON.parse(analysisResult)
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError)
      return NextResponse.json({ 
        error: 'Failed to parse AI response as JSON',
        rawResponse: analysisResult 
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
