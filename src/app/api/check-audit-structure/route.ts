import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Проверяем структуру таблицы audits...')

    // Получаем один аудит для проверки полей
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select('*')
      .limit(1)
      .single()

    if (auditError) {
      console.error('❌ Ошибка получения аудита:', auditError)
      return NextResponse.json({ 
        error: 'Ошибка получения аудита', 
        details: auditError.message 
      }, { status: 500 })
    }

    console.log('✅ Аудит получен, проверяем поля...')
    
    // Проверяем наличие полей
    const hasPublicEnabled = 'public_enabled' in audit
    const hasPublicToken = 'public_token' in audit
    
    console.log('🔍 Результат проверки:', {
      hasPublicEnabled,
      hasPublicToken,
      auditKeys: Object.keys(audit)
    })

    return NextResponse.json({
      success: true,
      hasPublicEnabled,
      hasPublicToken,
      auditKeys: Object.keys(audit),
      sampleAudit: {
        id: audit.id,
        name: audit.name,
        public_enabled: audit.public_enabled,
        public_token: audit.public_token,
        input_data_public_enabled: audit.input_data?.public_enabled,
        input_data_public_token: audit.input_data?.public_token
      }
    })

  } catch (error) {
    console.error('❌ Ошибка в API check-audit-structure:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
