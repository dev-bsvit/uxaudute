import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 API ensure-user-balance вызван')
    console.log('🔍 Время вызова API:', new Date().toISOString())
    
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Supabase клиент создан')
    
    const { userId } = await request.json()
    console.log('🔍 Получен userId из запроса:', userId)

    if (!userId) {
      console.error('❌ userId не предоставлен')
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔍 ensureUserHasInitialBalance API вызвана для пользователя:', userId)
    
    // Проверяем, есть ли уже баланс у пользователя
    const { data: existingBalance, error: checkError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    console.log('📊 Результат проверки баланса:', { existingBalance, checkError })

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows found, это нормально
      console.error('❌ Ошибка проверки баланса:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    // Если баланса НЕТ (новый пользователь), создаем начальный баланс
    // НЕ поповнюємо якщо баланс просто = 0 (користувач витратив кредити)
    if (!existingBalance) {
      console.log('💰 Создаем начальный баланс для НОВОГО пользователя:', userId)

      // Создаем новый баланс с 5 кредитами
      const { data: balanceData, error: balanceError } = await supabaseClient
        .from('user_balances')
        .insert({
          user_id: userId,
          balance: 5,
          grace_limit_used: false
        })
        .select()

      console.log('📊 Результат создания баланса:', { balanceData, balanceError })

      if (balanceError) {
        console.error('❌ Ошибка создания начального баланса:', balanceError)
        return NextResponse.json({ error: balanceError.message }, { status: 500 })
      }

      // Создаем транзакцию для начального баланса
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: 5,
          balance_after: 5,
          source: 'manual',
          description: 'Добро пожаловать! Начальный баланс 5 кредитов'
        })
        .select()

      console.log('📊 Результат создания транзакции:', { transactionData, transactionError })

      if (transactionError) {
        console.error('❌ Ошибка создания транзакции:', transactionError)
        return NextResponse.json({ error: transactionError.message }, { status: 500 })
      }

      console.log('✅ Начальный баланс создан для пользователя:', userId)

      return NextResponse.json({ 
        success: true, 
        message: 'Начальный баланс создан успешно',
        balance: balanceData?.[0],
        transaction: transactionData?.[0]
      })
    } else {
      console.log('ℹ️ У пользователя уже есть баланс:', existingBalance.balance)
      return NextResponse.json({ 
        success: true, 
        message: 'У пользователя уже есть баланс',
        balance: existingBalance.balance
      })
    }

  } catch (error) {
    console.error('❌ Ошибка при создании начального баланса:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
