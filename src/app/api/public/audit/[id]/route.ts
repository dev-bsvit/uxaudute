import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditId = params.id
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Токен доступа не предоставлен' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Получение публичного аудита:', auditId, 'с токеном:', token)

    // Получаем аудит по ID и токену
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select(`
        id,
        name,
        type,
        status,
        input_data,
        result_data,
        annotations,
        confidence,
        created_at,
        updated_at,
        public_enabled,
        public_token,
        projects!inner(
          id,
          name,
          description
        )
      `)
      .eq('id', auditId)
      .eq('public_token', token)
      .eq('public_enabled', true)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден или публичный доступ отключен:', auditError)
      return NextResponse.json({ error: 'Аудит не найден или доступ запрещен' }, { status: 404 })
    }

    console.log('✅ Публичный аудит получен:', audit.name)

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        name: audit.name,
        type: audit.type,
        status: audit.status,
        input_data: audit.input_data,
        result_data: audit.result_data,
        annotations: audit.annotations,
        confidence: audit.confidence,
        created_at: audit.created_at,
        updated_at: audit.updated_at,
        project: audit.projects
      }
    })

  } catch (error) {
    console.error('❌ Ошибка получения публичного аудита:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
