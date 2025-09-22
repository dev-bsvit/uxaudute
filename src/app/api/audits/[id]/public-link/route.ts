import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getAudit } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditId = params.id
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔗 Создание публичной ссылки для аудита:', auditId)

    // Получаем аудит
    const audit = await getAudit(auditId)
    if (!audit) {
      return NextResponse.json({ error: 'Аудит не найден' }, { status: 404 })
    }

    // Генерируем публичный токен
    const publicToken = crypto.randomUUID()
    
    // Временно используем поле input_data для хранения публичного токена
    const { data: currentAudit, error: fetchError } = await supabaseClient
      .from('audits')
      .select('input_data')
      .eq('id', auditId)
      .single()

    if (fetchError) {
      console.error('❌ Ошибка получения аудита:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Обновляем input_data с публичным токеном
    const currentInputData = currentAudit.input_data || {}
    const updatedInputData = {
      ...currentInputData,
      public_token: publicToken,
      public_enabled: true
    }

    console.log('🔍 Debug info:', {
      auditId,
      currentInputData,
      updatedInputData,
      publicToken
    })

    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({ 
        input_data: updatedInputData,
        public_enabled: true,
        public_token: publicToken
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('❌ Ошибка создания публичной ссылки:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Дополнительная проверка - получаем обновленный аудит
    const { data: updatedAudit, error: verifyError } = await supabaseClient
      .from('audits')
      .select('input_data')
      .eq('id', auditId)
      .single()

    if (verifyError) {
      console.error('❌ Ошибка проверки обновления:', verifyError)
    } else {
      console.log('✅ Аудит обновлен, проверяем:', updatedAudit.input_data)
    }

    // Формируем публичную ссылку
    const publicUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://uxaudute.vercel.app'}/public/audit/${auditId}?token=${publicToken}`

    console.log('✅ Публичная ссылка создана:', publicUrl)

    return NextResponse.json({
      success: true,
      publicUrl: publicUrl,
      token: publicToken
    })

  } catch (error) {
    console.error('❌ Ошибка создания публичной ссылки:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditId = params.id
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔒 Отключение публичной ссылки для аудита:', auditId)

    // Отключаем публичный доступ
    const { error: updateError } = await supabaseClient
      .from('audits')
      .update({ 
        public_enabled: false,
        public_token: null
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('❌ Ошибка отключения публичной ссылки:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    console.log('✅ Публичная ссылка отключена для аудита:', auditId)

    return NextResponse.json({
      success: true,
      message: 'Публичная ссылка отключена'
    })

  } catch (error) {
    console.error('❌ Ошибка отключения публичной ссылки:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
