import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET /api/credits/packages - Получить доступные пакеты кредитов
export async function GET(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем активные пакеты
    const { data: packages, error } = await supabaseClient
      .from('package_pricing')
      .select('*')
      .eq('is_active', true)
      .order('credits_amount', { ascending: true })

    if (error) {
      console.error('Error fetching packages:', error)
      return NextResponse.json({ error: 'Failed to fetch packages' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      packages: packages || []
    })

  } catch (error) {
    console.error('Error in GET /api/credits/packages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

