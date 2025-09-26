import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest, AIResponse } from '@/lib/ai-provider'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { promptService } from '@/lib/i18n/prompt-service'
import { PromptType } from '@/lib/i18n/types'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'

// Вспомогательная функция для объединения промпта с контекстом (как в stable)
function combineWithContext(prompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return prompt
  }
  
  return `${prompt}\n\nДополнительный контекст от пользователя:\n${context}`
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH WITH CREDITS API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      provider = 'openai',
      openrouterModel = 'sonoma',
      auditId,
      language = 'ru'
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

    // Получаем пользователя из заголовков для проверки кредитов
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем кредиты перед запуском аудита
    console.log('🔍 Проверяем кредиты для пользователя:', user.id)
    console.log('🔍 Тип аудита: research')
    
    const creditsCheck = await checkCreditsForAudit(user.id, 'research')
    console.log('🔍 Результат проверки кредитов:', JSON.stringify(creditsCheck, null, 2))
    
    if (!creditsCheck.canProceed) {
      console.log('❌ Недостаточно кредитов:', creditsCheck)
      return NextResponse.json({
        error: 'Insufficient credits',
        message: creditsCheck.message,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance,
        is_test_account: creditsCheck.isTestAccount
      }, { status: 402 }) // 402 Payment Required
    }

    console.log('✅ Кредиты проверены успешно:', creditsCheck)

    // Загружаем промпт в зависимости от модели и языка
    console.log('🔍 RESEARCH-WITH-CREDITS: Загружаем промпт для языка:', language)
    console.log('🔍 RESEARCH-WITH-CREDITS: Provider:', provider, 'Model:', openrouterModel)
    let jsonPrompt: string
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      console.log('🔍 RESEARCH-WITH-CREDITS: Загружаем SONOMA промпт')
      jsonPrompt = await promptService.loadPrompt(PromptType.SONOMA_STRUCTURED, language)
      console.log('✅ RESEARCH-WITH-CREDITS: Используем специальный промпт для Sonoma Sky Alpha')
    } else {
      console.log('🔍 RESEARCH-WITH-CREDITS: Загружаем JSON_STRUCTURED промпт v2 (как в stable)')
      const { loadJSONPromptV2 } = await import('@/lib/prompt-loader')
      jsonPrompt = await loadJSONPromptV2()
      console.log('✅ RESEARCH-WITH-CREDITS: Используем стандартный JSON промпт v2')
      console.log('🔍 RESEARCH-WITH-CREDITS: Длина загруженного промпта:', jsonPrompt.length)
      console.log('🔍 RESEARCH-WITH-CREDITS: Первые 500 символов промпта:', jsonPrompt.substring(0, 500))
    }
    
    const finalPrompt = combineWithContext(jsonPrompt, context)
    console.log('Финальный промпт готов, длина:', finalPrompt.length)
    console.log('🔍 RESEARCH-WITH-CREDITS: Последние 1000 символов финального промпта:', finalPrompt.slice(-1000))

    let analysisResult: AIResponse | null = null

    if (url) {
      // Анализ URL
      console.log('Запускаем анализ URL:', url)
      const urlPrompt = `${finalPrompt}\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
      
      analysisResult = await executeAIRequest(
        [
          { 
            role: 'user', 
            content: urlPrompt 
          }
        ],
        {
          provider: provider,
          openrouterModel: openrouterModel,
          max_tokens: 3000, // Как в stable версии
          temperature: 0.7 // Как в stable версии
        }
      )
    } else if (screenshot) {
      // Анализ скриншота с изображением
      console.log('Запускаем анализ скриншота с изображением')
      analysisResult = await executeAIRequest(
        [
          {
            role: 'user',
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
        {
          provider: provider,
          openrouterModel: openrouterModel,
          max_tokens: 3000, // Как в stable версии
          temperature: 0.7 // Как в stable версии
        }
      )
    }

    if (!analysisResult) {
      console.log('Ошибка: анализ не выполнен')
      return NextResponse.json(
        { error: 'Не удалось выполнить анализ' },
        { status: 500 }
      )
    }

    console.log('Анализ завершен, результат:', Object.keys(analysisResult || {}))

    // Упрощенная обработка как в stable версии
    let parsedResult = analysisResult
    
    if (!analysisResult) {
      console.log('❌ PARSING: Нет результата от AI')
      return NextResponse.json({ error: 'Не удалось получить результат анализа' }, { status: 500 })
    }

    console.log('🔍 PARSING: Тип результата:', typeof analysisResult)
    console.log('🔍 PARSING: Ключи результата:', Object.keys(analysisResult || {}))

    // Если результат содержит content (как в AI response), извлекаем его
    if (analysisResult && typeof analysisResult === 'object' && 'content' in analysisResult) {
      const content = (analysisResult as any).content
      console.log('🔍 PARSING: Найден content, парсим как JSON...')
      
      try {
        parsedResult = JSON.parse(content)
        console.log('✅ PARSING: JSON успешно распарсен')
      } catch (parseError) {
        console.error('❌ PARSING: Ошибка парсинга JSON:', parseError)
        return NextResponse.json({ 
          error: 'Ошибка обработки ответа AI. Попробуйте позже.',
          details: parseError instanceof Error ? parseError.message : 'Parse error'
        }, { status: 500 })
      }
    } else {
      // Результат уже в нужном формате
      parsedResult = analysisResult
      console.log('✅ PARSING: Используем результат как есть')
    }

    // Валидация результата
    let validation: any = { isValid: false, errors: [] }
    let surveyValidation: any = null
    let surveyAnalysis: any = null

    if (parsedResult && isStructuredResponse(parsedResult as any)) {
      console.log('Результат структурированный, валидируем...')
      
      // Валидация опроса
      if ((parsedResult as any).uxSurvey) {
        surveyValidation = validateSurvey((parsedResult as any).uxSurvey)
        console.log('Валидация опроса:', surveyValidation)
      }

      // Анализ результатов опроса
      if ((parsedResult as any).uxSurvey && surveyValidation?.isValid) {
        surveyAnalysis = analyzeSurveyResults((parsedResult as any).uxSurvey)
        console.log('Анализ опроса:', surveyAnalysis)
      }

      validation = { isValid: true, errors: [] }
    }

    // Сохраняем результат в таблицу audits
    if (auditId) {
      try {
        console.log('Сохраняем результат в audits:', {
          auditId,
          result_data: parsedResult as any,
          status: 'completed'
        })
        
        const { error: auditUpdateError } = await supabase
          .from('audits')
          .update({
            result_data: parsedResult as any,
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

    // Списываем кредиты после успешного выполнения аудита
    if (auditId) {
      console.log('Списываем кредиты за аудит:', auditId)
      const deductResult = await deductCreditsForAudit(
        user.id,
        'research',
        auditId,
        `UX Research audit: ${url || 'screenshot analysis'}`
      )

      if (!deductResult.success) {
        console.error('Ошибка списания кредитов:', deductResult)
        // Не прерываем выполнение, так как аудит уже выполнен
      } else {
        console.log('✅ Кредиты успешно списаны:', deductResult)
      }
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({ 
      success: true,
      data: parsedResult as any,
      format: 'json',
      validation: {
        survey: surveyValidation,
        analysis: surveyAnalysis
      },
      credits_info: {
        deducted: auditId ? true : false,
        is_test_account: creditsCheck.isTestAccount,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance
      }
    })

  } catch (error) {
    console.error('Ошибка в research-with-credits API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}


