import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Проверяем triggers в базе данных
    const { data: triggers, error } = await supabaseClient
      .rpc('execute_sql_query', { 
        query_text: `
          SELECT 
            trigger_name,
            event_manipulation,
            event_object_table,
            action_statement
          FROM information_schema.triggers 
          WHERE trigger_schema = 'public'
          ORDER BY event_object_table, trigger_name;
        ` 
      })

    if (error) {
      console.error('Error checking triggers:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      triggers: triggers || [],
      hasUserCreatedTrigger: triggers?.some((t: any) => t.trigger_name === 'on_auth_user_created') || false
    })

  } catch (error) {
    console.error('Error in GET /api/check-triggers:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
