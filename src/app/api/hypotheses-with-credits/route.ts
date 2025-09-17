import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { HypothesisResponse } from '@/lib/analysis-types'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'
import fs from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('=== HYPOTHESES WITH CREDITS API вызван ===')
    const { auditId } = await request.json()

    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
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

    // Проверяем кредиты перед запуском генерации гипотез
    console.log('🔍 Проверяем кредиты для пользователя:', user.id)
    console.log('🔍 Тип аудита: hypotheses')
    
    const creditsCheck = await checkCreditsForAudit(user.id, 'hypotheses')
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

    // Загружаем промт для гипотез
    const promptPath = path.join(process.cwd(), 'prompts', 'hypotheses-prompt.md')
    const hypothesesPrompt = fs.readFileSync(promptPath, 'utf-8')

    // Подготавливаем данные для промта
    const auditData = {
      imageUrl: audit.screenshot_url,
      context: audit.context || '',
      projectContext: audit.projects?.context || '',
      targetAudience: audit.projects?.target_audience || '',
      analysisResult: audit.result_data
    }

    // Формируем промт с данными аудита
    const fullPrompt = `${hypothesesPrompt}

**Данные для анализа:**
- Изображение: ${auditData.imageUrl}
- Контекст аудита: ${auditData.context}
- Контекст проекта: ${auditData.projectContext}
- Целевая аудитория: ${auditData.targetAudience}
- Результат UX анализа: ${JSON.stringify(auditData.analysisResult, null, 2)}

Сгенерируй гипотезы на основе этих данных.`

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Ты - Senior UX Researcher. Генерируй гипотезы в JSON формате."
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

    // Списываем кредиты после успешного выполнения генерации гипотез
    console.log('Списываем кредиты за генерацию гипотез:', auditId)
    const deductResult = await deductCreditsForAudit(
      user.id,
      'hypotheses',
      auditId,
      `Hypotheses generation for audit: ${audit.name}`
    )

    if (!deductResult.success) {
      console.error('Ошибка списания кредитов:', deductResult)
      // Не прерываем выполнение, так как гипотезы уже сгенерированы
    } else {
      console.log('✅ Кредиты успешно списаны:', deductResult)
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({
      success: true,
      data: hypothesesData,
      credits_info: {
        deducted: true,
        is_test_account: creditsCheck.isTestAccount,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance
      }
    })

  } catch (error) {
    console.error('Ошибка в hypotheses-with-credits API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
