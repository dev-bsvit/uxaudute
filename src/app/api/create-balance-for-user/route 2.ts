import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE BALANCE FOR USER API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем первого пользователя
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, full_name, is_test_account, trial_enabled')
      .limit(1)

    if (profilesError || !profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'No users found' }, { status: 404 })
    }

    const user = profiles[0]
    const userId = user.id

    // Проверяем, есть ли уже баланс
    const { data: existingBalance, error: balanceCheckError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (existingBalance) {
      return NextResponse.json({
        success: true,
        message: 'User already has balance',
        user: user,
        balance: existingBalance
      })
    }

    // Создаем баланс пользователя
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .insert({
        user_id: userId,
        balance: 5, // Даем 5 бесплатных кредитов
        grace_limit_used: false
      })
      .select()
      .single()

    if (balanceError) {
      console.error('Error creating balance:', balanceError)
      return NextResponse.json({ error: 'Failed to create balance', details: balanceError.message }, { status: 500 })
    }

    // Создаем транзакцию для начальных кредитов
    const { data: transactionData, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        amount: 5,
        source: 'trial',
        description: 'Initial trial credits'
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction', details: transactionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: user,
      balance: balanceData,
      transaction: transactionData,
      message: 'Balance created successfully with 5 credits'
    })

  } catch (error) {
    console.error('Error in create-balance-for-user API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
