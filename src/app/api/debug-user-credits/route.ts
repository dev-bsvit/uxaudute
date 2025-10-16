import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', details: authError?.message },
        { status: 401 }
      )
    }

    console.log('🔍 Debug: Checking user credits for user:', user.id)

    // Get user profile to check if test account
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error fetching profile:', profileError)
    }

    // Get current credit balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (balanceError && balanceError.code !== 'PGRST116') {
      console.error('❌ Error fetching balance:', balanceError)
    }

    // Check if can deduct 5 credits using RPC
    const { data: canDeduct5, error: deductCheckError } = await supabase.rpc(
      'can_deduct_credits',
      {
        p_user_id: user.id,
        p_credits_amount: 5
      }
    )

    if (deductCheckError) {
      console.error('❌ Error checking can_deduct_credits:', deductCheckError)
    }

    // Get recent transactions
    const { data: recentTransactions, error: transError } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    if (transError) {
      console.error('❌ Error fetching transactions:', transError)
    }

    // Get audit credits configuration
    const { data: auditCredits, error: auditCreditsError } = await supabase
      .from('audit_credits')
      .select('*')
      .eq('is_active', true)

    if (auditCreditsError) {
      console.error('❌ Error fetching audit credits config:', auditCreditsError)
    }

    const debugInfo = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      isTestAccount: profile?.is_test_account || false,
      currentBalance: balanceData?.balance || 0,
      canDeduct5Credits: canDeduct5,
      recentTransactions: recentTransactions || [],
      auditCreditsConfig: auditCredits || [],
      errors: {
        profile: profileError?.message || null,
        balance: balanceError?.message || null,
        deductCheck: deductCheckError?.message || null,
        transactions: transError?.message || null,
        auditCredits: auditCreditsError?.message || null
      }
    }

    console.log('✅ Debug info collected:', JSON.stringify(debugInfo, null, 2))

    return NextResponse.json(debugInfo)
  } catch (error) {
    console.error('❌ Debug endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
