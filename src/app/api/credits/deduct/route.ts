import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/credits/deduct - Списать кредиты
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { amount, source, description, audit_id, audit_type } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    if (!source || !description) {
      return NextResponse.json({ error: 'Source and description are required' }, { status: 400 })
    }

    // Получаем пользователя из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Проверяем, является ли пользователь тестовым
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_test_account')
      .eq('id', user.id)
      .single()

    // Если тестовый аккаунт, создаем запись "zero-cost test"
    if (profile?.is_test_account) {
      const { data: transaction, error: transactionError } = await supabaseClient
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'debit',
          amount: -amount,
          balance_after: 0, // Тестовый аккаунт всегда имеет баланс 0
          source: 'trial',
          description: `Test account: ${description}`,
          related_audit_id: audit_id,
          metadata: { is_test_transaction: true, audit_type }
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Error creating test transaction:', transactionError)
        return NextResponse.json({ error: 'Failed to create test transaction' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        deducted: true,
        is_test_account: true,
        transaction_id: transaction.id,
        message: 'Test account - no credits deducted'
      })
    }

    // Используем функцию из базы данных для атомарного списания
    const { data: deducted, error } = await supabaseClient
      .rpc('deduct_credits', {
        user_uuid: user.id,
        amount: amount,
        source: source,
        description: description,
        related_audit_id: audit_id || null
      })

    if (error) {
      console.error('Error deducting credits:', error)
      return NextResponse.json({ error: 'Failed to deduct credits' }, { status: 500 })
    }

    if (!deducted) {
      return NextResponse.json({
        success: false,
        deducted: false,
        error: 'Insufficient credits',
        message: 'Not enough credits to complete this operation'
      }, { status: 402 }) // 402 Payment Required
    }

    // Получаем обновленный баланс
    const { data: balance } = await supabaseClient
      .from('user_balances')
      .select('balance, grace_limit_used')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      deducted: true,
      amount_deducted: amount,
      new_balance: balance?.balance || 0,
      grace_limit_used: balance?.grace_limit_used || false,
      source: source,
      description: description
    })

  } catch (error) {
    console.error('Error in POST /api/credits/deduct:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
