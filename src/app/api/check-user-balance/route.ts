import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    console.log('🔍 Проверяем баланс для пользователя:', userId)

    // Проверяем баланс
    const { data: balanceData, error: balanceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .single()

    console.log('Balance data:', balanceData)
    console.log('Balance error:', balanceError)

    if (balanceError) {
      if (balanceError.code === 'PGRST116') {
        // Пользователь не найден
        console.log('Пользователь не найден, создаем баланс...')
        
        const { data: createData, error: createError } = await supabaseClient
          .from('user_balances')
          .insert({
            user_id: userId,
            balance: 5,
            grace_limit_used: false
          })
          .select()

        console.log('Create data:', createData)
        console.log('Create error:', createError)

        if (createError) {
          return NextResponse.json({
            success: false,
            error: 'Failed to create user balance',
            details: createError
          })
        }

        return NextResponse.json({
          success: true,
          message: 'User balance created',
          balance: 5,
          created: true
        })
      } else {
        return NextResponse.json({
          success: false,
          error: 'Database error',
          details: balanceError
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User balance found',
      balance: balanceData.balance,
      created: false
    })

  } catch (error) {
    console.error('Error in check user balance:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
