import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем список пользователей из таблицы profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (profilesError) {
      console.error('Ошибка получения профилей:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Получаем список пользователей с балансами
    const { data: balances, error: balancesError } = await supabaseClient
      .from('user_balances')
      .select('user_id, balance')
      .order('created_at', { ascending: false })

    if (balancesError) {
      console.error('Ошибка получения балансов:', balancesError)
      return NextResponse.json({ error: balancesError.message }, { status: 500 })
    }

    // Объединяем данные
    console.log('📊 Профили:', profiles?.length)
    console.log('💰 Балансы:', balances?.length)
    
    const usersWithBalances = profiles?.map(profile => {
      const userBalance = balances?.find(balance => balance.user_id === profile.id)
      console.log(`👤 ${profile.email}: balance=${userBalance?.balance || 0}`)
      return {
        ...profile,
        hasBalance: !!userBalance,
        balance: userBalance?.balance || 0
      }
    })

    return NextResponse.json({ 
      success: true, 
      users: usersWithBalances,
      total: profiles?.length || 0
    })

  } catch (error) {
    console.error('Error in GET /api/list-users:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
