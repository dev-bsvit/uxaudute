import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем балансы всех пользователей...')

    // Получаем всех пользователей из profiles
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, email')
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Ошибка получения профилей:', profilesError)
      return NextResponse.json({ error: profilesError.message }, { status: 500 })
    }

    console.log(`📊 Найдено профилей: ${profiles?.length || 0}`)

    const results = []
    let fixedCount = 0

    for (const profile of profiles || []) {
      try {
        console.log(`🔍 Проверяем пользователя: ${profile.email} (${profile.id})`)

        // Проверяем, есть ли баланс
        const { data: balance, error: balanceError } = await supabaseClient
          .from('user_balances')
          .select('*')
          .eq('user_id', profile.id)
          .single()

        if (balanceError && balanceError.code !== 'PGRST116') {
          console.error(`❌ Ошибка получения баланса для ${profile.email}:`, balanceError)
          continue
        }

        // Создаем баланс если его нет
        if (!balance) {
          console.log(`💰 Создаем баланс для ${profile.email}`)
          
          const { error: createBalanceError } = await supabaseClient
            .from('user_balances')
            .insert({
              user_id: profile.id,
              balance: 5,
              grace_limit_used: false
            })

          if (createBalanceError) {
            console.error(`❌ Ошибка создания баланса для ${profile.email}:`, createBalanceError)
            continue
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
            console.error(`❌ Ошибка создания транзакции для ${profile.email}:`, transactionError)
            continue
          }

          fixedCount++
          console.log(`✅ Исправлен пользователь: ${profile.email}`)
        } else {
          console.log(`✅ Пользователь ${profile.email} уже имеет баланс: ${balance.balance}`)
        }

        results.push({
          email: profile.email,
          userId: profile.id,
          hasBalance: !!balance,
          balance: balance?.balance || 0,
          fixed: !balance
        })

      } catch (userError) {
        console.error(`❌ Ошибка обработки пользователя ${profile.email}:`, userError)
        results.push({
          email: profile.email,
          userId: profile.id,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Исправлено пользователей: ${fixedCount}`)

    return NextResponse.json({
      success: true,
      message: `Исправлено ${fixedCount} пользователей`,
      total: profiles?.length || 0,
      fixed: fixedCount,
      results
    })

  } catch (error) {
    console.error('❌ Ошибка исправления пользователей:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}