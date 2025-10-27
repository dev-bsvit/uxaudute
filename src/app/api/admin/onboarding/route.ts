import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin API] Запрос на получение данных онбординга...')

    // Получаем данные онбординга с join к profiles для получения email
    const { data, error } = await supabase
      .from('user_onboarding')
      .select(`
        *,
        profiles!user_onboarding_user_id_fkey (
          email
        )
      `)
      .order('created_at', { ascending: false })

    console.log('📊 [Admin API] Получено записей:', data?.length || 0)

    if (error) {
      console.error('❌ [Admin API] Error fetching onboarding data:', error)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding data', details: error },
        { status: 500 }
      )
    }

    // Форматируем данные для добавления email
    const formattedData = data.map(item => ({
      ...item,
      user_email: item.profiles?.email || null
    }))

    console.log('✅ [Admin API] Возвращаем данные, записей:', formattedData.length)
    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('❌ [Admin API] Error in admin onboarding API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
