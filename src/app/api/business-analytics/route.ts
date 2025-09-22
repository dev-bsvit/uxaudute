import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { BusinessAnalyticsResponse } from '@/lib/analysis-types'
import fs from 'fs'
import path from 'path'

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

    // Загружаем промт для бизнес аналитики
    const promptPath = path.join(process.cwd(), 'prompts', 'business-analytics-prompt.md')
    const businessAnalyticsPrompt = fs.readFileSync(promptPath, 'utf-8')

    // Подготавливаем данные для промта
    const auditData = {
      imageUrl: audit.screenshot_url,
      context: audit.context || '',
      projectContext: audit.projects?.context || '',
      targetAudience: audit.projects?.target_audience || '',
      analysisResult: audit.result_data
    }

    // Формируем промт с данными аудита
    const fullPrompt = `${businessAnalyticsPrompt}

**Данные для анализа:**
- Изображение: ${auditData.imageUrl}
- Контекст аудита: ${auditData.context}
- Контекст проекта: ${auditData.projectContext}
- Целевая аудитория: ${auditData.targetAudience}
- Результат UX анализа: ${JSON.stringify(auditData.analysisResult, null, 2)}

Сгенерируй бизнес аналитику на основе этих данных.`

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - Главный бизнес-аналитик и стратег с 15-летним опытом в цифровых продуктах. Отвечай ТОЛЬКО в формате JSON на русском языке."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 6000,
      response_format: { type: "json_object" }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Парсим JSON ответ
    let businessAnalyticsData: BusinessAnalyticsResponse
    try {
      businessAnalyticsData = JSON.parse(responseText)
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



