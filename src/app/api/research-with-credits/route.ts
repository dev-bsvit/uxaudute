import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest, AIResponse } from '@/lib/ai-provider'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { loadJSONPromptV2, loadSonomaStructuredPrompt } from '@/lib/prompt-loader'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH WITH CREDITS API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      provider = 'openai',
      openrouterModel = 'sonoma',
      auditId
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
    console.log('Проверяем кредиты для пользователя:', user.id)
    const creditsCheck = await checkCreditsForAudit(user.id, 'research')
    
    if (!creditsCheck.canProceed) {
      console.log('Недостаточно кредитов:', creditsCheck)
      return NextResponse.json({
        error: 'Insufficient credits',
        message: creditsCheck.message,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance,
        is_test_account: creditsCheck.isTestAccount
      }, { status: 402 }) // 402 Payment Required
    }

    console.log('Кредиты проверены успешно:', creditsCheck)

    // Загружаем промпт в зависимости от модели
    console.log('Загружаем промпт...')
    let jsonPrompt: string
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      jsonPrompt = await loadSonomaStructuredPrompt()
      console.log('Используем специальный промпт для Sonoma Sky Alpha')
    } else {
      jsonPrompt = await loadJSONPromptV2()
      console.log('Используем стандартный промпт v2')
    }
    
    const finalPrompt = combineWithContext(jsonPrompt, context)
    console.log('Финальный промпт готов, длина:', finalPrompt.length)

    let analysisResult: AIResponse | null = null

    if (url) {
      // Анализ URL
      console.log('Запускаем анализ URL:', url)
      analysisResult = await executeAIRequest(
        [{ role: 'user', content: finalPrompt }],
        {
          provider: provider,
          openrouterModel: openrouterModel
        }
      )
    } else if (screenshot) {
      // Анализ скриншота
      console.log('Запускаем анализ скриншота')
      analysisResult = await executeAIRequest(
        [{ role: 'user', content: finalPrompt }],
        {
          provider: provider,
          openrouterModel: openrouterModel
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

    // Валидация результата
    let validation: any = { isValid: false, errors: [] }
    let surveyValidation: any = null
    let surveyAnalysis: any = null

    if (analysisResult && isStructuredResponse(analysisResult as any)) {
      console.log('Результат структурированный, валидируем...')
      
      // Валидация опроса
      if ((analysisResult as any).survey) {
        surveyValidation = validateSurvey((analysisResult as any).survey)
        console.log('Валидация опроса:', surveyValidation)
      }

      // Анализ результатов опроса
      if ((analysisResult as any).survey && surveyValidation?.isValid) {
        surveyAnalysis = analyzeSurveyResults((analysisResult as any).survey)
        console.log('Анализ опроса:', surveyAnalysis)
      }

      validation = { isValid: true, errors: [] }
    }

    // Сохраняем результат в таблицу audits
    if (auditId) {
      try {
        console.log('Сохраняем результат в audits:', {
          auditId,
          result_data: analysisResult as any,
          status: 'completed'
        })
        
        const { error: auditUpdateError } = await supabase
          .from('audits')
          .update({
            result_data: analysisResult as any,
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
      data: analysisResult as any,
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

/**
 * Комбинирует промпт с контекстом
 */
function combineWithContext(prompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return prompt
  }

  return `${prompt}\n\n## Дополнительный контекст:\n${context}`
}
