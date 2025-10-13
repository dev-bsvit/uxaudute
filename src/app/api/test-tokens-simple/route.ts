import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('=== TEST TOKENS SIMPLE API вызван ===')

    // Тест 1: Проверяем audit_credits
    const { data: auditCredits, error: auditCreditsError } = await supabaseClient
      .from('audit_credits')
      .select('*')

    if (auditCreditsError) {
      console.error('Error checking audit_credits:', auditCreditsError)
      return NextResponse.json({ 
        error: 'Failed to check audit_credits', 
        details: auditCreditsError.message 
      }, { status: 500 })
    }

    // Тест 2: Проверяем package_pricing
    const { data: packagePricing, error: packagePricingError } = await supabaseClient
      .from('package_pricing')
      .select('*')

    if (packagePricingError) {
      console.error('Error checking package_pricing:', packagePricingError)
      return NextResponse.json({ 
        error: 'Failed to check package_pricing', 
        details: packagePricingError.message 
      }, { status: 500 })
    }

    // Тест 3: Проверяем user_balances (все записи)
    const { data: userBalances, error: userBalancesError } = await supabaseClient
      .from('user_balances')
      .select('*')

    if (userBalancesError) {
      console.error('Error checking user_balances:', userBalancesError)
      return NextResponse.json({ 
        error: 'Failed to check user_balances', 
        details: userBalancesError.message 
      }, { status: 500 })
    }

    // Тест 4: Проверяем transactions (количество записей)
    const { count: transactionsCount, error: transactionsError } = await supabaseClient
      .from('transactions')
      .select('*', { count: 'exact', head: true })

    if (transactionsError) {
      console.error('Error checking transactions count:', transactionsError)
      return NextResponse.json({ 
        error: 'Failed to check transactions count', 
        details: transactionsError.message 
      }, { status: 500 })
    }

    // Тест 5: Проверяем функции (попробуем вызвать get_user_balance)
    const testUserId = '00000000-0000-0000-0000-000000000000' // Тестовый UUID
    const { data: balanceTest, error: balanceTestError } = await supabaseClient
      .rpc('get_user_balance', { user_uuid: testUserId })

    console.log('Balance test result:', balanceTest, balanceTestError)

    return NextResponse.json({
      success: true,
      message: 'Tokens system health check completed',
      results: {
        audit_credits: auditCredits || [],
        package_pricing: packagePricing || [],
        user_balances: userBalances || [],
        user_balances_count: userBalances?.length || 0,
        transactions_count: transactionsCount || 0,
        balance_function_test: {
          result: balanceTest,
          error: balanceTestError?.message || null
        }
      },
      summary: {
        audit_types_configured: auditCredits?.length || 0,
        packages_configured: packagePricing?.length || 0,
        users_with_balances: userBalances?.length || 0,
        total_transactions: transactionsCount || 0
      }
    })

  } catch (error) {
    console.error('Error in test-tokens-simple API:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
