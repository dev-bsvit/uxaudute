import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем существующих пользователей...')

    // Получаем всех пользователей из auth.users
    const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Ошибка получения пользователей:', authError)
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    console.log(`📊 Найдено пользователей в auth: ${authUsers.users.length}`)

    const results = []
    let fixedCount = 0

    for (const user of authUsers.users) {
      try {
        console.log(`🔍 Проверяем пользователя: ${user.email} (${user.id})`)

        // Проверяем, есть ли профиль
        const { data: profile, error: profileError } = await supabaseClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError && profileError.code !== 'PGRST116') {
          console.error(`❌ Ошибка получения профиля для ${user.email}:`, profileError)
          continue
        }

        // Создаем профиль если его нет
        if (!profile) {
          console.log(`👤 Создаем профиль для ${user.email}`)
          const { error: createProfileError } = await supabaseClient
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.user_metadata?.name || null,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null
            })

          if (createProfileError) {
            console.error(`❌ Ошибка создания профиля для ${user.email}:`, createProfileError)
            continue
          }
        }

        // Проверяем, есть ли баланс
        const { data: balance, error: balanceError } = await supabaseClient
          .from('user_balances')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (balanceError && balanceError.code !== 'PGRST116') {
          console.error(`❌ Ошибка получения баланса для ${user.email}:`, balanceError)
          continue
        }

        // Создаем баланс если его нет
        if (!balance) {
          console.log(`💰 Создаем баланс для ${user.email}`)
          const { error: createBalanceError } = await supabaseClient
            .from('user_balances')
            .insert({
              user_id: user.id,
              balance: 5,
              grace_limit_used: false
            })

          if (createBalanceError) {
            console.error(`❌ Ошибка создания баланса для ${user.email}:`, createBalanceError)
            continue
          }

          // Создаем транзакцию
          const { error: transactionError } = await supabaseClient
            .from('transactions')
            .insert({
              user_id: user.id,
              type: 'credit',
              amount: 5,
              balance_after: 5,
              source: 'manual_fix',
              description: 'Исправление - начальные 5 кредитов'
            })

          if (transactionError) {
            console.error(`❌ Ошибка создания транзакции для ${user.email}:`, transactionError)
            continue
          }

          fixedCount++
          console.log(`✅ Исправлен пользователь: ${user.email}`)
        } else {
          console.log(`✅ Пользователь ${user.email} уже имеет баланс: ${balance.balance}`)
        }

        results.push({
          email: user.email,
          userId: user.id,
          hasProfile: !!profile,
          hasBalance: !!balance,
          balance: balance?.balance || 0,
          fixed: !balance
        })

      } catch (userError) {
        console.error(`❌ Ошибка обработки пользователя ${user.email}:`, userError)
        results.push({
          email: user.email,
          userId: user.id,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Исправлено пользователей: ${fixedCount}`)

    return NextResponse.json({
      success: true,
      message: `Исправлено ${fixedCount} пользователей`,
      total: authUsers.users.length,
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

