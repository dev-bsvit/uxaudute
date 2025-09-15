import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔍 Проверяем баланс для пользователя:', userId)

    // Проверяем профиль пользователя
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, email, created_at')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Ошибка получения профиля:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Проверяем баланс пользователя
    const { data: balance, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Ошибка получения баланса:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    // Проверяем транзакции пользователя
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (transactionsError) {
      console.error('Ошибка получения транзакций:', transactionsError)
      return NextResponse.json({ error: transactionsError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      profile,
      balance: balance || null,
      transactions: transactions || [],
      hasBalance: !!balance,
      balanceAmount: balance?.balance || 0
    })

  } catch (error) {
    console.error('Error in GET /api/check-specific-balance:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
