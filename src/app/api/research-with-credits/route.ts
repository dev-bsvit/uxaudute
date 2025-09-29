import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest, AIResponse } from '@/lib/ai-provider'
import { isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'
import { ResponseQualityAnalyzer } from '@/lib/quality-metrics'

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

    // Определяем язык для анализа
    console.log('🌐 Determining language for analysis...')
    const languageContext = await LanguageManager.determineAnalysisLanguage(request)
    LanguageManager.logLanguageContext(languageContext, 'API Request')

    // Выбираем тип промпта в зависимости от провайдера
    let promptType: PromptType
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      promptType = PromptType.SONOMA_STRUCTURED
      console.log('🔍 Using SONOMA_STRUCTURED prompt for Sonoma model')
    } else {
      promptType = PromptType.JSON_STRUCTURED
      console.log('🔍 Using JSON_STRUCTURED prompt for standard analysis')
    }

    // Загружаем промпт с учетом языка
    console.log(`🔍 Loading prompt ${promptType} for language: ${languageContext.promptLanguage}`)
    let jsonPrompt = await LanguageManager.loadPromptForLanguage(promptType, languageContext)
    
    // Принудительно устанавливаем язык ответа
    jsonPrompt = LanguageManager.enforceResponseLanguage(jsonPrompt, languageContext.responseLanguage)
    
    console.log('🔍 Final prompt length:', jsonPrompt.length)
    console.log('🔍 Prompt preview (first 300 chars):', jsonPrompt.substring(0, 300))
    
    // Объединяем с контекстом с учетом языка
    let finalPrompt = jsonPrompt
    if (context) {
      const contextLabel = languageContext.promptLanguage === 'ru' 
        ? '\n\nДополнительный контекст от пользователя:\n'
        : '\n\nAdditional context from user:\n'
      finalPrompt = `${jsonPrompt}${contextLabel}${context}`
    }
    
    console.log('Final prompt ready, length:', finalPrompt.length)

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

    // Проверяем качество ответа
    console.log('🔍 Checking response quality...')
    if (!analysisResult) {
      console.log('❌ No result from AI')
      return NextResponse.json({ error: 'Не удалось получить результат анализа' }, { status: 500 })
    }

    // Извлекаем контент из ответа AI
    let responseContent = ''
    if (analysisResult && typeof analysisResult === 'object' && 'content' in analysisResult) {
      responseContent = (analysisResult as any).content
    } else if (typeof analysisResult === 'string') {
      responseContent = analysisResult
    } else {
      responseContent = JSON.stringify(analysisResult)
    }

    // Валидируем качество ответа
    const qualityMetrics = ResponseQualityAnalyzer.measureQuality(
      responseContent, 
      languageContext.responseLanguage as 'ru' | 'en'
    )
    
    console.log('📊 Response quality metrics:', qualityMetrics)
    
    // Проверяем языковую консистентность
    const languageValidation = LanguageManager.validateLanguageConsistency(
      finalPrompt,
      responseContent,
      languageContext.responseLanguage
    )
    
    console.log('🌐 Language validation:', languageValidation)

    // Парсим JSON ответ
    let parsedResult
    try {
      parsedResult = JSON.parse(responseContent)
      console.log('✅ JSON successfully parsed')
    } catch (parseError) {
      console.error('❌ JSON parsing error:', parseError)
      console.log('📄 Raw response content:', responseContent.substring(0, 500))
      return NextResponse.json({ 
        error: 'Ошибка обработки ответа AI. Попробуйте позже.',
        details: parseError instanceof Error ? parseError.message : 'Parse error',
        quality: qualityMetrics,
        language_validation: languageValidation
      }, { status: 500 })
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

    // Логируем финальные метрики качества
    ResponseQualityAnalyzer.logQualityMetrics(qualityMetrics, 'API Response')
    LanguageManager.logLanguageContext(languageContext, 'Final Response')

    console.log('✅ Returning successful response with quality metrics')
    return NextResponse.json({ 
      success: true,
      data: parsedResult as any,
      format: 'json',
      validation: {
        survey: surveyValidation,
        analysis: surveyAnalysis
      },
      quality: {
        score: qualityMetrics.qualityScore,
        completeness: qualityMetrics.completeness,
        language_accuracy: qualityMetrics.languageAccuracy,
        is_truncated: qualityMetrics.isTruncated,
        token_count: qualityMetrics.tokenCount,
        meets_standards: ResponseQualityAnalyzer.meetsQualityStandards(qualityMetrics)
      },
      language: {
        context: languageContext,
        validation: languageValidation
      },
      credits_info: {
        deducted: auditId ? true : false,
        is_test_account: creditsCheck.isTestAccount,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance
      }
    })

  } catch (error) {
    console.error('❌ CRITICAL ERROR in research-with-credits API:', error)
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ Error message:', error instanceof Error ? error.message : String(error))
    
    return NextResponse.json(
      { 
        error: 'Внутренняя ошибка сервера',
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}


