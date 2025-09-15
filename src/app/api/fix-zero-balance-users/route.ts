import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем пользователей с нулевым балансом...')

    // Получаем всех пользователей с балансом 0
    const { data: zeroBalanceUsers, error: fetchError } = await supabaseClient
      .from('user_balances')
      .select(`
        user_id,
        balance,
        profiles!inner(email, created_at)
      `)
      .eq('balance', 0)

    if (fetchError) {
      console.error('❌ Ошибка получения пользователей:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    console.log(`📊 Найдено пользователей с нулевым балансом: ${zeroBalanceUsers?.length || 0}`)

    if (!zeroBalanceUsers || zeroBalanceUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет пользователей с нулевым балансом',
        fixed: 0
      })
    }

    let fixedCount = 0
    const results = []

    for (const user of zeroBalanceUsers) {
      try {
        console.log(`🔧 Исправляем пользователя: ${user.profiles.email} (${user.user_id})`)

        // Обновляем баланс на 5
        const { error: updateError } = await supabaseClient
          .from('user_balances')
          .update({ balance: 5 })
          .eq('user_id', user.user_id)

        if (updateError) {
          console.error(`❌ Ошибка обновления баланса для ${user.profiles.email}:`, updateError)
          results.push({
            email: user.profiles.email,
            userId: user.user_id,
            success: false,
            error: updateError.message
          })
          continue
        }

        // Создаем транзакцию
        const { error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.user_id,
            type: 'credit',
            amount: 5,
            balance_after: 5,
            source: 'manual',
            description: 'Исправление: начисление начального баланса 5 кредитов'
          })

        if (transactionError) {
          console.error(`❌ Ошибка создания транзакции для ${user.profiles.email}:`, transactionError)
          results.push({
            email: user.profiles.email,
            userId: user.user_id,
            success: false,
            error: transactionError.message
          })
          continue
        }

        console.log(`✅ Исправлен пользователь: ${user.profiles.email}`)
        fixedCount++
        results.push({
          email: user.profiles.email,
          userId: user.user_id,
          success: true
        })

      } catch (userError) {
        console.error(`❌ Ошибка обработки пользователя ${user.profiles.email}:`, userError)
        results.push({
          email: user.profiles.email,
          userId: user.user_id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Исправлено пользователей: ${fixedCount} из ${zeroBalanceUsers.length}`)

    return NextResponse.json({
      success: true,
      message: `Исправлено ${fixedCount} пользователей с нулевым балансом`,
      fixed: fixedCount,
      total: zeroBalanceUsers.length,
      results: results
    })

  } catch (error) {
    console.error('❌ Общая ошибка:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}