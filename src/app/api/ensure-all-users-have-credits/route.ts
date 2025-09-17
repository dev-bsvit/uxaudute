import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Проверяем всех пользователей на наличие начальных кредитов...')

    // Получаем всех пользователей, которые зарегистрировались за последние 24 часа
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: recentUsers, error: usersError } = await supabaseClient
      .from('profiles')
      .select(`
        id,
        email,
        created_at,
        user_balances!left(balance)
      `)
      .gte('created_at', yesterday.toISOString())

    if (usersError) {
      console.error('❌ Ошибка получения пользователей:', usersError)
      return NextResponse.json({ error: usersError.message }, { status: 500 })
    }

    console.log(`📊 Найдено пользователей за последние 24 часа: ${recentUsers?.length || 0}`)

    if (!recentUsers || recentUsers.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Нет новых пользователей за последние 24 часа',
        processed: 0
      })
    }

    let processedCount = 0
    const results = []

    for (const user of recentUsers) {
      try {
        console.log(`🔍 Проверяем пользователя: ${user.email} (${user.id})`)

        // Проверяем, есть ли у пользователя баланс
        if (!user.user_balances || user.user_balances.length === 0) {
          console.log(`🔧 Создаем баланс для пользователя: ${user.email}`)
          
          // Создаем баланс
          const { error: balanceError } = await supabaseClient
            .from('user_balances')
            .insert({
              user_id: user.id,
              balance: 5,
              grace_limit_used: false
            })

          if (balanceError) {
            console.error(`❌ Ошибка создания баланса для ${user.email}:`, balanceError)
            results.push({
              email: user.email,
              userId: user.id,
              success: false,
              error: balanceError.message
            })
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
              source: 'welcome',
              description: 'Добро пожаловать! Начальный баланс 5 кредитов'
            })

          if (transactionError) {
            console.error(`❌ Ошибка создания транзакции для ${user.email}:`, transactionError)
            results.push({
              email: user.email,
              userId: user.id,
              success: false,
              error: transactionError.message
            })
            continue
          }

          console.log(`✅ Создан баланс для пользователя: ${user.email}`)
          processedCount++
          results.push({
            email: user.email,
            userId: user.id,
            success: true,
            action: 'created_balance'
          })

        } else if (user.user_balances[0].balance === 0) {
          console.log(`🔧 Исправляем нулевой баланс для пользователя: ${user.email}`)
          
          // Обновляем баланс
          const { error: updateError } = await supabaseClient
            .from('user_balances')
            .update({ balance: 5 })
            .eq('user_id', user.id)

          if (updateError) {
            console.error(`❌ Ошибка обновления баланса для ${user.email}:`, updateError)
            results.push({
              email: user.email,
              userId: user.id,
              success: false,
              error: updateError.message
            })
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
              source: 'manual',
              description: 'Исправление: начисление начального баланса 5 кредитов'
            })

          if (transactionError) {
            console.error(`❌ Ошибка создания транзакции для ${user.email}:`, transactionError)
            results.push({
              email: user.email,
              userId: user.id,
              success: false,
              error: transactionError.message
            })
            continue
          }

          console.log(`✅ Исправлен баланс для пользователя: ${user.email}`)
          processedCount++
          results.push({
            email: user.email,
            userId: user.id,
            success: true,
            action: 'fixed_balance'
          })

        } else {
          console.log(`✅ Пользователь ${user.email} уже имеет баланс: ${user.user_balances[0].balance}`)
          results.push({
            email: user.email,
            userId: user.id,
            success: true,
            action: 'already_has_balance',
            balance: user.user_balances[0].balance
          })
        }

      } catch (userError) {
        console.error(`❌ Ошибка обработки пользователя ${user.email}:`, userError)
        results.push({
          email: user.email,
          userId: user.id,
          success: false,
          error: userError instanceof Error ? userError.message : 'Unknown error'
        })
      }
    }

    console.log(`✅ Обработано пользователей: ${processedCount} из ${recentUsers.length}`)

    return NextResponse.json({
      success: true,
      message: `Обработано ${processedCount} пользователей`,
      processed: processedCount,
      total: recentUsers.length,
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
