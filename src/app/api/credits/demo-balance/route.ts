import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/credits/demo-balance - Демо API для показа баланса без авторизации
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Используем тестового пользователя
    const testUserId = 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d'

    // Получаем баланс
    const { data: balance, error: balanceError } = await supabaseClient
      .rpc('get_user_balance', { user_uuid: testUserId })

    if (balanceError) {
      console.error('Error fetching balance:', balanceError)
      return NextResponse.json({ 
        error: 'Failed to fetch balance', 
        details: balanceError.message 
      }, { status: 500 })
    }

    // Получаем транзакции
    const { data: transactions, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return NextResponse.json({ 
        error: 'Failed to fetch transactions', 
        details: transactionsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user_id: testUserId,
      balance: balance || 0,
      grace_limit_used: false,
      transactions: transactions || [],
      demo_mode: true
    })

  } catch (error) {
    console.error('Error in GET /api/credits/demo-balance:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

