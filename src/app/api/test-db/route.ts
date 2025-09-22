import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🧪 Тестируем подключение к базе данных')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('🔍 Переменные окружения:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!serviceRoleKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: serviceRoleKey?.length || 0
    })
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        hasUrl: !!supabaseUrl,
        hasServiceKey: !!serviceRoleKey
      }, { status: 500 })
    }
    
    const supabaseClient = createClient(supabaseUrl, serviceRoleKey)
    console.log('✅ Supabase клиент создан')
    
    // Простой запрос к базе
    const { data, error } = await supabaseClient
      .from('audits')
      .select('id, name')
      .limit(1)
    
    console.log('🔍 Результат тестового запроса:', { data, error })
    
    if (error) {
      return NextResponse.json({
        error: 'Database query failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      sampleData: data
    })
    
  } catch (error) {
    console.error('❌ Ошибка тестирования БД:', error)
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
