import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    console.log('🔧 Исправляем баланс для пользователя:', email)

    // Находим пользователя по email
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single()

    if (profileError) {
      console.error('❌ Ошибка получения профиля:', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('👤 Найден профиль:', profile)

    // Проверяем, есть ли баланс
    const { data: balance, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', profile.id)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Ошибка получения баланса:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    console.log('💰 Текущий баланс:', balance)

    // Создаем баланс если его нет
    if (!balance) {
      console.log('💰 Создаем баланс с 5 кредитами')
      
      const { error: createBalanceError } = await supabaseClient
        .from('user_balances')
        .insert({
          user_id: profile.id,
          balance: 5,
          grace_limit_used: false
        })

      if (createBalanceError) {
        console.error('❌ Ошибка создания баланса:', createBalanceError)
        return NextResponse.json({ error: createBalanceError.message }, { status: 500 })
      }

      // Создаем транзакцию
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: profile.id,
          type: 'credit',
          amount: 5,
          balance_after: 5,
          source: 'manual_fix',
          description: 'Исправление - начальные 5 кредитов'
        })

      if (transactionError) {
        console.error('❌ Ошибка создания транзакции:', transactionError)
        return NextResponse.json({ error: transactionError.message }, { status: 500 })
      }

      console.log('✅ Баланс создан успешно')

      return NextResponse.json({
        success: true,
        message: 'Баланс создан успешно',
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name
        },
        balance: 5,
        action: 'created'
      })
    } else {
      console.log('✅ Баланс уже существует:', balance.balance)
      
      return NextResponse.json({
        success: true,
        message: 'Баланс уже существует',
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name
        },
        balance: balance.balance,
        action: 'no_change'
      })
    }

  } catch (error) {
    console.error('❌ Ошибка исправления пользователя:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

