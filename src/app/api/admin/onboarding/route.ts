import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Admin API] Запрос на получение данных онбординга...')

    // Получаем данные онбординга
    const { data: onboardingData, error: onboardingError } = await supabase
      .from('user_onboarding')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('📊 [Admin API] Получено записей онбординга:', onboardingData?.length || 0)

    if (onboardingError) {
      console.error('❌ [Admin API] Error fetching onboarding data:', onboardingError)
      return NextResponse.json(
        { error: 'Failed to fetch onboarding data', details: onboardingError },
        { status: 500 }
      )
    }

    if (!onboardingData || onboardingData.length === 0) {
      console.log('ℹ️ [Admin API] Нет данных онбординга')
      return NextResponse.json({ success: true, data: [] })
    }

    // Получаем user_id всех пользователей
    const userIds = onboardingData.map(item => item.user_id)
    console.log('📊 [Admin API] Загружаем profiles для', userIds.length, 'пользователей')

    // Получаем profiles отдельным запросом
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id,email')
      .in('id', userIds)

    if (profilesError) {
      console.error('⚠️ [Admin API] Error fetching profiles:', profilesError)
      // Продолжаем без email
    }

    console.log('📊 [Admin API] Получено profiles:', profiles?.length || 0)

    // Создаем map для быстрого поиска email
    const emailMap = new Map(profiles?.map(p => [p.id, p.email]) || [])

    // Форматируем данные для добавления email
    const formattedData = onboardingData.map(item => ({
      ...item,
      user_email: emailMap.get(item.user_id) || null
    }))

    console.log('✅ [Admin API] Возвращаем данные, записей:', formattedData.length)
    return NextResponse.json({ success: true, data: formattedData })
  } catch (error) {
    console.error('❌ [Admin API] Error in admin onboarding API:', error)
    return NextResponse.json(
      { error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
