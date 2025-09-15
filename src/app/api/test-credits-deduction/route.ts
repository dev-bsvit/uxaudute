import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const testUserId = 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'
    const amount = 2

    console.log('🧪 Тестируем списание кредитов...')

    // Проверяем текущий баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('balance')
      .eq('user_id', testUserId)
      .single()

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    const currentBalance = balanceData?.balance || 0
    console.log(`💰 Текущий баланс: ${currentBalance}`)

    if (currentBalance < amount) {
      return NextResponse.json({
        success: false,
        error: 'Недостаточно кредитов',
        current: currentBalance,
        required: amount
      })
    }

    // Списываем кредиты напрямую
    const newBalance = currentBalance - amount
    
    const { error: updateError } = await supabaseClient
      .from('user_balances')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', testUserId)

    if (updateError) {
      console.error('Error updating balance:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id: testUserId,
        type: 'debit',
        amount: -amount,
        balance_after: newBalance,
        source: 'audit',
        description: 'UX аудит интерфейса (тест)'
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: transactionError.message }, { status: 500 })
    }

    console.log(`✅ Списано ${amount} кредитов. Новый баланс: ${newBalance}`)

    return NextResponse.json({
      success: true,
      message: `Списано ${amount} кредитов`,
      previous_balance: currentBalance,
      new_balance: newBalance,
      deducted: amount
    })

  } catch (error) {
    console.error('Error in test credits deduction:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}