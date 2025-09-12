import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/credits/balance - Получить баланс пользователя
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

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

    // Получаем баланс пользователя
    const { data: balance, error } = await supabaseClient
      .from('user_balances')
      .select('balance, grace_limit_used, last_updated')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error fetching balance:', error)
      return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 })
    }

    // Если баланса нет, создаем запись с нулевым балансом
    if (!balance) {
      const { data: newBalance, error: insertError } = await supabaseClient
        .from('user_balances')
        .insert({
          user_id: user.id,
          balance: 0,
          grace_limit_used: false
        })
        .select('balance, grace_limit_used, last_updated')
        .single()

      if (insertError) {
        console.error('Error creating balance:', insertError)
        return NextResponse.json({ error: 'Failed to create balance' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        balance: newBalance.balance,
        grace_limit_used: newBalance.grace_limit_used,
        last_updated: newBalance.last_updated
      })
    }

    return NextResponse.json({
      success: true,
      balance: balance.balance,
      grace_limit_used: balance.grace_limit_used,
      last_updated: balance.last_updated
    })

  } catch (error) {
    console.error('Error in GET /api/credits/balance:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
