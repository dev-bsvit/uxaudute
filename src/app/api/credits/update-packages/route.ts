import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/credits/update-packages - Обновление цен пакетов
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { packages } = await request.json()

    if (!packages || !Array.isArray(packages)) {
      return NextResponse.json({ 
        error: 'Invalid packages data' 
      }, { status: 400 })
    }

    const results = []

    for (const pkg of packages) {
      const { data, error } = await supabaseClient
        .from('package_pricing')
        .upsert({
          package_type: pkg.type,
          credits_amount: pkg.credits,
          price_rub: pkg.price_usd * 100, // Конвертируем доллары в копейки
          is_active: true
        }, {
          onConflict: 'package_type'
        })

      if (error) {
        console.error(`Error updating package ${pkg.type}:`, error)
        results.push({ type: pkg.type, success: false, error: error.message })
      } else {
        results.push({ type: pkg.type, success: true })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Packages updated successfully',
      results
    })

  } catch (error) {
    console.error('Error in POST /api/credits/update-packages:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
