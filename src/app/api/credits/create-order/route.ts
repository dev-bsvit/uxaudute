import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/credits/create-order - Создать заказ на покупку кредитов
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Получаем пользователя из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { package_id, package_type, credits_amount, price_rub } = await request.json()

    if (!package_id || !package_type || !credits_amount || !price_rub) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Создаем заказ
    const { data: order, error: orderError } = await supabaseClient
      .from('payment_orders')
      .insert({
        user_id: user.id,
        package_id,
        package_type,
        credits_amount,
        price_rub,
        status: 'pending',
        payment_method: 'stripe' // Пока что только Stripe
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      order_id: order.id,
      order: order,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/credits/create-order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
