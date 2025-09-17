import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔧 Исправляем баланс для пользователя:', userId)

    // Проверяем текущий баланс
    const { data: currentBalance, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Ошибка получения баланса:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    console.log('📊 Текущий баланс:', currentBalance)

    // Если баланса нет или он равен 0, создаем/обновляем
    if (!currentBalance || currentBalance.balance === 0) {
      console.log('💰 Создаем/обновляем баланс с 5 кредитами')
      
      let result
      if (currentBalance) {
        // Обновляем существующий баланс
        result = await supabaseClient
          .from('user_balances')
          .update({ balance: 5 })
          .eq('user_id', userId)
          .select()
      } else {
        // Создаем новый баланс
        result = await supabaseClient
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: 5,
            grace_limit_used: false
          })
          .select()
      }

      if (result.error) {
        console.error('❌ Ошибка создания/обновления баланса:', result.error)
        return NextResponse.json({ error: result.error.message }, { status: 500 })
      }

      // Создаем транзакцию
      const { error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: 5,
          balance_after: 5,
          source: 'manual_fix',
          description: 'Исправление баланса - начальные 5 кредитов'
        })

      if (transactionError) {
        console.error('❌ Ошибка создания транзакции:', transactionError)
        return NextResponse.json({ error: transactionError.message }, { status: 500 })
      }

      console.log('✅ Баланс исправлен успешно')

      return NextResponse.json({
        success: true,
        message: 'Баланс исправлен успешно',
        balance: 5,
        action: currentBalance ? 'updated' : 'created'
      })
    } else {
      console.log('✅ Баланс уже существует:', currentBalance.balance)
      
      return NextResponse.json({
        success: true,
        message: 'Баланс уже существует',
        balance: currentBalance.balance,
        action: 'no_change'
      })
    }

  } catch (error) {
    console.error('❌ Ошибка исправления баланса:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}