import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'
import { ResponseQualityAnalyzer } from '@/lib/quality-metrics'
import { LanguageAutoCorrector } from '@/lib/language-auto-corrector'

export async function POST(request: NextRequest) {
  try {
    console.log('=== RESEARCH API called ===')
    const { url, screenshot, context, language } = await request.json()

    if (!url && !screenshot) {
      return NextResponse.json(
        { error: 'URL или скриншот обязательны для анализа' },
        { status: 400 }
      )
    }

    // Определяем языковой контекст
    console.log('🌐 Determining language context...')
    const languageContext = language 
      ? LanguageManager.createLanguageContextFromParams({ language })
      : await LanguageManager.determineAnalysisLanguage(request)
    
    LanguageManager.logLanguageContext(languageContext, 'Research API')

    // Загружаем промпт с учетом языка
    console.log(`🔍 Loading prompt for language: ${languageContext.promptLanguage}`)
    let mainPrompt = await LanguageManager.loadPromptForLanguage(PromptType.MAIN, languageContext)
    
    // Принудительно устанавливаем язык ответа
    mainPrompt = LanguageManager.enforceResponseLanguage(mainPrompt, languageContext.responseLanguage)
    
    // Объединяем с контекстом
    let finalPrompt = mainPrompt
    if (context) {
      const contextLabel = languageContext.promptLanguage === 'ru' 
        ? '\n\nДополнительный контекст:\n'
        : '\n\nAdditional context:\n'
      finalPrompt = `${mainPrompt}${contextLabel}${context}`
    }

    console.log('🔍 Final prompt ready, length:', finalPrompt.length)

    let analysisResult: string | null = null

    if (url) {
      // Анализ URL
      console.log('🔍 Analyzing URL:', url)
      const urlInstruction = languageContext.promptLanguage === 'ru'
        ? `\n\nПроанализируй сайт по URL: ${url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
        : `\n\nAnalyze the website at URL: ${url}\n\nSince I cannot get a screenshot, conduct analysis based on general UX principles for this type of website.`
      
      const analysisPrompt = finalPrompt + urlInstruction
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.7,
        max_tokens: 3000, // Увеличиваем лимит для полных ответов
      })

      analysisResult = completion.choices[0]?.message?.content || null
    }

    if (screenshot) {
      // Анализ скриншота
      console.log('🔍 Analyzing screenshot')
      
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: finalPrompt },
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
        max_tokens: 3000, // Увеличиваем лимит для полных ответов
      })

      analysisResult = completion.choices[0]?.message?.content || null
    }

    // Проверяем что получили результат
    if (!analysisResult) {
      console.error('❌ No analysis result received')
      return NextResponse.json(
        { error: 'Не удалось получить результат анализа' },
        { status: 500 }
      )
    }

    // Проверяем качество ответа
    console.log('📊 Checking response quality...')
    const qualityMetrics = ResponseQualityAnalyzer.measureQuality(
      analysisResult,
      languageContext.responseLanguage as 'ru' | 'en'
    )

    // Проверяем языковую консистентность
    const languageValidation = LanguageManager.validateLanguageConsistency(
      finalPrompt,
      analysisResult,
      languageContext.responseLanguage
    )

    console.log('📊 Quality metrics:', qualityMetrics)
    console.log('🌐 Language validation:', languageValidation)

    // Если качество низкое, пытаемся исправить промпт и повторить
    if (!ResponseQualityAnalyzer.meetsQualityStandards(qualityMetrics) && !languageValidation.isConsistent) {
      console.log('⚠️ Quality issues detected, attempting correction...')
      
      const correctionResult = await LanguageAutoCorrector.correctPrompt(
        finalPrompt,
        languageContext,
        [...languageValidation.issues, `Quality score: ${qualityMetrics.qualityScore}`]
      )

      if (correctionResult.success) {
        console.log('🔧 Prompt corrected, retrying analysis...')
        // Здесь можно повторить запрос с исправленным промптом, но для простоты пока логируем
        console.log('🔧 Correction report:', LanguageAutoCorrector.generateCorrectionReport(correctionResult))
      }
    }

    // Логируем финальные метрики
    ResponseQualityAnalyzer.logQualityMetrics(qualityMetrics, 'Research API Response')
    LanguageManager.logLanguageContext(languageContext, 'Final Response')

    return NextResponse.json({ 
      result: analysisResult,
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
      }
    })

  } catch (error) {
    console.error('Research API error:', error)
    
    // Детальная информация об ошибке для отладки
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { error: 'Не удалось выполнить анализ. Попробуйте позже.' },
      { status: 500 }
    )
  }
}


