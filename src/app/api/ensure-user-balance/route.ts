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

    // Проверяем, есть ли уже НАЧИСЛЕНИЕ начальных кредитов (транзакция с описанием "Начальный баланс")
    const { data: initialTransaction, error: transactionCheckError } = await supabaseClient
      .from('transactions')
      .select('id')
      .eq('user_id', userId)
      .ilike('description', '%Начальный баланс%')
      .limit(1)

    console.log('📊 Проверка начальной транзакции:', { initialTransaction, transactionCheckError })

    // Если уже была транзакция начального баланса - не начисляем повторно
    if (initialTransaction && initialTransaction.length > 0) {
      console.log('ℹ️ Начальные кредиты уже были начислены этому пользователю')

      // Проверяем текущий баланс для информации
      const { data: currentBalance } = await supabaseClient
        .from('user_balances')
        .select('balance')
        .eq('user_id', userId)
        .single()

      return NextResponse.json({
        success: true,
        message: 'Начальные кредиты уже были начислены',
        balance: currentBalance?.balance || 0
      })
    }

    // Проверяем, есть ли уже баланс у пользователя
    const { data: existingBalance, error: checkError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    console.log('📊 Результат проверки баланса:', { existingBalance, checkError })

    // Новый пользователь ИЛИ баланс существует - добавляем 5 кредитов
    console.log('💰 Начисляем начальные 5 кредитов для пользователя:', userId)

    let newBalance = 5
    if (existingBalance) {
      // Если баланс уже есть (например, создан триггером с 0), добавляем к нему 5
      newBalance = existingBalance.balance + 5
      console.log(`📊 Обновляем существующий баланс: ${existingBalance.balance} + 5 = ${newBalance}`)

      // Обновляем баланс
      const { data: balanceData, error: balanceError } = await supabaseClient
        .from('user_balances')
        .update({ balance: newBalance })
        .eq('user_id', userId)
        .select()

      console.log('📊 Результат обновления баланса:', { balanceData, balanceError })

      if (balanceError) {
        console.error('❌ Ошибка обновления баланса:', balanceError)
        return NextResponse.json({ error: balanceError.message }, { status: 500 })
      }
    } else {
      // Создаем новый баланс с 5 кредитами
      console.log('📊 Создаем новую запись баланса с 5 кредитами')

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
    }

    // Создаем транзакцию для начального баланса
    const { data: transactionData, error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'credit',
        amount: 5,
        balance_after: newBalance,
        source: 'manual',
        description: 'Добро пожаловать! Начальный баланс 5 кредитов'
      })
      .select()

    console.log('📊 Результат создания транзакции:', { transactionData, transactionError })

    if (transactionError) {
      console.error('❌ Ошибка создания транзакции:', transactionError)
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    console.log('✅ Начальный баланс начислен для пользователя:', userId)

    return NextResponse.json({
      success: true,
      message: 'Начальный баланс начислен успешно',
      balance: newBalance,
      transaction: transactionData?.[0]
    })

  } catch (error) {
    console.error('❌ Ошибка при создании начального баланса:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
