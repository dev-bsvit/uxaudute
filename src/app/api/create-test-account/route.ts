import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Для тестирования создаем пользователя с фиксированными данными
    const email = `test-${Date.now()}@example.com`
    const password = 'test123456'

    // Создаем пользователя
    const { data: authData, error: authError } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined // Отключаем подтверждение email для тестирования
      }
    })

    if (authError) {
      console.error('Error creating user:', authError)
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'User creation failed' }, { status: 500 })
    }

    // Создаем профиль пользователя
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email!,
        full_name: 'Test User',
        is_test_account: true,
        trial_enabled: true,
        grace_limit_used: false
      })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
    }

    // Создаем баланс пользователя
    const { error: balanceError } = await supabaseClient
      .from('user_balances')
      .insert({
        user_id: authData.user.id,
        balance: 0,
        grace_limit_used: false
      })

    if (balanceError) {
      console.error('Error creating balance:', balanceError)
      return NextResponse.json({ error: 'Failed to create balance' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: authData.user.id,
      email: authData.user.email,
      is_test_account: true,
      message: 'Test account created successfully'
    })

  } catch (error) {
    console.error('Error in create-test-account API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
