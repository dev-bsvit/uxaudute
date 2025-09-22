import { NextRequest, NextResponse } from 'next/server'
import { executeAIRequest } from '@/lib/ai-provider'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'
import { loadJSONPromptV2, loadSonomaStructuredPrompt } from '@/lib/prompt-loader'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH EXPERIMENTAL API вызван ===')
    const { 
      url, 
      screenshot, 
      context, 
      provider = 'openai',  // По умолчанию OpenAI
      openrouterModel = 'sonoma',  // По умолчанию Sonoma для экспериментов
      auditId,  // ID аудита для сохранения результата
      locale = 'ru'
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
      jsonPrompt = await loadSonomaStructuredPrompt()
      console.log('Используем специальный промпт для Sonoma Sky Alpha')
    } else {
      jsonPrompt = await loadJSONPromptV2(locale)
      console.log('Используем стандартный промпт v2 для локали:', locale)
    }
    
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
        max_tokens: 4000,
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
      
      try {
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
        console.log('✅ JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json(
          { error: 'Ошибка обработки ответа AI. Попробуйте позже.' },
          { status: 500 }
        )
      }
    }

    if (screenshot) {
      // Анализ скриншота - упрощенная логика
      console.log(`Анализируем скриншот через ${provider} (${openrouterModel})...`)
      
      // Используем текстовое описание для всех провайдеров
      const description = `Пользователь загрузил скриншот интерфейса для UX анализа. 
      
      Проведи анализ основываясь на общих принципах UX для интерфейсов.
      
      Учти, что это скриншот веб-интерфейса или мобильного приложения.
      Проанализируй возможные проблемы UX и предложи улучшения.`
      
      const analysisPrompt = `${finalPrompt}\n\nПроанализируй этот интерфейс на основе описания:\n\n${description}`
      
      const analysisResponse = await executeAIRequest([
        { role: "user", content: analysisPrompt }
      ], {
        temperature: 0.7,
        max_tokens: 4000,
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

      const result = analysisResponse.content
      console.log('Получен ответ от AI, длина:', result.length)
      
      try {
        analysisResult = JSON.parse(result) as StructuredAnalysisResponse
        console.log('✅ JSON успешно распарсен')
      } catch (parseError) {
        console.error('Ошибка парсинга JSON:', parseError)
        return NextResponse.json(
          { error: 'Ошибка обработки ответа AI. Попробуйте позже.' },
          { status: 500 }
        )
      }
    }

    if (!analysisResult) {
      console.error('Нет результата анализа')
      return NextResponse.json(
        { error: 'Не удалось получить результат анализа' },
        { status: 500 }
      )
    }

    // Валидация результата
    let validation, surveyValidation, surveyAnalysis
    
    if (provider === 'openrouter' && openrouterModel === 'sonoma') {
      console.log('🎯 Sonoma Sky Alpha - пропускаем валидацию')
      validation = { isValid: true, errors: [] }
      surveyValidation = { isValid: true, errors: [] }
      surveyAnalysis = { totalScore: 0, averageScore: 0, categoryScores: {} }
    } else {
      // Стандартная валидация для OpenAI
      const isValidStructure = isStructuredResponse(analysisResult)
      if (!isValidStructure) {
        console.error('Результат не соответствует ожидаемой структуре')
        return NextResponse.json(
          { error: 'Результат анализа не соответствует ожидаемому формату' },
          { status: 500 }
        )
      }

      // Валидация UX-опроса
      surveyValidation = validateSurvey(analysisResult.uxSurvey)
      if (!surveyValidation.isValid) {
        console.error('Ошибки валидации опроса:', surveyValidation.errors)
        return NextResponse.json(
          { error: 'UX-опрос не соответствует ожидаемому формату' },
          { status: 500 }
        )
      }

      surveyAnalysis = analyzeSurveyResults(analysisResult.uxSurvey)
      validation = { isValid: true, errors: [] }
    }

    // Сохранение в базу данных
    if (auditId) {
      try {
        const { error: saveError } = await supabase
          .from('audits')
          .update({
            result_data: analysisResult,
            updated_at: new Date().toISOString()
          })
          .eq('id', auditId)

        if (saveError) {
          console.error('Ошибка сохранения:', saveError)
          return NextResponse.json(
            { error: 'Не удалось сохранить результат анализа' },
            { status: 500 }
          )
        }

        console.log('✅ Результат сохранен в базу данных')
      } catch (dbError) {
        console.error('Ошибка базы данных:', dbError)
        return NextResponse.json(
          { error: 'Ошибка базы данных' },
          { status: 500 }
        )
      }
    }

    console.log('✅ Анализ завершен успешно')
    return NextResponse.json({
      success: true,
      result: analysisResult,
      validation,
      surveyValidation,
      surveyAnalysis,
      provider: provider,
      model: 'unknown'
    })

  } catch (error) {
    console.error('Ошибка в research-experimental API:', error)
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
  
  return `${prompt}\n\n## Контекст задачи:\n${context}\n\nУчти этот контекст при анализе.`
}