import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем все транзакции с информацией о пользователях
    const { data: transactions, error } = await supabaseClient
      .from('transactions')
      .select(`
        id,
        user_id,
        type,
        amount,
        balance_after,
        source,
        description,
        created_at
      `)
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Ошибка получения транзакций:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || []
    })

  } catch (error) {
    console.error('Ошибка API транзакций:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

