import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { auditId, token } = await request.json()
    
    if (!auditId || !token) {
      return NextResponse.json({ error: 'auditId and token required' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем публичный доступ для аудита:', auditId)

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

    // Обновляем input_data
    const currentInputData = audit.input_data || {}
    const updatedInputData = {
      ...currentInputData,
      public_enabled: true,
      public_token: token
    }

    console.log('🔍 Обновляем input_data:', {
      current: currentInputData,
      updated: updatedInputData
    })

    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({ input_data: updatedInputData })
      .eq('id', auditId)

    if (updateError) {
      console.error('❌ Ошибка обновления:', updateError)
      return NextResponse.json({ error: 'Ошибка обновления' }, { status: 500 })
    }

    console.log('✅ Публичный доступ исправлен для аудита:', auditId)

    return NextResponse.json({
      success: true,
      message: 'Публичный доступ исправлен',
      auditId,
      token,
      publicUrl: `https://uxaudute.vercel.app/public/audit/${auditId}?token=${token}`
    })

  } catch (error) {
    console.error('❌ Ошибка в API fix-audit-public:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
