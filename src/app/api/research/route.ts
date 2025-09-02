import { NextRequest, NextResponse } from 'next/server'
import { openai, UX_RESEARCH_PROMPT } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const { url, screenshot } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    if (url) {
      // Реальный анализ через OpenAI
      const analysisPrompt = `${UX_RESEARCH_PROMPT}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const result = completion.choices[0]?.message?.content || 'Не удалось получить анализ'
      return NextResponse.json({ result })
    }

    if (screenshot) {
      // Реальный анализ скриншота через GPT-4o Vision
      // screenshot приходит как data:image/...;base64,... строка
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: UX_RESEARCH_PROMPT },
              {
                type: "image_url",
                image_url: {
                  url: screenshot,
                  detail: "high"
                }
              }
            ]
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const result = completion.choices[0]?.message?.content || 'Не удалось получить анализ'
      return NextResponse.json({ result })
    }

  } catch (error) {
    console.error('Research API error:', error)
    return NextResponse.json(
      { error: 'Не удалось выполнить анализ. Попробуйте позже.' },
      { status: 500 }
    )
  }
}


