import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest, AIResponse } from '@/lib/ai-provider'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { loadJSONPrompt, combineWithContext } from '@/lib/prompt-loader'
import { checkCreditsForAudit, safeDeductCreditsForAudit } from '@/lib/credits'
import { FALLBACK_LANGUAGE } from '@/lib/i18n'

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
      language = FALLBACK_LANGUAGE,
      requiredCredits = 2 // По умолчанию 2 кредита за базовый UX анализ
    } = await request.json()

    console.log('Параметры запроса:', {
      url: !!url,
      screenshot: !!screenshot,
      context: !!context,
      provider,
      openrouterModel,
      auditId,
      language,
      requiredCredits
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
    console.log('🔍 Тип аудита: research, требуется кредитов:', requiredCredits)

    const creditsCheck = await checkCreditsForAudit(user.id, 'research', requiredCredits)
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

    // Загружаем промпт с поддержкой языка
    console.log(`Загружаем промпт для языка: ${language}`)
    const jsonPrompt = await loadJSONPrompt(language)
    console.log(`Промпт загружен для языка ${language}, длина:`, jsonPrompt.length)

    console.log('🔍 Context передан:', {
      hasContext: !!context,
      contextLength: context?.length || 0,
      contextPreview: context?.substring(0, 200) || 'нет'
    })

    const finalPrompt = combineWithContext(jsonPrompt, context, language)
    console.log('Финальный промпт готов, длина:', finalPrompt.length)
    console.log('🔍 Превью финального промпта (первые 500 символов):', finalPrompt.substring(0, 500))

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
        [{ 
          role: 'user', 
          content: [
            { type: 'text', text: finalPrompt },
            { type: 'image_url', image_url: { url: screenshot, detail: 'high' } }
          ]
        }],
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

    // Парсим результат если он в формате {content: "JSON_STRING"}
    let parsedResult = analysisResult
    if (analysisResult && typeof analysisResult === 'object' && 'content' in analysisResult) {
      try {
        console.log('Парсим content как JSON...')
        parsedResult = JSON.parse((analysisResult as any).content)
        console.log('Результат распарсен:', Object.keys(parsedResult || {}))
      } catch (parseError) {
        console.error('Ошибка парсинга content:', parseError)
        parsedResult = analysisResult
      }
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

    // Списываем кредиты после успешного сохранения аудита в БД
    if (auditId) {
      console.log('🔒 Безопасное списание кредитов за аудит:', auditId, 'количество:', requiredCredits)
      const deductResult = await safeDeductCreditsForAudit(
        user.id,
        'research',
        auditId,
        `UX Research audit: ${url || 'screenshot analysis'}`,
        requiredCredits
      )

      if (!deductResult.success) {
        console.error('❌ Ошибка списания кредитов:', deductResult)
        // ВАЖНО: Если списание не удалось, возвращаем ошибку
        // Аудит сохранён, но кредиты не списаны (флаг credits_deducted = false)
        return NextResponse.json(
          {
            error: 'Credits deduction failed',
            message: deductResult.message,
            audit_id: auditId,
            // Возвращаем данные аудита, чтобы пользователь мог повторить попытку
            data: parsedResult as any
          },
          { status: 402 }
        )
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

