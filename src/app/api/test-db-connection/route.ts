import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Тестируем подключение к базе данных...')

    // Проверяем подключение к user_balances
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d')
      .single()

    console.log('Balance data:', balanceData)
    console.log('Balance error:', balanceError)

    // Проверяем подключение к transactions
    const { data: transactionData, error: transactionError } = await supabaseClient
      .from('transactions')
      .select('*')
      .eq('user_id', 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d')
      .limit(3)

    console.log('Transaction data:', transactionData)
    console.log('Transaction error:', transactionError)

    return NextResponse.json({
      success: true,
      balance: {
        data: balanceData,
        error: balanceError
      },
      transactions: {
        data: transactionData,
        error: transactionError
      }
    })

  } catch (error) {
    console.error('Error in test DB connection:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
