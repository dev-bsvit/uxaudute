import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔍 Проверяем статус пользователя:', userId)

    // Проверяем в auth.users
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (authError) {
      console.error('❌ Ошибка получения пользователя из auth:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    if (!authUser.user) {
      return NextResponse.json({ error: 'User not found in auth' }, { status: 404 })
    }

    // Проверяем профиль
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    // Проверяем баланс
    const { data: balance, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    // Проверяем транзакции
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    console.log('📊 Статус пользователя:', {
      email: authUser.user.email,
      hasProfile: !!profile,
      hasBalance: !!balance,
      balance: balance?.balance || 0,
      transactionsCount: transactions?.length || 0
    })

    return NextResponse.json({
      success: true,
      user: {
        id: authUser.user.id,
        email: authUser.user.email,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        user_metadata: authUser.user.user_metadata
      },
      profile: profile || null,
      balance: balance || null,
      transactions: transactions || [],
      status: {
        hasProfile: !!profile,
        hasBalance: !!balance,
        balanceAmount: balance?.balance || 0,
        transactionsCount: transactions?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Ошибка проверки пользователя:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

