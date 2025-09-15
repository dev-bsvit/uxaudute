import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/update-prices - Обновление цен пакетов
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Обновляем цены пакетов
    const updates = [
      {
        package_type: 'basic',
        credits_amount: 10,
        price_rub: 19900 // $1.99
      },
      {
        package_type: 'pro', 
        credits_amount: 50,
        price_rub: 89900 // $8.99
      },
      {
        package_type: 'team',
        credits_amount: 200,
        price_rub: 299900 // $29.99
      }
    ]

    const results = []

    for (const update of updates) {
      const { data, error } = await supabaseClient
        .from('package_pricing')
        .update({
          credits_amount: update.credits_amount,
          price_rub: update.price_rub,
          updated_at: new Date().toISOString()
        })
        .eq('package_type', update.package_type)

      if (error) {
        console.error(`Error updating ${update.package_type}:`, error)
        results.push({ 
          package_type: update.package_type, 
          success: false, 
          error: error.message 
        })
      } else {
        results.push({ 
          package_type: update.package_type, 
          success: true,
          credits_amount: update.credits_amount,
          price_usd: update.price_rub / 100
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Package prices updated successfully',
      results
    })

  } catch (error) {
    console.error('Error in POST /api/admin/update-prices:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
