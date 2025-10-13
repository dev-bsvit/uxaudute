import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем список всех пользователей с их балансами
    const { data: users, error: usersError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        created_at,
        user_balances (
          balance,
          grace_limit_used,
          created_at
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (usersError) {
      console.error('Ошибка получения пользователей:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    // Получаем статистику
    const { data: stats, error: statsError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .gte('balance', 0)

    if (statsError) {
      console.error('Ошибка получения статистики:', statsError)
    }

    const totalUsers = users?.length || 0
    const usersWithBalance = users?.filter(u => u.user_balances && u.user_balances.length > 0).length || 0
    const usersWithoutBalance = totalUsers - usersWithBalance
    const totalCredits = stats?.reduce((sum, s) => sum + (s.balance || 0), 0) || 0

    return NextResponse.json({
      success: true,
      summary: {
        totalUsers,
        usersWithBalance,
        usersWithoutBalance,
        totalCredits,
        averageCredits: usersWithBalance > 0 ? Math.round(totalCredits / usersWithBalance) : 0
      },
      recentUsers: users?.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        createdAt: user.created_at,
        hasBalance: user.user_balances && user.user_balances.length > 0,
        balance: user.user_balances?.[0]?.balance || 0,
        balanceCreatedAt: user.user_balances?.[0]?.created_at
      })) || []
    })

  } catch (error) {
    console.error('Error in GET /api/test-registration-credits:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

