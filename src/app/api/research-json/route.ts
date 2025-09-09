import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { url, screenshot, context, auditId } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем JSON-структурированный промпт
    const jsonPrompt = await loadJSONPrompt()
    const finalPrompt = combineWithContext(jsonPrompt, context)

    let analysisResult: StructuredAnalysisResponse

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
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json({
          success: false,
          error: 'Ошибка парсинга JSON ответа',
          rawResponse: result
        }, { status: 500 })
      }
    } else if (screenshot) {
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
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json({
          success: false,
          error: 'Ошибка парсинга JSON ответа',
          rawResponse: result
        }, { status: 500 })
      }
    } else {
      return NextResponse.json(
        { error: 'Не удалось выполнить анализ' },
        { status: 400 }
      )
    }

    // Валидируем опрос (с проверкой на существование)
    let surveyValidation: { isValid: boolean; errors: string[] } = { isValid: true, errors: [] }
    let surveyAnalysis = { totalQuestions: 0, averageConfidence: 0, criticalIssues: 0 }
    
    if (analysisResult.uxSurvey && analysisResult.uxSurvey.questions) {
      try {
        surveyValidation = validateSurvey(analysisResult.uxSurvey)
        if (!surveyValidation.isValid) {
          console.warn('Предупреждения валидации опроса:', surveyValidation.errors)
        }
        surveyAnalysis = analyzeSurveyResults(analysisResult.uxSurvey)
      } catch (validationError) {
        console.warn('Ошибка валидации опроса:', validationError)
        surveyValidation = { isValid: false, errors: ['Ошибка валидации опроса'] }
      }
    } else {
      console.warn('uxSurvey не найден в результате анализа')
    }
    
    // Сохраняем результат в таблицу analysis_results
    let savedAnalysisId = null
    try {
      const { data: analysisData, error: analysisError } = await supabase
        .from('analysis_results')
        .insert({
          audit_id: auditId || 'temp-audit-id',
          result_type: 'ux_analysis',
          result_data: analysisResult,
          status: 'completed'
        })
        .select()
        .single()

      if (analysisError) {
        console.error('Ошибка сохранения в analysis_results:', analysisError)
        throw new Error(`Ошибка сохранения аудита в базу данных: ${analysisError.message}`)
      }
      
      savedAnalysisId = analysisData.id
      console.log('Результат анализа сохранен с ID:', savedAnalysisId)
    } catch (saveError) {
      console.error('Ошибка сохранения результата:', saveError)
      throw new Error(`Ошибка сохранения аудита в базу данных: ${saveError instanceof Error ? saveError.message : 'Неизвестная ошибка'}`)
    }

    return NextResponse.json({ 
      success: true,
      data: analysisResult,
      analysisId: savedAnalysisId,
      format: 'json',
      validation: {
        survey: surveyValidation,
        analysis: surveyAnalysis
      }
    })

  } catch (error) {
    console.error('Ошибка в research-json API:', error)
    
    // Детальная информация об ошибке для отладки
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}

/**
 * Загружает JSON-структурированный промпт из файла
 */
async function loadJSONPrompt(): Promise<string> {
  try {
    // Пробуем разные пути к файлу промпта
    const possiblePaths = [
      join(process.cwd(), 'prompts', 'json-structured-prompt.md'),
      join(process.cwd(), 'src', 'prompts', 'json-structured-prompt.md'),
      join(process.cwd(), '..', 'prompts', 'json-structured-prompt.md')
    ]
    
    let prompt = ''
    let loaded = false
    
    for (const promptPath of possiblePaths) {
      try {
        console.log('Пробуем загрузить промпт из:', promptPath)
        prompt = readFileSync(promptPath, 'utf-8')
        console.log('Промпт загружен успешно, длина:', prompt.length)
        loaded = true
        break
      } catch (pathError) {
        console.log('Не удалось загрузить из:', promptPath)
        continue
      }
    }
    
    if (!loaded) {
      throw new Error('Не удалось найти файл промпта ни по одному из путей')
    }
    
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки JSON промпта:', error)
    console.error('Используем fallback промпт')
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
        "confidence": number,
        "category": "clarity|usability|accessibility|conversion|navigation|content",
        "principle": "string",
        "explanation": "string"
      }
    ],
    "overallConfidence": number,
    "summary": {
      "totalQuestions": number,
      "averageConfidence": number,
      "criticalIssues": number,
      "recommendations": ["string"]
    }
  },
  "audience": {
    "targetAudience": "string",
    "mainPain": "string",
    "fears": ["string"]
  },
  "behavior": {
    "userScenarios": "string",
    "behavioralPatterns": "string",
    "frictionPoints": ["string"],
    "actionMotivation": "string"
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
