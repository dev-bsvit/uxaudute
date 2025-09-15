import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем всех пользователей с детальной информацией
    const { data: users, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Ошибка получения пользователей:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Получаем информацию о балансах
    const userIds = users?.map(u => u.id) || []
    const { data: balances } = await supabaseClient
      .from('user_balances')
      .select('user_id, balance')
      .in('user_id', userIds)

    // Объединяем данные
    const usersWithBalances = users?.map(user => {
      const balance = balances?.find(b => b.user_id === user.id)
      return {
        ...user,
        balance: balance?.balance || 0,
        hasBalance: !!balance
      }
    })

    return NextResponse.json({
      success: true,
      users: usersWithBalances,
      total: usersWithBalances?.length || 0,
      debugInfo: {
        message: 'Проверьте логи в консоли браузера при входе через Google OAuth',
        instructions: [
          '1. Выйдите из аккаунта',
          '2. Войдите через Google OAuth',
          '3. Откройте консоль браузера (F12)',
          '4. Посмотрите на логи с эмодзи 🔍 и 🔄'
        ]
      }
    })

  } catch (error) {
    console.error('Ошибка API debug-auth-events:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
