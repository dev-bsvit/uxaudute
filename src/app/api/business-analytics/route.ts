import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { BusinessAnalyticsResponse } from '@/lib/analysis-types'
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'
import { ResponseQualityAnalyzer } from '@/lib/quality-metrics'

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json()

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Получаем данные аудита из базы
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        *,
        projects (
          context,
          target_audience
        )
      `)
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Проверяем, что основной аудит завершен
    if (audit.status !== 'completed' || !audit.result_data) {
      return NextResponse.json({ 
        error: 'Main audit must be completed first' 
      }, { status: 400 })
    }

    // Определяем языковой контекст из данных аудита
    let auditLanguage = audit.input_data?.language

    // Если язык не сохранен, определяем по содержимому result_data
    if (!auditLanguage && audit.result_data) {
      const resultText = JSON.stringify(audit.result_data)
      // Проверяем есть ли кириллица в данных
      const hasCyrillic = /[а-яА-ЯёЁ]/.test(resultText)
      auditLanguage = hasCyrillic ? 'ru' : 'en'
      console.log('🌐 Language auto-detected from result_data:', auditLanguage, hasCyrillic)
    }

    // Fallback на русский если язык всё ещё не определен
    auditLanguage = auditLanguage || 'ru'
    console.log('🌐 Final audit language:', auditLanguage)

    const languageContext = {
      requestLanguage: auditLanguage,
      detectedLanguage: auditLanguage,
      promptLanguage: auditLanguage,
      responseLanguage: auditLanguage,
      isConsistent: true,
      source: 'user-preference' as const
    }
    LanguageManager.logLanguageContext(languageContext, 'Business Analytics API')

    // Загружаем промт для бизнес аналитики с учетом языка
    let businessAnalyticsPrompt = await LanguageManager.loadPromptForLanguage(
      PromptType.BUSINESS_ANALYTICS, 
      languageContext
    )
    
    // Принудительно устанавливаем язык ответа
    businessAnalyticsPrompt = LanguageManager.enforceResponseLanguage(
      businessAnalyticsPrompt, 
      languageContext.responseLanguage
    )

    // Подготавливаем данные для промта
    const auditData = {
      imageUrl: audit.screenshot_url,
      context: audit.context || '',
      projectContext: audit.projects?.context || '',
      targetAudience: audit.projects?.target_audience || '',
      analysisResult: audit.result_data
    }

    // Формируем промт с данными аудита
    const dataLabels = {
      ru: {
        title: '**Данные для анализа:**',
        image: 'Изображение',
        context: 'Контекст аудита',
        projectContext: 'Контекст проекта',
        targetAudience: 'Целевая аудитория',
        analysisResult: 'Результат UX анализа',
        instruction: 'Сгенерируй бизнес аналитику на основе этих данных.'
      },
      en: {
        title: '**Analysis Data:**',
        image: 'Image',
        context: 'Audit Context',
        projectContext: 'Project Context',
        targetAudience: 'Target Audience',
        analysisResult: 'UX Analysis Result',
        instruction: 'Generate business analytics based on this data.'
      },
      ua: {
        title: '**Дані для аналізу:**',
        image: 'Зображення',
        context: 'Контекст аудиту',
        projectContext: 'Контекст проєкту',
        targetAudience: 'Цільова аудиторія',
        analysisResult: 'Результат UX аналізу',
        instruction: 'Згенеруй бізнес-аналітику на основі цих даних.'
      }
    }

    const labels = dataLabels[auditLanguage as keyof typeof dataLabels] || dataLabels.ru

    const fullPrompt = `${businessAnalyticsPrompt}

${labels.title}
- ${labels.image}: ${auditData.imageUrl}
- ${labels.context}: ${auditData.context}
- ${labels.projectContext}: ${auditData.projectContext}
- ${labels.targetAudience}: ${auditData.targetAudience}
- ${labels.analysisResult}: ${JSON.stringify(auditData.analysisResult, null, 2)}

${labels.instruction}`

    // Формируем system message с учетом языка
    const languageInstruction = languageContext.responseLanguage === 'en'
      ? 'CRITICAL: You MUST respond in ENGLISH ONLY. DO NOT use Russian, Ukrainian, or any other language. All industry analysis, KPIs, hypotheses, user stories, test plans, barriers, risks, opportunities, and next steps MUST be in English. Write "weeks" NOT "недели", "days" NOT "дней", "First step" NOT "Первый шаг".'
      : 'КРИТИЧНО: Ты ДОЛЖЕН отвечать ТОЛЬКО на русском языке. НЕ используй английский или другие языки.'

    // Отправляем запрос к OpenAI с требованием JSON
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Senior Product Analyst and Growth expert. You MUST respond ONLY with valid JSON format. No markdown, no explanations, no additional text - ONLY JSON. ${languageInstruction}`
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Парсим JSON ответ (теперь это чистый JSON благодаря response_format)
    let businessAnalyticsData: BusinessAnalyticsResponse
    try {
      businessAnalyticsData = JSON.parse(responseText)

      // Валидация обязательных полей
      if (!businessAnalyticsData.industry_analysis || !businessAnalyticsData.metadata) {
        throw new Error('Missing required fields in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json({
        error: 'Failed to parse business analytics response',
        details: responseText
      }, { status: 500 })
    }

    // Сохраняем результат бизнес аналитики в базу
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        result_data: {
          ...audit.result_data,
          business_analytics: businessAnalyticsData
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save business analytics' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: businessAnalyticsData
    })

  } catch (error) {
    console.error('Business analytics generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}



