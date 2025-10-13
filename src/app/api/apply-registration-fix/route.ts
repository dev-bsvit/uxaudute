import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Читаем SQL миграцию
    const migrationPath = join(process.cwd(), 'migrations', 'fix_user_registration_credits.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf-8')

    console.log('Применяем миграцию для исправления регистрации пользователей...')

    // Выполняем миграцию
    const { data, error } = await supabaseClient.rpc('execute_sql_query', { 
      query_text: migrationSQL 
    })

    if (error) {
      console.error('Ошибка применения миграции:', error)
      return NextResponse.json({ 
        error: 'Ошибка применения миграции', 
        details: error.message 
      }, { status: 500 })
    }

    console.log('✅ Миграция применена успешно')

    return NextResponse.json({ 
      success: true, 
      message: 'Миграция для исправления регистрации пользователей применена успешно',
      data: data
    })

  } catch (error) {
    console.error('Error in POST /api/apply-registration-fix:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

