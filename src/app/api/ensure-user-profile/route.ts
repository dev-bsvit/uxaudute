import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId, email, fullName, avatarUrl } = await request.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'userId and email are required' }, { status: 400 })
    }

    console.log('🔧 Создаем профиль для пользователя:', email, userId)

    // Проверяем, есть ли уже профиль
    const { data: existingProfile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Ошибка проверки профиля:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    if (existingProfile) {
      console.log('✅ Профиль уже существует:', existingProfile)
      return NextResponse.json({
        success: true,
        message: 'Профиль уже существует',
        profile: existingProfile,
        action: 'no_change'
      })
    }

    // Создаем профиль
    const { data: newProfile, error: createProfileError } = await supabaseClient
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        full_name: fullName || null,
        avatar_url: avatarUrl || null
      })
      .select()
      .single()

    if (createProfileError) {
      console.error('❌ Ошибка создания профиля:', createProfileError)
      return NextResponse.json({ error: createProfileError.message }, { status: 500 })
    }

    console.log('✅ Профиль создан:', newProfile)

    // Создаем баланс
    const { data: balance, error: createBalanceError } = await supabaseClient
      .from('user_balances')
      .insert({
        user_id: userId,
        balance: 5,
        grace_limit_used: false
      })
      .select()
      .single()

    if (createBalanceError) {
      console.error('❌ Ошибка создания баланса:', createBalanceError)
      return NextResponse.json({ error: createBalanceError.message }, { status: 500 })
    }

    console.log('✅ Баланс создан:', balance)

    // Создаем транзакцию
    const { data: transaction, error: createTransactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'credit',
        amount: 5,
        balance_after: 5,
        source: 'manual_creation',
        description: 'Создание профиля - начальные 5 кредитов'
      })
      .select()
      .single()

    if (createTransactionError) {
      console.error('❌ Ошибка создания транзакции:', createTransactionError)
      return NextResponse.json({ error: createTransactionError.message }, { status: 500 })
    }

    console.log('✅ Транзакция создана:', transaction)

    return NextResponse.json({
      success: true,
      message: 'Профиль, баланс и транзакция созданы успешно',
      profile: newProfile,
      balance: balance,
      transaction: transaction,
      action: 'created'
    })

  } catch (error) {
    console.error('❌ Ошибка создания профиля:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

