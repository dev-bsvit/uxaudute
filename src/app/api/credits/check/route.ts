import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/credits/check - Проверить возможность списания кредитов
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { amount, audit_type } = await request.json()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
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
      .select('is_test_account, trial_enabled')
      .eq('id', user.id)
      .single()

    // Если тестовый аккаунт, разрешаем без списания
    if (profile?.is_test_account) {
      return NextResponse.json({
        success: true,
        can_deduct: true,
        is_test_account: true,
        message: 'Test account - no credits deducted'
      })
    }

    // Используем функцию из базы данных для проверки
    const { data: canDeduct, error } = await supabaseClient
      .rpc('can_deduct_credits', {
        user_uuid: user.id,
        amount: amount
      })

    if (error) {
      console.error('Error checking credits:', error)
      return NextResponse.json({ error: 'Failed to check credits' }, { status: 500 })
    }

    // Получаем текущий баланс для информации
    const { data: balance } = await supabaseClient
      .from('user_balances')
      .select('balance, grace_limit_used')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      can_deduct: canDeduct,
      current_balance: balance?.balance || 0,
      grace_limit_used: balance?.grace_limit_used || false,
      requested_amount: amount,
      audit_type: audit_type || 'unknown'
    })

  } catch (error) {
    console.error('Error in POST /api/credits/check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
