import { NextRequest, NextResponse } from 'next/server'
import { openai } from '@/lib/openai'
import { supabase } from '@/lib/supabase'
import { ABTestResponse } from '@/lib/analysis-types'
import { checkCreditsForAudit, deductCreditsForAudit } from '@/lib/credits'
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'

export async function POST(request: NextRequest) {
  try {
    console.log('=== AB TEST WITH CREDITS API вызван ===')
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

    // Проверяем кредиты перед запуском AB теста
    console.log('🔍 Проверяем кредиты для пользователя:', user.id)
    console.log('🔍 Тип аудита: ab_test')
    
    const creditsCheck = await checkCreditsForAudit(user.id, 'ab_test')
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
    LanguageManager.logLanguageContext(languageContext, 'AB Test API')

    // Загружаем промт для AB тестов с учетом языка
    let abTestPrompt = await LanguageManager.loadPromptForLanguage(
      PromptType.AB_TEST,
      languageContext
    )

    // Принудительно устанавливаем язык ответа
    abTestPrompt = LanguageManager.enforceResponseLanguage(
      abTestPrompt,
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
    const fullPrompt = `${abTestPrompt}

**Данные для анализа:**
- Изображение: ${auditData.imageUrl}
- Контекст аудита: ${auditData.context}
- Контекст проекта: ${auditData.projectContext}
- Целевая аудитория: ${auditData.targetAudience}
- Результат UX анализа: ${JSON.stringify(auditData.analysisResult, null, 2)}

Сгенерируй AB тесты на основе этих данных.`

    // Формируем system message с учетом языка
    const languageInstruction = languageContext.responseLanguage === 'en'
      ? 'CRITICAL: You MUST respond in ENGLISH ONLY. DO NOT use Russian, Ukrainian, or any other language. All problems, hypotheses, solutions, tasks, metrics, risks, assumptions, and next steps MUST be in English.'
      : 'КРИТИЧНО: Ты ДОЛЖЕН отвечать ТОЛЬКО на русском языке. НЕ используй английский или другие языки.'

    // Отправляем запрос к OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a Senior UI/UX & CRO consultant. Generate AB tests in JSON format. ${languageInstruction}`
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

    // Списываем кредиты после успешного выполнения AB теста
    console.log('Списываем кредиты за AB тест:', auditId)
    const deductResult = await deductCreditsForAudit(
      user.id,
      'ab_test',
      auditId,
      `AB Test generation for audit: ${audit.name}`
    )

    if (!deductResult.success) {
      console.error('Ошибка списания кредитов:', deductResult)
      // Не прерываем выполнение, так как AB тест уже выполнен
    } else {
      console.log('✅ Кредиты успешно списаны:', deductResult)
    }

    console.log('Возвращаем успешный ответ...')
    return NextResponse.json({
      success: true,
      data: abTestData,
      credits_info: {
        deducted: true,
        is_test_account: creditsCheck.isTestAccount,
        required_credits: creditsCheck.requiredCredits,
        current_balance: creditsCheck.currentBalance
      }
    })

  } catch (error) {
    console.error('Ошибка в ab-test-with-credits API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
