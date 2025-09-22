import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { readFileSync } from 'fs'
import { join } from 'path'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { loadJSONPromptV2 } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('=== OpenAI API вызван ===')
    const { url, screenshot, context, auditId, locale = 'ru' } = await request.json()
    console.log('Параметры запроса:', { url: !!url, screenshot: !!screenshot, context: !!context, auditId, locale })
    console.log('🌍 RESEARCH-JSON API вызван для локали:', locale)

    if (!url && !screenshot) {
      console.log('Ошибка: нет URL или скриншота')
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем JSON-структурированный промпт
    console.log('Загружаем промпт для локали:', locale)
    const jsonPrompt = await loadJSONPromptV2(locale)
    console.log('Промпт загружен, длина:', jsonPrompt.length)
    const finalPrompt = combineWithContext(jsonPrompt, context)
    console.log('Финальный промпт готов, длина:', finalPrompt.length)

    let analysisResult: StructuredAnalysisResponse

    if (url) {
      // Реальный анализ через OpenAI
      console.log('Анализируем URL через OpenAI...')
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 6000,
        response_format: { type: "json_object" }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      console.log('Получен ответ от OpenAI, длина:', result.length)
      console.log('Первые 200 символов ответа:', result.substring(0, 200))
      
      try {
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
        console.log('JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        console.error('Полный ответ:', result)
        return NextResponse.json({
          success: false,
          error: 'Ошибка парсинга JSON ответа',
          rawResponse: result
        }, { status: 500 })
      }
    } else if (screenshot) {
      // Реальный анализ скриншота через GPT-4o Vision
      console.log('Анализируем скриншот через GPT-4o Vision...')
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
        max_tokens: 6000,
        response_format: { type: "json_object" }
      })

      const result = completion.choices[0]?.message?.content || '{}'
      console.log('Получен ответ от OpenAI, длина:', result.length)
      console.log('Первые 200 символов ответа:', result.substring(0, 200))
      
      try {
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
        console.log('JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        console.error('Полный ответ:', result)
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

    console.log('Анализ завершен, начинаем валидацию...')
    
    // Валидируем опрос (с проверкой на существование)
    let surveyValidation: { isValid: boolean; errors: string[] } = { isValid: true, errors: [] }
    let surveyAnalysis: any = { totalQuestions: 0, averageConfidence: 0, criticalIssues: 0 }
    
    // Проверяем структуру ответа
    console.log('Структура analysisResult:', JSON.stringify(analysisResult, null, 2))
    console.log('Тип analysisResult:', typeof analysisResult)
    console.log('Ключи analysisResult:', Object.keys(analysisResult || {}))
    
    if (analysisResult && analysisResult.uxSurvey && analysisResult.uxSurvey.questions) {
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
      console.warn('uxSurvey не найден в результате анализа. Структура:', Object.keys(analysisResult || {}))
    }
    
    // Сохраняем результат в таблицу audits (простое и надежное решение)
    if (auditId) {
      try {
        console.log('Сохраняем результат в audits:', {
          auditId,
          result_data: analysisResult,
          status: 'completed'
        })
        
        const { error: auditUpdateError } = await supabase
          .from('audits')
          .update({
            result_data: analysisResult,
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', auditId)
        
        if (auditUpdateError) {
          console.error('Ошибка обновления audits:', auditUpdateError)
          throw new Error(`Ошибка сохранения результата: ${auditUpdateError.message}`)
        } else {
          console.log('✅ Аудит успешно обновлен с результатом')
        }
      } catch (saveError) {
        console.error('Ошибка сохранения результата:', saveError)
        throw new Error(`Ошибка сохранения аудита: ${saveError instanceof Error ? saveError.message : 'Неизвестная ошибка'}`)
      }
    } else {
      console.warn('⚠️ auditId не предоставлен, результат не сохранен')
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({ 
      success: true,
      data: analysisResult,
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
function loadJSONPrompt(): string {
  try {
    // Простой путь к файлу промпта
    const promptPath = join(process.cwd(), 'prompts', 'json-structured-prompt.md')
    console.log('Загружаем промпт из:', promptPath)
    
    const prompt = readFileSync(promptPath, 'utf-8')
    console.log('Промпт загружен успешно, длина:', prompt.length)
    
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
