import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST CREDITS ADDITION API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем пользователя с балансом
    const { data: balances, error: balancesError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .limit(1)

    if (balancesError || !balances || balances.length === 0) {
      return NextResponse.json({ error: 'No users with balances found' }, { status: 404 })
    }

    const userBalance = balances[0]
    const userId = userBalance.user_id
    const currentBalance = userBalance.balance

    console.log('Testing with user:', userId, 'current balance:', currentBalance)

    // Тест 1: Добавляем 10 кредитов
    const { data: addResult, error: addError } = await supabaseClient
      .rpc('add_credits', { 
        user_uuid: userId, 
        amount: 10,
        source: 'purchase',
        description: 'Test addition of credits'
      })

    console.log('Add result:', addResult, addError)

    if (addError) {
      return NextResponse.json({ 
        error: 'Failed to add credits', 
        details: addError.message 
      }, { status: 500 })
    }

    // Тест 2: Проверяем новый баланс
    const { data: newBalance, error: newBalanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (newBalanceError) {
      return NextResponse.json({ 
        error: 'Failed to get new balance', 
        details: newBalanceError.message 
      }, { status: 500 })
    }

    // Тест 3: Проверяем транзакции
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
    }

    return NextResponse.json({
      success: true,
      message: 'Credits addition test completed',
      results: {
        user_id: userId,
        balance_before: currentBalance,
        balance_after: newBalance.balance,
        added_amount: 10,
        add_result: addResult,
        transactions: transactions || []
      }
    })

  } catch (error) {
    console.error('Error in test-credits-addition API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

