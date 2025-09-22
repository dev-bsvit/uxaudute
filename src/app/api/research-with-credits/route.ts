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
      auditId,
      locale = 'ru'
    } = await request.json()
    
    console.log('Параметры запроса:', { 
      url: !!url, 
      screenshot: !!screenshot, 
      context: !!context,
      provider,
      openrouterModel,
      auditId,
      locale
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

    // Загружаем промпт в зависимости от модели
    console.log('Загружаем промпт...')
    let jsonPrompt: string
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      jsonPrompt = await loadSonomaStructuredPrompt()
      console.log('Используем специальный промпт для Sonoma Sky Alpha')
    } else {
      jsonPrompt = await loadJSONPromptV2(locale)
      console.log('Используем стандартный промпт v2 для локали:', locale)
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
          openrouterModel: openrouterModel,
          max_tokens: 4000
        }
      )
    } else if (screenshot) {
      // Анализ скриншота
      console.log('Запускаем анализ скриншота')
      analysisResult = await executeAIRequest(
        [{ role: 'user', content: finalPrompt }],
        {
          provider: provider,
          openrouterModel: openrouterModel,
          max_tokens: 4000
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
        let content = (analysisResult as any).content
        
        // Пытаемся восстановить обрезанный JSON
        if (!content.endsWith('}')) {
          console.log('⚠️ JSON невалиден, пытаемся восстановить...')
          
          // Улучшенный алгоритм восстановления JSON
          const fixTruncatedJSON = (jsonStr: string) => {
            let fixed = jsonStr.trim()
            
            // Убираем лишние пробелы в конце
            while (fixed.endsWith(' ') || fixed.endsWith('\n') || fixed.endsWith('\t')) {
              fixed = fixed.slice(0, -1)
            }
            
            // Если заканчивается на запятую, убираем её
            if (fixed.endsWith(',')) {
              fixed = fixed.slice(0, -1)
            }
            
            // Подсчитываем открывающие и закрывающие скобки
            let openBraces = 0
            let openBrackets = 0
            let inString = false
            let escapeNext = false
            
            for (let i = 0; i < fixed.length; i++) {
              const char = fixed[i]
              
              if (escapeNext) {
                escapeNext = false
                continue
              }
              
              if (char === '\\') {
                escapeNext = true
                continue
              }
              
              if (char === '"' && !escapeNext) {
                inString = !inString
                continue
              }
              
              if (!inString) {
                if (char === '{') openBraces++
                else if (char === '}') openBraces--
                else if (char === '[') openBrackets++
                else if (char === ']') openBrackets--
              }
            }
            
            // Закрываем незакрытые массивы
            while (openBrackets > 0) {
              fixed += ']'
              openBrackets--
            }
            
            // Закрываем незакрытые объекты
            while (openBraces > 0) {
              fixed += '}'
              openBraces--
            }
            
            return fixed
          }
          
          content = fixTruncatedJSON(content)
          console.log('Восстановленный JSON:', content.substring(content.length - 200))
        }
        
        parsedResult = JSON.parse(content)
        console.log('Результат распарсен:', Object.keys(parsedResult || {}))
      } catch (parseError) {
        console.error('❌ Не удалось восстановить JSON, используем fallback')
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

/**
 * Комбинирует промпт с контекстом
 */
function combineWithContext(prompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return prompt
  }

  return `${prompt}\n\n## Дополнительный контекст:\n${context}`
}
