import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔧 Исправляем баланс для всех пользователей с балансом 0')

    // Получаем всех пользователей с балансом 0
    const { data: zeroBalanceUsers, error: zeroBalanceError } = await supabaseClient
      .from('user_balances')
      .select('user_id, balance')
      .eq('balance', 0)

    if (zeroBalanceError) {
      console.error('Ошибка получения пользователей с нулевым балансом:', zeroBalanceError)
      return NextResponse.json({ error: zeroBalanceError.message }, { status: 500 })
    }

    console.log(`📊 Найдено ${zeroBalanceUsers?.length || 0} пользователей с балансом 0`)

    const results = []

    for (const user of zeroBalanceUsers || []) {
      try {
        console.log(`💰 Обновляем баланс для пользователя ${user.user_id}`)

        // Обновляем баланс с 0 на 5
        const { data: updateData, error: updateError } = await supabaseClient
          .from('user_balances')
          .update({ balance: 5 })
          .eq('user_id', user.user_id)
          .select()

        if (updateError) {
          console.error(`❌ Ошибка обновления баланса для ${user.user_id}:`, updateError)
          results.push({ user_id: user.user_id, success: false, error: updateError.message })
          continue
        }

        // Создаем транзакцию
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.user_id,
            type: 'credit',
            amount: 5,
            balance_after: 5,
            source: 'welcome',
            description: 'Исправление: начисление начального баланса 5 кредитов'
          })
          .select()

        if (transactionError) {
          console.error(`❌ Ошибка создания транзакции для ${user.user_id}:`, transactionError)
          results.push({ user_id: user.user_id, success: false, error: transactionError.message })
          continue
        }

        console.log(`✅ Баланс обновлен для пользователя ${user.user_id}`)
        results.push({ 
          user_id: user.user_id, 
          success: true, 
          balance: updateData?.[0],
          transaction: transactionData?.[0]
        })

      } catch (error) {
        console.error(`❌ Ошибка для пользователя ${user.user_id}:`, error)
        results.push({ 
          user_id: user.user_id, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Обработано ${zeroBalanceUsers?.length || 0} пользователей с нулевым балансом`,
      results,
      totalProcessed: zeroBalanceUsers?.length || 0,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error('Error in POST /api/fix-zero-balance-users:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
