import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { promptService } from '@/lib/i18n/prompt-service'
import { PromptType } from '@/lib/i18n/types'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { validateSurvey, analyzeSurveyResults } from '@/lib/survey-utils'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== OpenAI API вызван ===')
    const { url, screenshot, context, auditId, language = 'ru' } = await request.json()
    console.log('Параметры запроса:', { url: !!url, screenshot: !!screenshot, context: !!context, auditId })

    if (!url && !screenshot) {
      console.log('Ошибка: нет URL или скриншота')
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Загружаем JSON-структурированный промпт для выбранного языка
    console.log('Загружаем промпт для языка:', language)
    const jsonPrompt = await promptService.loadPrompt(PromptType.JSON_STRUCTURED, language)
    console.log('Промпт загружен, длина:', jsonPrompt.length)
    const finalPrompt = promptService.combineWithContext(jsonPrompt, context, language)
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
        max_tokens: 3000,
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
        max_tokens: 3000,
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


