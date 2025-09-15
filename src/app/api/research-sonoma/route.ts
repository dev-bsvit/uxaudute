import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'
import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'
import { executeAIRequest } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH SONOMA API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      auditId,
      userId
    } = await request.json()
    
    console.log('Параметры запроса:', { 
      url: !!url, 
      screenshot: !!screenshot, 
      context: !!context,
      auditId,
      userId
    })
    
    if (screenshot) {
      console.log('📸 Скриншот получен, длина:', screenshot.length)
    }
    if (url) {
      console.log('🔗 URL получен:', url)
    }

    if (!url && !screenshot) {
      console.log('Ошибка: нет URL или скриншота')
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Проверяем и списываем кредиты для UX аудита
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Используем тестового пользователя если userId не передан
    const testUserId = userId || 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'
    const auditCost = 2 // Основной аудит стоит 2 кредита

    // Проверяем баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', testUserId)
      .single()

    if (balanceError) {
      console.error('Error checking balance:', balanceError)
      return NextResponse.json(
        { error: 'Ошибка проверки баланса кредитов' },
        { status: 500 }
      )
    }

    const currentBalance = balanceData?.balance || 0

    if (currentBalance < auditCost) {
      return NextResponse.json(
        { 
          error: 'Недостаточно кредитов для проведения аудита',
          required: auditCost,
          available: currentBalance,
          message: 'Пополните баланс кредитов для продолжения'
        },
        { status: 402 } // Payment Required
      )
    }

    // Списываем кредиты напрямую
    const newBalance = currentBalance - auditCost
    
    const { error: updateError } = await supabaseClient
      .from('user_balances')
      .update({ balance: newBalance })
      .eq('user_id', testUserId)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return NextResponse.json(
        { error: 'Ошибка списания кредитов' },
        { status: 500 }
      )
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: testUserId,
        type: 'debit',
        amount: -auditCost,
        balance_after: newBalance,
        source: 'audit',
        description: 'UX аудит интерфейса (research-sonoma)'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json(
        { error: 'Ошибка создания транзакции' },
        { status: 500 }
      )
    }

    console.log(`✅ Списано ${auditCost} кредитов для UX аудита. Новый баланс: ${newBalance}`)

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

    // Формируем промпт для анализа
    let analysisPrompt: string
    if (screenshot) {
      // Приоритет скриншоту - это более точный анализ
      analysisPrompt = `${finalPrompt}\n\nПользователь загрузил скриншот интерфейса для UX анализа. 

Проведи детальный анализ интерфейса на основе скриншота.

Учти, что это скриншот веб-интерфейса или мобильного приложения.
Проанализируй возможные проблемы UX и предложи улучшения.

${url ? `Дополнительная информация: URL сайта: ${url}` : ''}`
    } else if (url) {
      analysisPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
    } else {
      analysisPrompt = `${finalPrompt}\n\nПроведи общий анализ UX интерфейса.`
    }

    console.log('📤 Отправляем запрос к AI провайдеру...')
    
    let aiResponse: any
    
    if (screenshot) {
      // Для скриншота используем GPT-4o Vision напрямую
      console.log('📸 Используем GPT-4o Vision для анализа скриншота...')
      const { openai } = await import('@/lib/openai')
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: analysisPrompt
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
        temperature: 0.8,
        max_tokens: 8000,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0]?.message?.content || 'Нет ответа'
      console.log('📝 Получен ответ от GPT-4o Vision, длина:', content.length)
      console.log('📝 Первые 500 символов:', content.substring(0, 500))
      
      if (content === 'Нет ответа' || content.length < 50) {
        console.error('❌ GPT-4o Vision вернул пустой или слишком короткий ответ')
        aiResponse = {
          success: false,
          content: '',
          provider: 'openai',
          model: 'gpt-4o',
          error: 'GPT-4o Vision вернул пустой ответ. Возможно, изображение не может быть обработано.'
        }
      } else {
        aiResponse = {
          success: true,
          content,
          provider: 'openai',
          model: 'gpt-4o',
          usage: completion.usage
        }
      }
    } else {
      // Для текстового анализа используем систему AI провайдеров
      aiResponse = await executeAIRequest(
        [{ role: 'user', content: analysisPrompt }],
        {
          temperature: 0.8,
          max_tokens: 8000,
          provider: 'openai' // Используем OpenAI как основной провайдер
        }
      )
    }

    if (!aiResponse.success) {
      console.error('❌ Ошибка AI провайдера:', aiResponse.error)
      return NextResponse.json(
        { error: `Ошибка AI провайдера: ${aiResponse.error}` },
        { status: 500 }
      )
    }

    console.log('✅ Получен ответ от AI:', aiResponse.provider, aiResponse.model)
    const content = aiResponse.content
    console.log('📝 Содержимое ответа:', content.substring(0, 200) + '...')

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
