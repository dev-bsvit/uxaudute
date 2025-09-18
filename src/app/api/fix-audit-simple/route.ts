import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId') || '37a9841e-b002-4b96-be78-1270396d5dad'
    const token = searchParams.get('token') || 'fa179d92-0a86-4922-89f0-4b60c16c01bb'

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправление аудита:', auditId, 'с токеном:', token)

    // Получаем аудит
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select('id, input_data')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return NextResponse.json({ error: 'Аудит не найден' }, { status: 404 })
    }

    console.log('✅ Аудит найден:', audit.id)
    console.log('🔍 Текущий input_data:', audit.input_data)

    // Обновляем input_data
    const updatedInputData = {
      ...audit.input_data,
      public_enabled: true,
      public_token: token
    }

    console.log('🔍 Обновляем input_data:', updatedInputData)

    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({ input_data: updatedInputData })
      .eq('id', auditId)

    if (updateError) {
      console.error('❌ Ошибка обновления:', updateError)
      return NextResponse.json({ error: 'Ошибка обновления', details: updateError.message }, { status: 500 })
    }

    // Проверяем обновление
    const { data: verifyAudit, error: verifyError } = await supabaseClient
      .from('audits')
      .select('input_data')
      .eq('id', auditId)
      .single()

    if (verifyError) {
      console.error('❌ Ошибка проверки:', verifyError)
    } else {
      console.log('✅ Проверка успешна:', verifyAudit.input_data)
    }

    const publicUrl = `https://uxaudute.vercel.app/public/audit/${auditId}?token=${token}`

    return NextResponse.json({
      success: true,
      message: 'Аудит исправлен успешно',
      auditId,
      token,
      publicUrl,
      debug: {
        originalInputData: audit.input_data,
        updatedInputData: verifyAudit?.input_data,
        publicEnabled: verifyAudit?.input_data?.public_enabled,
        publicToken: verifyAudit?.input_data?.public_token,
        tokensMatch: verifyAudit?.input_data?.public_token === token
      }
    })

  } catch (error) {
    console.error('❌ Ошибка в API fix-audit-simple:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
