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

    // 1. Удаляем аннотации пользователя
    const { error: annotationsError } = await supabaseClient
      .from('annotations')
      .delete()
      .eq('user_id', userId)

    if (annotationsError) {
      console.error('Ошибка удаления аннотаций:', annotationsError)
      return NextResponse.json({ error: annotationsError.message }, { status: 500 })
    }

    // 2. Удаляем результаты анализа (через audits)
    const { data: userAudits } = await supabaseClient
      .from('audits')
      .select('id')
      .eq('user_id', userId)

    if (userAudits && userAudits.length > 0) {
      const auditIds = userAudits.map(audit => audit.id)
      
      // Удаляем analysis_results
      const { error: analysisResultsError } = await supabaseClient
        .from('analysis_results')
        .delete()
        .in('audit_id', auditIds)

      if (analysisResultsError) {
        console.error('Ошибка удаления результатов анализа:', analysisResultsError)
        return NextResponse.json({ error: analysisResultsError.message }, { status: 500 })
      }

      // Удаляем audit_history
      const { error: auditHistoryError } = await supabaseClient
        .from('audit_history')
        .delete()
        .in('audit_id', auditIds)

      if (auditHistoryError) {
        console.error('Ошибка удаления истории аудитов:', auditHistoryError)
        return NextResponse.json({ error: auditHistoryError.message }, { status: 500 })
      }
    }

    // 3. Удаляем аудиты пользователя
    const { error: auditsError } = await supabaseClient
      .from('audits')
      .delete()
      .eq('user_id', userId)

    if (auditsError) {
      console.error('Ошибка удаления аудитов:', auditsError)
      return NextResponse.json({ error: auditsError.message }, { status: 500 })
    }

    // 4. Удаляем проекты пользователя
    const { error: projectsError } = await supabaseClient
      .from('projects')
      .delete()
      .eq('user_id', userId)

    if (projectsError) {
      console.error('Ошибка удаления проектов:', projectsError)
      return NextResponse.json({ error: projectsError.message }, { status: 500 })
    }

    // 5. Удаляем транзакции пользователя
    const { error: transactionsError } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('user_id', userId)

    if (transactionsError) {
      console.error('Ошибка удаления транзакций:', transactionsError)
      return NextResponse.json({ error: transactionsError.message }, { status: 500 })
    }

    // 6. Удаляем баланс пользователя
    const { error: balanceError } = await supabaseClient
      .from('user_balances')
      .delete()
      .eq('user_id', userId)

    if (balanceError) {
      console.error('Ошибка удаления баланса:', balanceError)
      return NextResponse.json({ error: balanceError.message }, { status: 500 })
    }

    // 7. Удаляем профиль пользователя
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
