import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId, amount, source, description } = await request.json()

    if (!userId || !amount) {
      return NextResponse.json({ error: 'userId and amount are required' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем текущий баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('Error checking balance:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    const currentBalance = balanceData?.balance || 0
    const newBalance = currentBalance + amount

    // Обновляем баланс
    const { error: updateError } = await supabaseClient
      .from('user_balances')
      .update({
        balance: newBalance,
        grace_limit_used: false
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: amount > 0 ? 'credit' : 'debit',
        amount: amount,
        balance_after: newBalance,
        source: source || 'purchase',
        description: description || 'Manual credit adjustment'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Credits added successfully',
      balance_before: currentBalance,
      balance_after: newBalance,
      amount_added: amount
    })

  } catch (error) {
    console.error('Error in POST /api/add-credits:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
