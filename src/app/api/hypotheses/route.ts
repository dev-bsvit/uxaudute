import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { HypothesisResponse } from '@/lib/analysis-types'
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'

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

    // Определяем язык из данных аудита
    let auditLanguage = audit.input_data?.language
    if (!auditLanguage && audit.result_data) {
      const resultText = JSON.stringify(audit.result_data)
      const hasCyrillic = /[а-яА-ЯёЁїіє]/.test(resultText)
      auditLanguage = hasCyrillic ? 'ru' : 'en'
    }
    auditLanguage = auditLanguage || 'ru'

    const languageContext = {
      requestLanguage: auditLanguage,
      detectedLanguage: auditLanguage,
      promptLanguage: auditLanguage,
      responseLanguage: auditLanguage,
      isConsistent: true,
      source: 'user-preference' as const
    }

    // Загружаем промт для гипотез с учетом языка
    let hypothesesPrompt = await LanguageManager.loadPromptForLanguage(
      PromptType.HYPOTHESES,
      languageContext
    )

    // Принудительно устанавливаем язык ответа
    hypothesesPrompt = LanguageManager.enforceResponseLanguage(
      hypothesesPrompt,
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

    // Мультиязычные метки для данных
    const dataLabels = {
      ru: {
        title: '**Данные для анализа:**',
        image: 'Изображение',
        context: 'Контекст аудита',
        projectContext: 'Контекст проекта',
        targetAudience: 'Целевая аудитория',
        analysisResult: 'Результат UX анализа',
        instruction: 'Сгенерируй гипотезы на основе этих данных.'
      },
      en: {
        title: '**Analysis Data:**',
        image: 'Image',
        context: 'Audit Context',
        projectContext: 'Project Context',
        targetAudience: 'Target Audience',
        analysisResult: 'UX Analysis Result',
        instruction: 'Generate hypotheses based on this data.'
      },
      ua: {
        title: '**Дані для аналізу:**',
        image: 'Зображення',
        context: 'Контекст аудиту',
        projectContext: 'Контекст проєкту',
        targetAudience: 'Цільова аудиторія',
        analysisResult: 'Результат UX аналізу',
        instruction: 'Згенеруй гіпотези на основі цих даних.'
      }
    }

    const labels = dataLabels[auditLanguage as keyof typeof dataLabels] || dataLabels.ru

    // Формируем промт с данными аудита
    const fullPrompt = `${hypothesesPrompt}

${labels.title}
- ${labels.image}: ${auditData.imageUrl}
- ${labels.context}: ${auditData.context}
- ${labels.projectContext}: ${auditData.projectContext}
- ${labels.targetAudience}: ${auditData.targetAudience}
- ${labels.analysisResult}: ${JSON.stringify(auditData.analysisResult, null, 2)}

${labels.instruction}`

    // Мультиязычные system messages
    const systemMessages = {
      ru: "Ты - Senior UX Researcher. Генерируй гипотезы в JSON формате.",
      en: "You are a Senior UX Researcher. Generate hypotheses in JSON format.",
      ua: "Ти - Senior UX Researcher. Генеруй гіпотези в JSON форматі."
    }

    const systemMessage = systemMessages[auditLanguage as keyof typeof systemMessages] || systemMessages.ru

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemMessage
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Парсим JSON ответ
    let hypothesesData: HypothesisResponse
    try {
      // Ищем JSON в ответе (может быть обернут в markdown)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        hypothesesData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json({ 
        error: 'Failed to parse hypotheses response',
        details: responseText 
      }, { status: 500 })
    }

    // Сохраняем результат гипотез в базу
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        result_data: {
          ...audit.result_data,
          hypotheses: hypothesesData
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save hypotheses' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: hypothesesData
    })

  } catch (error) {
    console.error('Hypotheses generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}