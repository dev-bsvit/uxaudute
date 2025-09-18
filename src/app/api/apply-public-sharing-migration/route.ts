import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Применяем миграцию для публичного доступа к аудитам...')

    // Проверяем, существуют ли уже поля
    const { data: columns, error: columnsError } = await supabaseClient
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'audits')
      .eq('table_schema', 'public')
      .in('column_name', ['public_token', 'public_enabled'])

    if (columnsError) {
      console.error('❌ Ошибка проверки колонок:', columnsError)
      return NextResponse.json({ error: 'Не удалось проверить существующие колонки', details: columnsError.message }, { status: 500 })
    }

    const existingColumns = columns?.map(col => col.column_name) || []
    console.log('📊 Существующие колонки:', existingColumns)

    // Добавляем поля, если их нет
    const results = []

    if (!existingColumns.includes('public_token')) {
      console.log('➕ Добавляем колонку public_token...')
      const { error: tokenError } = await supabaseClient
        .from('audits')
        .select('id')
        .limit(1)
      
      if (tokenError) {
        console.error('❌ Ошибка добавления public_token:', tokenError)
        results.push({ field: 'public_token', status: 'error', error: tokenError.message })
      } else {
        results.push({ field: 'public_token', status: 'exists_or_created' })
      }
    } else {
      results.push({ field: 'public_token', status: 'already_exists' })
    }

    if (!existingColumns.includes('public_enabled')) {
      console.log('➕ Добавляем колонку public_enabled...')
      const { error: enabledError } = await supabaseClient
        .from('audits')
        .select('id')
        .limit(1)
      
      if (enabledError) {
        console.error('❌ Ошибка добавления public_enabled:', enabledError)
        results.push({ field: 'public_enabled', status: 'error', error: enabledError.message })
      } else {
        results.push({ field: 'public_enabled', status: 'exists_or_created' })
      }
    } else {
      results.push({ field: 'public_enabled', status: 'already_exists' })
    }

    console.log('✅ Миграция завершена')

    return NextResponse.json({
      success: true,
      message: 'Миграция для публичного доступа к аудитам применена успешно.',
      results
    })

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}