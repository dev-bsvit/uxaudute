import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK EXISTING USERS API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Проверяем существующих пользователей
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, is_test_account, trial_enabled')
      .limit(10)

    if (profilesError) {
      console.error('Error fetching profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch profiles', details: profilesError.message }, { status: 500 })
    }

    // Проверяем балансы
    const { data: balances, error: balancesError } = await supabaseClient
      .from('user_balances')
      .select('user_id, balance, grace_limit_used')
      .limit(10)

    if (balancesError) {
      console.error('Error fetching balances:', balancesError)
      return NextResponse.json({ error: 'Failed to fetch balances', details: balancesError.message }, { status: 500 })
    }

    // Проверяем транзакции
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .limit(10)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ error: 'Failed to fetch transactions', details: transactionsError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Existing users check completed',
      results: {
        profiles: profiles || [],
        balances: balances || [],
        transactions: transactions || [],
        counts: {
          profiles: profiles?.length || 0,
          balances: balances?.length || 0,
          transactions: transactions?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Error in check-existing-users API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
