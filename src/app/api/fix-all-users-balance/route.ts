import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔧 Исправляем баланс для всех пользователей без баланса')

    // Получаем всех пользователей
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('Ошибка получения профилей:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    // Получаем всех пользователей с балансами
    const { data: balances, error: balancesError } = await supabaseClient
      .from('user_balances')
      .select('user_id, balance')

    if (balancesError) {
      console.error('Ошибка получения балансов:', balancesError)
      return NextResponse.json({ error: balancesError.message }, { status: 500 })
    }

    const usersWithBalances = new Set(balances?.map(b => b.user_id) || [])
    const usersWithoutBalance = profiles?.filter(p => !usersWithBalances.has(p.id)) || []

    console.log(`📊 Найдено ${usersWithoutBalance.length} пользователей без баланса`)

    const results = []

    for (const user of usersWithoutBalance) {
      try {
        console.log(`💰 Создаем баланс для ${user.email} (${user.id})`)

        // Создаем баланс
        const { data: balanceData, error: balanceError } = await supabaseClient
          .from('user_balances')
          .insert({
            user_id: user.id,
            balance: 5,
            grace_limit_used: false
          })
          .select()

        if (balanceError) {
          console.error(`❌ Ошибка создания баланса для ${user.email}:`, balanceError)
          results.push({ user: user.email, success: false, error: balanceError.message })
          continue
        }

        // Создаем транзакцию
        const { data: transactionData, error: transactionError } = await supabaseClient
          .from('transactions')
          .insert({
            user_id: user.id,
            type: 'credit',
            amount: 5,
            balance_after: 5,
            source: 'manual',
            description: 'Исправление: создание начального баланса 5 кредитов'
          })
          .select()

        if (transactionError) {
          console.error(`❌ Ошибка создания транзакции для ${user.email}:`, transactionError)
          results.push({ user: user.email, success: false, error: transactionError.message })
          continue
        }

        console.log(`✅ Баланс создан для ${user.email}`)
        results.push({ 
          user: user.email, 
          success: true, 
          balance: balanceData?.[0],
          transaction: transactionData?.[0]
        })

      } catch (error) {
        console.error(`❌ Ошибка для ${user.email}:`, error)
        results.push({ 
          user: user.email, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Обработано ${usersWithoutBalance.length} пользователей`,
      results,
      totalProcessed: usersWithoutBalance.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    })

  } catch (error) {
    console.error('Error in POST /api/fix-all-users-balance:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
