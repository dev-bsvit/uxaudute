import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH SONOMA API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      auditId
    } = await request.json()
    
    console.log('Параметры запроса:', { 
      url: !!url, 
      screenshot: !!screenshot, 
      context: !!context,
      auditId
    })

    if (!url && !screenshot) {
      console.log('Ошибка: нет URL или скриншота')
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем специальный промпт для Sonoma Sky Alpha
    console.log('Загружаем промпт для Sonoma Sky Alpha...')
    let jsonPrompt: string
    try {
      const promptPath = join(process.cwd(), 'prompts', 'sonoma-structured-prompt.md')
      jsonPrompt = readFileSync(promptPath, 'utf-8')
      console.log('✅ Загружен промпт Sonoma из файла')
    } catch (error) {
      console.log('⚠️ Не удалось загрузить промпт, используем fallback')
      jsonPrompt = `You are an expert UX designer. Analyze the interface and return JSON in this format:

{
  "screenDescription": {
    "screenType": "Type of screen",
    "userGoal": "User's main goal",
    "keyElements": ["List of key elements"],
    "confidence": 85,
    "confidenceReason": "Reason for confidence"
  },
  "uxSurvey": {
    "dynamicQuestionsAdded": true,
    "screenType": "landing",
    "questions": [
      {
        "id": 1,
        "question": "What is the main purpose?",
        "options": ["A) Option 1", "B) Option 2", "C) Option 3"],
        "scores": [70, 20, 10],
        "confidence": 85,
        "category": "clarity",
        "principle": "Goal Clarity",
        "explanation": "Explanation"
      }
    ],
    "overallConfidence": 82,
    "summary": {
      "totalQuestions": 1,
      "averageConfidence": 82,
      "categoryBreakdown": {"clarity": 82}
    }
  },
  "problemsAndSolutions": {
    "criticalIssues": [
      {
        "id": 1,
        "title": "Issue title",
        "description": "Issue description",
        "severity": "high",
        "impact": "High impact on user experience",
        "solution": "Proposed solution",
        "priority": 1
      }
    ],
    "recommendations": [
      {
        "id": 1,
        "title": "Recommendation title",
        "description": "Recommendation description",
        "category": "usability",
        "effort": "medium",
        "impact": "high"
      }
    ],
    "overallScore": 75,
    "summary": "Overall analysis summary"
  }
}

Respond with valid JSON only.`
    }

    const finalPrompt = context ? `${jsonPrompt}\n\n## Контекст задачи:\n${context}\n\nУчти этот контекст при анализе.` : jsonPrompt
    console.log('Финальный промпт готов, длина:', finalPrompt.length)

    // Прямой запрос к OpenRouter API (как в тесте)
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    
    if (!OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY не настроен')
      return NextResponse.json(
        { error: 'OpenRouter API ключ не настроен' },
        { status: 500 }
      )
    }

    let analysisPrompt: string
    if (url) {
      analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
    } else {
      // Для скриншота используем текстовое описание (Sonoma не поддерживает мультимодальность)
      analysisPrompt = `${finalPrompt}\n\nПользователь загрузил скриншот интерфейса для UX анализа. 

Поскольку Sonoma Sky Alpha не поддерживает мультимодальные запросы, 
проведи анализ основываясь на общих принципах UX для интерфейсов.

Учти, что это скриншот веб-интерфейса или мобильного приложения.
Проанализируй возможные проблемы UX и предложи улучшения.`
    }

    console.log('📤 Отправляем запрос к OpenRouter...')
    
    const requestBody = {
      model: 'openrouter/sonoma-sky-alpha',
      messages: [
        {
          role: 'user',
          content: analysisPrompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.8
    }

    console.log('📋 Параметры запроса:', JSON.stringify(requestBody, null, 2))

    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app',
        'X-Title': 'UX Audit Platform'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 Получен ответ от OpenRouter:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Ошибка OpenRouter:', errorText)
      return NextResponse.json(
        { error: `Ошибка OpenRouter: ${response.status} ${errorText}` },
        { status: 500 }
      )
    }

    const data = await response.json()
    console.log('✅ Ответ получен:', JSON.stringify(data, null, 2))

    // Проверяем на ошибки в ответе
    if (data.error) {
      console.error('❌ Ошибка в ответе OpenRouter:', data.error)
      return NextResponse.json(
        { error: `Ошибка API: ${data.error.message || 'Неизвестная ошибка'}` },
        { status: 500 }
      )
    }

    const content = data.choices?.[0]?.message?.content || 'Нет ответа'
    console.log('📝 Содержимое ответа:', content)

    // Парсим JSON ответ
    let analysisResult: any
    try {
      // Попытка очистить JSON от возможных проблем
      let cleanedContent = content.trim()
      
      // Удаляем возможные markdown блоки
      if (cleanedContent.startsWith('```json')) {
        cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      }
      
      // Попытка найти JSON в тексте
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }
      
      analysisResult = JSON.parse(cleanedContent)
      console.log('✅ JSON успешно распарсен')
    } catch (parseError) {
      console.error('❌ Ошибка парсинга JSON:', parseError)
      console.error('Ответ AI:', content)
      
      // Создаем fallback структуру
      analysisResult = {
        screenDescription: {
          screenType: "Неизвестный тип экрана",
          userGoal: "Цель пользователя не определена",
          keyElements: ["Элементы не определены"],
          confidence: 0,
          confidenceReason: "Ошибка парсинга ответа AI"
        },
        uxSurvey: {
          dynamicQuestionsAdded: false,
          screenType: "unknown",
          questions: [],
          overallConfidence: 0,
          summary: {
            totalQuestions: 0,
            averageConfidence: 0,
            categoryBreakdown: {}
          }
        },
        problemsAndSolutions: [],
        audience: {
          targetAudience: "Не определена",
          mainPain: "Не определена",
          fears: []
        },
        behavior: {
          userScenarios: {
            idealPath: "Не определен",
            typicalError: "Не определена",
            alternativeWorkaround: "Не определен"
          },
          frictionPoints: [],
          actionMotivation: "Не определена",
          behavioralPatterns: "Не определены"
        },
        selfCheck: {
          checklist: {
            coversAllElements: false,
            noContradictions: false,
            principlesJustified: false,
            actionClarity: false
          },
          confidence: {
            analysis: 0,
            survey: 0,
            recommendations: 0
          },
          varietyCheck: {
            passed: false,
            description: "Ошибка парсинга",
            principleVariety: [],
            issueTypes: []
          },
          confidenceVariation: {
            min: 0,
            max: 0,
            average: 0,
            explanation: "Ошибка парсинга"
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0",
          model: "sonoma-sky-alpha"
        },
        rawResponse: content,
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
      }
      console.log('⚠️ Используем fallback структуру')
    }

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
          console.error('Ошибка сохранения результата:', auditUpdateError)
          throw new Error(`Ошибка сохранения результата: ${auditUpdateError.message}`)
        } else {
          console.log('✅ Аудит успешно обновлен с результатом')
        }
      } catch (saveError) {
        console.error('Ошибка сохранения результата:', saveError)
        // Не прерываем выполнение, просто логируем ошибку
      }
    } else {
      console.warn('⚠️ auditId не предоставлен, результат не сохранен')
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({ 
      success: true,
      data: analysisResult,
      format: 'json',
      provider: 'openrouter',
      model: 'sonoma-sky-alpha',
      experimental: true
    })

  } catch (error) {
    console.error('Research Sonoma API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : 'Неизвестная ошибка'
      },
      { status: 500 }
    )
  }
}
