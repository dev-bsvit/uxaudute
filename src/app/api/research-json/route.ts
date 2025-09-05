import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'

export async function POST(request: NextRequest) {
  try {
    const { url, screenshot, context } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем JSON-структурированный промпт
    const jsonPrompt = await loadJSONPrompt()
    const finalPrompt = combineWithContext(jsonPrompt, context)

    if (url) {
      // Реальный анализ через OpenAI
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      
      try {
        const parsedResult = JSON.parse(result) as StructuredAnalysisResponse
        return NextResponse.json({ 
          success: true,
          data: parsedResult,
          format: 'json'
        })
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json({
          success: false,
          error: 'Ошибка парсинга JSON ответа',
          rawResponse: result
        }, { status: 500 })
      }
    }

    if (screenshot) {
      // Реальный анализ скриншота через GPT-4o Vision
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: finalPrompt
              },
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
        max_tokens: 3000,
        response_format: { type: "json_object" }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      
      try {
        const parsedResult = JSON.parse(result) as StructuredAnalysisResponse
        return NextResponse.json({ 
          success: true,
          data: parsedResult,
          format: 'json'
        })
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json({
          success: false,
          error: 'Ошибка парсинга JSON ответа',
          rawResponse: result
        }, { status: 500 })
      }
    }

    return NextResponse.json(
      { error: 'Не удалось выполнить анализ' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Ошибка в research-json API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

/**
 * Загружает JSON-структурированный промпт из файла
 */
async function loadJSONPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), 'prompts', 'json-structured-prompt.md')
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки JSON промпта:', error)
    // Возвращаем fallback промпт
    return getFallbackJSONPrompt()
  }
}

/**
 * Объединяет JSON промпт с контекстом
 */
function combineWithContext(jsonPrompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return jsonPrompt
  }

  return `${jsonPrompt}

## Дополнительный контекст
${context}

Учти этот контекст при анализе и адаптируй вопросы под специфику бизнеса и аудитории.`
}

/**
 * Fallback JSON промпт на случай ошибки загрузки файла
 */
function getFallbackJSONPrompt(): string {
  return `Отвечай ТОЛЬКО в формате JSON. Проанализируй интерфейс и верни структурированный ответ:

{
  "screenDescription": {
    "screenType": "string",
    "userGoal": "string", 
    "keyElements": ["string"],
    "confidence": number,
    "confidenceReason": "string"
  },
  "uxSurvey": {
    "questions": [
      {
        "id": number,
        "question": "string",
        "options": ["A) ...", "B) ...", "C) ..."],
        "scores": [number, number, number],
        "confidence": number
      }
    ],
    "overallConfidence": number
  },
  "problemsAndSolutions": [
    {
      "element": "string",
      "problem": "string",
      "principle": "string",
      "consequence": "string", 
      "recommendation": "string",
      "expectedEffect": "string",
      "priority": "high|medium|low"
    }
  ],
  "selfCheck": {
    "checklist": {
      "coversAllElements": boolean,
      "noContradictions": boolean,
      "principlesJustified": boolean,
      "actionClarity": boolean
    },
    "confidence": {
      "analysis": number,
      "survey": number,
      "recommendations": number
    }
  },
  "metadata": {
    "timestamp": "string",
    "version": "string",
    "model": "string"
  }
}`
}
