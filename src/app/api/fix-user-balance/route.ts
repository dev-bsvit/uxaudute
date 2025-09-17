import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🔧 Исправляем баланс для пользователя:', userId)

    // Проверяем, есть ли уже баланс
    const { data: existingBalance, error: checkError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Ошибка проверки баланса:', checkError)
      return NextResponse.json({ error: checkError.message }, { status: 500 })
    }

    if (existingBalance) {
      // Если баланс есть, но равен 0, обновляем его
      if (existingBalance.balance === 0) {
        console.log('💰 Обновляем баланс с 0 на 5 кредитов')
        
        const { data: updateData, error: updateError } = await supabaseClient
          .from('user_balances')
          .update({ balance: 5 })
          .eq('user_id', userId)
          .select()

        if (updateError) {
          console.error('Ошибка обновления баланса:', updateError)
          return NextResponse.json({ error: updateError.message }, { status: 500 })
        }

        // Создаем транзакцию
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: userId,
            type: 'credit',
            amount: 5,
            balance_after: 5,
            source: 'manual',
            description: 'Исправление: начисление начального баланса 5 кредитов'
          })
          .select()

        if (transactionError) {
          console.error('Ошибка создания транзакции:', transactionError)
          return NextResponse.json({ error: transactionError.message }, { status: 500 })
        }

        return NextResponse.json({ 
          success: true, 
          message: 'Баланс обновлен с 0 на 5 кредитов',
          balance: updateData?.[0],
          transaction: transactionData?.[0]
        })
      } else {
        return NextResponse.json({ 
          success: true, 
          message: 'У пользователя уже есть баланс',
          balance: existingBalance.balance
        })
      }
    } else {
      // Если баланса нет, создаем новый
      console.log('💰 Создаем новый баланс 5 кредитов')
      
      const { data: balanceData, error: balanceError } = await supabaseClient
        .from('user_balances')
        .insert({
          user_id: userId,
          balance: 5,
          grace_limit_used: false
        })
        .select()

      if (balanceError) {
        console.error('Ошибка создания баланса:', balanceError)
        return NextResponse.json({ error: balanceError.message }, { status: 500 })
      }

      // Создаем транзакцию
      const { data: transactionData, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: userId,
          type: 'credit',
          amount: 5,
          balance_after: 5,
          source: 'manual',
          description: 'Исправление: создание начального баланса 5 кредитов'
        })
        .select()

      if (transactionError) {
        console.error('Ошибка создания транзакции:', transactionError)
        return NextResponse.json({ error: transactionError.message }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Баланс создан успешно',
        balance: balanceData?.[0],
        transaction: transactionData?.[0]
      })
    }

  } catch (error) {
    console.error('Error in POST /api/fix-user-balance:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
