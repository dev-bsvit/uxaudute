import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DISABLE RLS TEMPORARILY API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Проверяем текущий статус RLS
    const { data: currentStatus, error: statusError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .limit(1)

    console.log('Current access to user_balances:', { data: currentStatus, error: statusError })

    // Проверяем доступ к балансам
    const { data: balances, error: balancesError } = await supabaseClient
      .from('user_balances')
      .select('*')

    console.log('All balances:', { data: balances, error: balancesError })

    // Проверяем доступ к транзакциям
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')

    console.log('All transactions:', { data: transactions, error: transactionsError })

    return NextResponse.json({
      success: true,
      message: 'RLS status checked',
      results: {
        user_balances_access: {
          data: currentStatus,
          error: statusError?.message || null
        },
        all_balances: {
          data: balances,
          error: balancesError?.message || null,
          count: balances?.length || 0
        },
        all_transactions: {
          data: transactions,
          error: transactionsError?.message || null,
          count: transactions?.length || 0
        }
      }
    })

  } catch (error) {
    console.error('Error in disable-rls-temporarily API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
