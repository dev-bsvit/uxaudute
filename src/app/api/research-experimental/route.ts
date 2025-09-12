import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest } from '@/lib/ai-provider'
import { readFileSync } from 'fs'
import { join } from 'path'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { loadJSONPromptV2 } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH EXPERIMENTAL API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      provider = 'openai',  // По умолчанию OpenAI
      openrouterModel = 'sonoma',  // По умолчанию Sonoma для экспериментов
      auditId  // ID аудита для сохранения результата
    } = await request.json()
    
    console.log('Параметры запроса:', { 
      url: !!url, 
      screenshot: !!screenshot, 
      context: !!context,
      provider,
      openrouterModel,
      auditId
    })

    if (!url && !screenshot) {
      console.log('Ошибка: нет URL или скриншота')
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем промпт в зависимости от модели
    console.log('Загружаем промпт...')
    let jsonPrompt: string
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      jsonPrompt = loadSonomaPrompt()
      console.log('Используем специальный промпт для Sonoma Sky Alpha')
    } else {
      jsonPrompt = await loadJSONPromptV2()
      console.log('Используем стандартный промпт v2')
    }
    console.log('Промпт загружен, длина:', jsonPrompt.length)
    const finalPrompt = combineWithContext(jsonPrompt, context)
    console.log('Финальный промпт готов, длина:', finalPrompt.length)

    let analysisResult: StructuredAnalysisResponse | null = null

    if (url) {
      // Анализ URL через выбранный AI провайдер
      console.log(`Анализируем URL через ${provider} (${openrouterModel})...`)
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      const aiResponse = await executeAIRequest([
        { role: "user", content: analysisPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 3000,
        provider: provider as 'openai' | 'openrouter',
        openrouterModel: openrouterModel as 'claude' | 'sonoma' | 'gpt4' | 'default'
      })

      if (!aiResponse.success) {
        console.error('Ошибка AI анализа:', aiResponse.error)
        return NextResponse.json(
          { error: 'Не удалось выполнить анализ. Попробуйте позже.' },
          { status: 500 }
        )
      }

      const result = aiResponse.content
      console.log('Получен ответ от AI, длина:', result.length)
      console.log('Первые 200 символов ответа:', result.substring(0, 200))
      console.log('Полный ответ AI:', result)
      
      try {
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
        console.log('✅ JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        console.error('Ответ AI:', result)
        return NextResponse.json(
          { error: 'Ошибка обработки ответа AI. Попробуйте позже.' },
          { status: 500 }
        )
      }
    }

    if (screenshot) {
      // Анализ скриншота через выбранный AI провайдер
      console.log(`Анализируем скриншот через ${provider} (${openrouterModel})...`)
      
      // Описание изображения через выбранный провайдер
      const descriptionPrompt = `Опиши детально этот интерфейс. Укажи:
1. Тип экрана (лендинг, форма, дашборд, каталог и т.д.)
2. Основные элементы интерфейса
3. Цветовую схему и стиль
4. Расположение ключевых элементов
5. Навигационные элементы
6. Формы и поля ввода
7. Кнопки и призывы к действию

Будь максимально детальным в описании. Это поможет для дальнейшего UX анализа.`

      const descriptionResponse = await executeAIRequest([
        {
          role: "user",
          content: [
            { type: "text", text: descriptionPrompt },
            {
              type: "image_url",
              image_url: {
                url: screenshot,
                detail: "high"
              }
            }
          ]
        }
      ], {
        temperature: 0.3,
        max_tokens: 1000,
        provider: provider as 'openai' | 'openrouter',
        openrouterModel: openrouterModel as 'claude' | 'sonoma' | 'gpt4' | 'default'
      })

      if (!descriptionResponse.success) {
        console.error('Описание изображения не удалось:', descriptionResponse.error)
        return NextResponse.json(
          { error: 'Не удалось описать изображение. Попробуйте позже.' },
          { status: 500 }
        )
      }

      const description = descriptionResponse.content
      console.log('✅ Описание изображения получено')

      // Теперь анализируем описание через выбранный провайдер
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй этот интерфейс на основе описания:\n\n${description}`
      
      const analysisResponse = await executeAIRequest([
        { role: "user", content: analysisPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 3000,
        provider: provider as 'openai' | 'openrouter',
        openrouterModel: openrouterModel as 'claude' | 'sonoma' | 'gpt4' | 'default'
      })

      if (!analysisResponse.success) {
        console.error('Анализ не удался:', analysisResponse.error)
        return NextResponse.json(
          { error: 'Не удалось выполнить анализ. Попробуйте позже.' },
          { status: 500 }
        )
      }

      const analysis = analysisResponse.content
      console.log(`✅ UX анализ выполнен через ${analysisResponse.provider}`)
      
      try {
        analysisResult = JSON.parse(analysis) as StructuredAnalysisResponse
        console.log('✅ JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        console.error('Ответ AI:', analysis)
        return NextResponse.json(
          { error: 'Ошибка обработки ответа AI. Попробуйте позже.' },
          { status: 500 }
        )
      }
    }

    // Проверяем что результат получен
    if (!analysisResult) {
      console.error('Результат анализа не получен')
      return NextResponse.json(
        { error: 'Не удалось получить результат анализа' },
        { status: 500 }
      )
    }

    // Валидация результата
    console.log('🔍 Валидация результата:')
    console.log('analysisResult:', analysisResult)
    console.log('isStructuredResponse:', isStructuredResponse(analysisResult))
    
    if (!analysisResult) {
      console.error('❌ analysisResult is null')
      return NextResponse.json(
        { error: 'Не удалось получить результат анализа' },
        { status: 500 }
      )
    }
    
    if (!isStructuredResponse(analysisResult)) {
      console.error('❌ Результат не соответствует ожидаемой структуре')
      console.error('Ожидаемые поля: screenDescription, uxSurvey, problemsAndSolutions')
      console.error('Полученные поля:', Object.keys(analysisResult))
      return NextResponse.json(
        { error: 'Результат анализа не соответствует ожидаемому формату' },
        { status: 500 }
      )
    }

    console.log('✅ Результат прошел валидацию')

    // Валидация UX-опроса
    const surveyValidation = validateSurvey(analysisResult.uxSurvey)
    const surveyAnalysis = analyzeSurveyResults(analysisResult.uxSurvey)
    
    console.log('✅ UX-опрос прошел валидацию')

    // Сохраняем результат в базу данных если есть auditId
    if (auditId) {
      try {
        console.log('Сохраняем результат в базу данных...')
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
      },
      provider: provider,
      experimental: true
    })

  } catch (error) {
    console.error('Research experimental API error:', error)
    
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
 * Fallback промпт если основной файл недоступен
 */
function getFallbackJSONPrompt(): string {
  return `# JSON-структурированный промпт для UX-анализа

Вы — опытный UX-дизайнер-исследователь. Проанализируйте интерфейс и верните результат в формате JSON.

**КРИТИЧЕСКИ ВАЖНО: 
1. Отвечай ТОЛЬКО в формате JSON
2. НЕ добавляй никакого текста до или после JSON
3. НЕ оборачивай JSON в markdown блоки
4. НЕ добавляй объяснения или комментарии
5. Начинай ответ сразу с символа { и заканчивай символом }
6. Убедись, что JSON валидный и полный**

{
  "screenDescription": {
    "screenType": "Тип экрана",
    "userGoal": "Цель пользователя",
    "keyElements": ["Элемент 1", "Элемент 2"],
    "confidence": 85,
    "confidenceReason": "Обоснование уверенности"
  },
  "uxSurvey": {
    "dynamicQuestionsAdded": true,
    "screenType": "лендинг",
    "questions": [
      {
        "id": 1,
        "question": "Вопрос 1?",
        "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3"],
        "scores": [70, 20, 10],
        "confidence": 85,
        "category": "clarity",
        "principle": "Принцип",
        "explanation": "Объяснение"
      }
    ],
    "overallConfidence": 82,
    "summary": {
      "totalQuestions": 1,
      "averageConfidence": 82,
      "criticalIssues": 0,
      "recommendations": []
    }
  },
  "audience": {
    "targetAudience": "Целевая аудитория",
    "mainPain": "Основная боль",
    "fears": ["Страх 1", "Страх 2"]
  },
  "behavior": {
    "userScenarios": {
      "idealPath": "Идеальный путь",
      "typicalError": "Типичная ошибка",
      "alternativeWorkaround": "Альтернативный обход"
    },
    "behavioralPatterns": "Поведенческие паттерны",
    "frictionPoints": [
      {
        "point": "Точка трения 1",
        "impact": "major"
      }
    ],
    "actionMotivation": "Мотивация к действию"
  },
  "problemsAndSolutions": [
    {
      "element": "Элемент",
      "problem": "Проблема",
      "principle": "Принцип",
      "consequence": "Последствие",
      "businessImpact": {
        "metric": "conversion",
        "impactLevel": "high",
        "description": "Описание влияния"
      },
      "recommendation": "Рекомендация",
      "expectedEffect": "Ожидаемый эффект",
      "priority": "high",
      "confidence": 85,
      "confidenceSource": "Источник уверенности"
    }
  ],
  "selfCheck": {
    "checklist": {
      "coversAllElements": true,
      "noContradictions": true,
      "principlesJustified": true,
      "actionClarity": true
    },
    "varietyCheck": {
      "passed": true,
      "description": "Описание разнообразия",
      "principleVariety": ["Принцип 1"],
      "issueTypes": ["visual"]
    },
    "confidence": {
      "analysis": 85,
      "survey": 82,
      "recommendations": 88
    },
    "confidenceVariation": {
      "min": 70,
      "max": 90,
      "average": 82,
      "explanation": "Объяснение вариации"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0",
    "model": "gpt-4o"
  }
}

Отвечай ТОЛЬКО в формате JSON на русском языке.`
}

/**
 * Загружает специальный промпт для Sonoma Sky Alpha
 */
function loadSonomaPrompt(): string {
  try {
    // Пытаемся загрузить новый промпт из файла
    const promptPath = join(process.cwd(), 'prompts', 'sonoma-structured-prompt.md')
    const prompt = readFileSync(promptPath, 'utf-8')
    console.log('✅ Загружен новый промпт Sonoma из файла')
    return prompt
  } catch (error) {
    console.log('⚠️ Не удалось загрузить новый промпт, используем fallback')
    // Fallback к старому промпту
    return `You are an expert UX designer with 20 years of experience. Analyze the provided screenshot or URL and return a comprehensive UX analysis in JSON format.

## Instructions:
1. Always respond with valid JSON
2. Do not add any text before or after the JSON
3. Start your response with { and end with }
4. Use English for all field names, Russian for content
5. Ensure all required fields are present

## Required JSON Structure:
{
  "screenDescription": {
    "screenType": "Type of screen (e.g., landing page, form, dashboard)",
    "userGoal": "User's main goal on this screen",
    "keyElements": ["List of key UI elements"],
    "confidence": 85,
    "confidenceReason": "Reason for confidence level"
  },
  "uxSurvey": {
    "dynamicQuestionsAdded": true,
    "screenType": "landing",
    "questions": [
      {
        "id": 1,
        "question": "What is the main purpose of this page?",
        "options": ["A) Register/Login", "B) Get product info", "C) Make purchase"],
        "scores": [70, 20, 10],
        "confidence": 85,
        "category": "clarity",
        "principle": "Goal Clarity Principle",
        "explanation": "User should understand the page purpose"
      }
    ],
    "overallConfidence": 82,
    "summary": {
      "totalQuestions": 1,
      "averageConfidence": 82,
      "criticalIssues": 1,
      "recommendations": ["Improve visual hierarchy"]
    }
  },
  "audience": {
    "targetAudience": "Target audience description",
    "mainPain": "Main user pain point",
    "fears": ["User fear 1", "User fear 2", "User fear 3"]
  },
  "behavior": {
    "userScenarios": {
      "idealPath": "Ideal user path",
      "typicalError": "Typical user error",
      "alternativeWorkaround": "Alternative workaround"
    },
    "behavioralPatterns": "User behavior patterns",
    "frictionPoints": [
      {"point": "Friction point 1", "impact": "major"},
      {"point": "Friction point 2", "impact": "minor"}
    ],
    "actionMotivation": "What motivates users to act"
  },
  "problemsAndSolutions": [
    {
      "element": "Button element",
      "problem": "Problem description",
      "principle": "UX Principle",
      "consequence": "Consequence of problem",
      "businessImpact": {
        "metric": "conversion",
        "impactLevel": "high",
        "description": "Impact description"
      },
      "recommendation": "Recommended solution",
      "expectedEffect": "Expected improvement",
      "priority": "high",
      "confidence": 85,
      "confidenceSource": "Source of confidence"
    }
  ],
  "selfCheck": {
    "checklist": {
      "coversAllElements": true,
      "noContradictions": true,
      "principlesJustified": true,
      "actionClarity": true
    },
    "varietyCheck": {
      "passed": true,
      "description": "Recommendations are diverse",
      "principleVariety": ["Visibility", "Error Prevention"],
      "issueTypes": ["visual", "functional"]
    },
    "confidence": {
      "analysis": 85,
      "survey": 82,
      "recommendations": 88
    },
    "confidenceVariation": {
      "min": 70,
      "max": 90,
      "average": 82,
      "explanation": "Confidence varies by data source"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0",
    "model": "sonoma-sky-alpha"
  }
}

## Analysis Guidelines:
- Analyze all visible UI elements
- Identify 3-5 real problems based on the interface
- Provide specific, actionable recommendations
- Use realistic confidence levels (70-90%)
- Focus on user experience and business impact

Respond with valid JSON only.`
  }
}

/**
 * Комбинирует промпт с контекстом
 */
function combineWithContext(prompt: string, context?: string): string {
  if (!context) {
    return prompt
  }
  
  return `${prompt}\n\n## Контекст задачи:\n${context}\n\nУчти этот контекст при анализе.`
}