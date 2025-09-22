import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditId = params.id
    console.log('🧪 Тестируем конкретный аудит:', auditId)
    
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    // Простой запрос без всех полей
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select('id, name, type, status')
      .eq('id', auditId)
      .single()
    
    console.log('🔍 Результат простого запроса:', { audit, auditError })
    
    if (auditError) {
      return NextResponse.json({
        error: 'Audit query failed',
        details: auditError.message,
        code: auditError.code,
        hint: auditError.hint
      }, { status: 500 })
    }
    
    // Теперь полный запрос
    const { data: fullAudit, error: fullError } = await supabaseClient
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
        public_enabled,
        public_token,
        created_at,
        updated_at,
        project_id
      `)
      .eq('id', auditId)
      .single()
    
    console.log('🔍 Результат полного запроса:', { 
      hasFullAudit: !!fullAudit, 
      hasFullError: !!fullError,
      fullErrorMessage: fullError?.message,
      fullErrorCode: fullError?.code
    })
    
    return NextResponse.json({
      success: true,
      simpleAudit: audit,
      fullAudit: fullAudit,
      fullError: fullError ? {
        message: fullError.message,
        code: fullError.code,
        hint: fullError.hint
      } : null
    })
    
  } catch (error) {
    console.error('❌ Ошибка тестирования аудита:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
