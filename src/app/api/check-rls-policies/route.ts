import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    console.log('=== CHECK RLS POLICIES API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Проверяем доступ к user_balances с anon key
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: anonData, error: anonError } = await anonClient
      .from('user_balances')
      .select('*')
      .limit(1)

    // Проверяем доступ к user_balances с service key
    const { data: serviceData, error: serviceError } = await supabaseClient
      .from('user_balances')
      .select('*')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'RLS policies check completed',
      results: {
        anon_access: {
          success: !anonError,
          data: anonData,
          error: anonError?.message || null
        },
        service_access: {
          success: !serviceError,
          data: serviceData,
          error: serviceError?.message || null
        }
      }
    })

  } catch (error) {
    console.error('Error in check-rls-policies API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}

