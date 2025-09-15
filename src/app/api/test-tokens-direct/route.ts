import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('=== TEST TOKENS DIRECT API вызван ===')

    // Тест 1: Проверяем таблицы токеномики
    const { data: tables, error: tablesError } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['user_balances', 'transactions', 'organizations', 'audit_credits', 'package_pricing'])

    if (tablesError) {
      console.error('Error checking tables:', tablesError)
      return NextResponse.json({ error: 'Failed to check tables' }, { status: 500 })
    }

    // Тест 2: Проверяем функции токеномики
    const { data: functions, error: functionsError } = await supabaseClient
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .in('routine_name', ['get_user_balance', 'can_deduct_credits', 'deduct_credits', 'add_credits'])

    if (functionsError) {
      console.error('Error checking functions:', functionsError)
      return NextResponse.json({ error: 'Failed to check functions' }, { status: 500 })
    }

    // Тест 3: Проверяем данные в audit_credits
    const { data: auditCredits, error: auditCreditsError } = await supabaseClient
      .from('audit_credits')
      .select('*')

    if (auditCreditsError) {
      console.error('Error checking audit_credits:', auditCreditsError)
      return NextResponse.json({ error: 'Failed to check audit_credits' }, { status: 500 })
    }

    // Тест 4: Проверяем данные в package_pricing
    const { data: packagePricing, error: packagePricingError } = await supabaseClient
      .from('package_pricing')
      .select('*')

    if (packagePricingError) {
      console.error('Error checking package_pricing:', packagePricingError)
      return NextResponse.json({ error: 'Failed to check package_pricing' }, { status: 500 })
    }

    // Тест 5: Проверяем количество записей в user_balances
    const { count: userBalancesCount, error: userBalancesError } = await supabaseClient
      .from('user_balances')
      .select('*', { count: 'exact', head: true })

    if (userBalancesError) {
      console.error('Error checking user_balances count:', userBalancesError)
      return NextResponse.json({ error: 'Failed to check user_balances count' }, { status: 500 })
    }

    // Тест 6: Проверяем количество записей в transactions
    const { count: transactionsCount, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    if (transactionsError) {
      console.error('Error checking transactions count:', transactionsError)
      return NextResponse.json({ error: 'Failed to check transactions count' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Tokens system health check completed',
      results: {
        tables_found: tables?.map(t => t.table_name) || [],
        functions_found: functions?.map(f => f.routine_name) || [],
        audit_credits: auditCredits || [],
        package_pricing: packagePricing || [],
        user_balances_count: userBalancesCount || 0,
        transactions_count: transactionsCount || 0
      },
      summary: {
        tables_created: tables?.length || 0,
        functions_created: functions?.length || 0,
        audit_types_configured: auditCredits?.length || 0,
        packages_configured: packagePricing?.length || 0
      }
    })

  } catch (error) {
    console.error('Error in test-tokens-direct API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

