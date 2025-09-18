import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    const token = searchParams.get('token')

    if (!auditId) {
      return NextResponse.json({ error: 'auditId required' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Debug audit:', auditId, 'with token:', token)

    // Получаем аудит
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select('id, name, input_data')
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return NextResponse.json({ error: 'Аудит не найден' }, { status: 404 })
    }

    console.log('✅ Аудит найден:', audit.name)
    console.log('🔍 Input data:', audit.input_data)

    // Проверяем публичный доступ
    const isPublicEnabled = audit.input_data?.public_enabled
    const publicToken = audit.input_data?.public_token
    
    console.log('🔍 Public access check:', {
      isPublicEnabled,
      publicToken,
      providedToken: token,
      tokensMatch: publicToken === token
    })

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        name: audit.name,
        input_data: audit.input_data,
        public_enabled: isPublicEnabled,
        public_token: publicToken,
        provided_token: token,
        tokens_match: publicToken === token,
        access_granted: isPublicEnabled && publicToken === token
      }
    })

  } catch (error) {
    console.error('❌ Ошибка в API debug-audit:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
