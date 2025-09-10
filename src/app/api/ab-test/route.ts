import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { ABTestResponse } from '@/lib/analysis-types'
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

    // Загружаем промт для AB тестов
    const promptPath = path.join(process.cwd(), 'prompts', 'ab-test-prompt.md')
    const abTestPrompt = fs.readFileSync(promptPath, 'utf-8')

    // Подготавливаем данные для промта
    const auditData = {
      imageUrl: audit.screenshot_url,
      context: audit.context || '',
      projectContext: audit.projects?.context || '',
      targetAudience: audit.projects?.target_audience || '',
      analysisResult: audit.result_data
    }

    // Формируем промт с данными аудита
    const fullPrompt = `${abTestPrompt}

**Данные для анализа:**
- Изображение: ${auditData.imageUrl}
- Контекст аудита: ${auditData.context}
- Контекст проекта: ${auditData.projectContext}
- Целевая аудитория: ${auditData.targetAudience}
- Результат UX анализа: ${JSON.stringify(auditData.analysisResult, null, 2)}

Сгенерируй AB тесты на основе этих данных.`

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - Senior UI/UX & CRO консультант. Генерируй AB тесты в JSON формате."
        },
        {
          role: "user",
          content: fullPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4000
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from OpenAI')
    }

    // Парсим JSON ответ
    let abTestData: ABTestResponse
    try {
      // Ищем JSON в ответе (может быть обернут в markdown)
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                       responseText.match(/\{[\s\S]*\}/)
      
      if (jsonMatch) {
        abTestData = JSON.parse(jsonMatch[1] || jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Response text:', responseText)
      return NextResponse.json({ 
        error: 'Failed to parse AB test response',
        details: responseText 
      }, { status: 500 })
    }

    // Сохраняем результат AB тестов в базу
    const { error: updateError } = await supabase
      .from('audits')
      .update({
        result_data: {
          ...audit.result_data,
          ab_tests: abTestData
        }
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Database update error:', updateError)
      return NextResponse.json({ 
        error: 'Failed to save AB tests' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: abTestData
    })

  } catch (error) {
    console.error('AB test generation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
