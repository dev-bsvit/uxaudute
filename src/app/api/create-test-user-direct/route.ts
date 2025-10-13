import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CREATE TEST USER DIRECT API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Создаем пользователя через Supabase Auth
    const testEmail = `test${Date.now()}@gmail.com`
    const testPassword = 'test123456'

    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        emailRedirectTo: undefined // Отключаем подтверждение email для тестирования
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json({ error: 'Failed to create user', details: authError.message }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    const testUserId = authData.user.id

    // Создаем профиль пользователя
    const { data: profileData, error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        is_test_account: true,
        trial_enabled: true,
        grace_limit_used: false
      })
      .select()
      .single()

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile', details: profileError.message }, { status: 500 })
    }

    // Создаем баланс пользователя
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .insert({
        user_id: testUserId,
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
        user_id: testUserId,
        transaction_type: 'credit',
        amount: 5,
        source: 'trial',
        description: 'Initial trial credits',
        balance_before: 0,
        balance_after: 5
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: 'Failed to create transaction', details: transactionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: testUserId,
      email: testEmail,
      profile: profileData,
      balance: balanceData,
      transaction: transactionData,
      message: 'Test user created successfully with 5 credits'
    })

  } catch (error) {
    console.error('Error in create-test-user-direct API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
