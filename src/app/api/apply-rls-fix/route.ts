import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    console.log('=== APPLY RLS FIX API вызван ===')

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Применяем исправления RLS пошагово
    const fixes = [
      {
        name: 'Disable RLS temporarily',
        sql: `
          ALTER TABLE user_balances DISABLE ROW LEVEL SECURITY;
          ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
          ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
          ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
          ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;
          ALTER TABLE stripe_webhooks DISABLE ROW LEVEL SECURITY;
        `
      },
      {
        name: 'Drop old policies',
        sql: `
          DROP POLICY IF EXISTS "Users can view their own balance" ON user_balances;
          DROP POLICY IF EXISTS "Users can update their own balance" ON user_balances;
          DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
          DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
          DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
          DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
          DROP POLICY IF EXISTS "Users can view their payment orders" ON payment_orders;
          DROP POLICY IF EXISTS "Service role can manage webhooks" ON stripe_webhooks;
        `
      },
      {
        name: 'Enable RLS for user_balances',
        sql: `
          ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;
        `
      },
      {
        name: 'Create user_balances policies',
        sql: `
          CREATE POLICY "Users can view their own balance" ON user_balances
              FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can update their own balance" ON user_balances
              FOR UPDATE USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own balance" ON user_balances
              FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      },
      {
        name: 'Enable RLS for transactions',
        sql: `
          ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
        `
      },
      {
        name: 'Create transactions policies',
        sql: `
          CREATE POLICY "Users can view their own transactions" ON transactions
              FOR SELECT USING (auth.uid() = user_id);
          
          CREATE POLICY "Users can insert their own transactions" ON transactions
              FOR INSERT WITH CHECK (auth.uid() = user_id);
        `
      }
    ]

    const results = []

    for (const fix of fixes) {
      try {
        const { data, error } = await supabaseClient.rpc('exec_sql', { sql: fix.sql })
        
        if (error) {
          console.error(`Error in ${fix.name}:`, error)
          results.push({
            name: fix.name,
            success: false,
            error: error.message
          })
        } else {
          results.push({
            name: fix.name,
            success: true,
            data: data
          })
        }
      } catch (err) {
        console.error(`Exception in ${fix.name}:`, err)
        results.push({
          name: fix.name,
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'RLS fix applied',
      results: results
    })

  } catch (error) {
    console.error('Error in apply-rls-fix API:', error)
    return NextResponse.json({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  }
}
