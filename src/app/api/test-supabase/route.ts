import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/test-supabase - Тест подключения к Supabase
export async function GET(request: NextRequest) {
  try {
    console.log('Testing Supabase connection...')
    
    // Проверяем переменные окружения
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
    console.log('Service Role Key:', serviceRoleKey ? 'Set' : 'Missing')
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: 'Missing environment variables',
        supabaseUrl: !!supabaseUrl,
        serviceRoleKey: !!serviceRoleKey
      }, { status: 500 })
    }

    // Тестируем подключение - простой запрос к таблице audits
    const { data, error, count } = await supabaseAdmin
      .from('audits')
      .select('id, annotations', { count: 'exact' })
      .limit(1)

    if (error) {
      console.error('Supabase connection error:', error)
      return NextResponse.json({ 
        error: 'Supabase connection failed',
        details: error.message,
        code: error.code
      }, { status: 500 })
    }

    console.log('Supabase connection successful!')
    console.log('Total audits:', count)
    console.log('Sample data:', data)

    return NextResponse.json({ 
      success: true,
      message: 'Supabase connection successful',
      totalAudits: count,
      sampleData: data
    })

  } catch (error) {
    console.error('Error in test-supabase:', error)
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
