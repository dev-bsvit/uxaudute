import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Проверяем структуру таблицы user_balances...')

    // Пробуем получить данные из таблицы
    const { data, error } = await supabaseClient
      .from('user_balances')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error fetching from user_balances:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code
      })
    }

    console.log('✅ Данные получены успешно:', data)

    return NextResponse.json({
      success: true,
      message: 'Таблица user_balances доступна',
      sample_data: data
    })

  } catch (error) {
    console.error('Error in check table structure:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
