import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🗑️ Удаление пользователя:', userId)

    // 1. Удаляем аудиты пользователя (включая все связанные данные)
    const { error: auditsError } = await supabaseClient
      .from('audits')
      .delete()
      .eq('user_id', userId)

    if (auditsError) {
      console.error('Ошибка удаления аудитов:', auditsError)
      return NextResponse.json({ error: auditsError.message }, { status: 500 })
    }

    // 2. Удаляем проекты пользователя
    const { error: projectsError } = await supabaseClient
      .from('projects')
      .delete()
      .eq('user_id', userId)

    if (projectsError) {
      console.error('Ошибка удаления проектов:', projectsError)
      return NextResponse.json({ error: projectsError.message }, { status: 500 })
    }

    // 3. Удаляем транзакции пользователя (если таблица существует)
    try {
      const { error: transactionsError } = await supabaseClient
        .from('transactions')
        .delete()
        .eq('user_id', userId)

      if (transactionsError) {
        console.warn('Предупреждение: не удалось удалить транзакции:', transactionsError.message)
      }
    } catch (err) {
      console.warn('Предупреждение: таблица transactions не существует')
    }

    // 4. Удаляем баланс пользователя (если таблица существует)
    try {
      const { error: balanceError } = await supabaseClient
        .from('user_balances')
        .delete()
        .eq('user_id', userId)

      if (balanceError) {
        console.warn('Предупреждение: не удалось удалить баланс:', balanceError.message)
      }
    } catch (err) {
      console.warn('Предупреждение: таблица user_balances не существует')
    }

    // 5. Удаляем профиль пользователя
    const { error: profileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId)

    if (profileError) {
      console.error('Ошибка удаления профиля:', profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    // Удаляем пользователя из auth.users (если возможно)
    try {
      const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
      if (authError) {
        console.warn('Предупреждение: не удалось удалить пользователя из auth:', authError.message)
      }
    } catch (authErr) {
      console.warn('Предупреждение: ошибка удаления из auth:', authErr)
    }

    console.log('✅ Пользователь удален успешно:', userId)

    return NextResponse.json({
      success: true,
      message: 'Пользователь удален успешно'
    })

  } catch (error) {
    console.error('Ошибка удаления пользователя:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
