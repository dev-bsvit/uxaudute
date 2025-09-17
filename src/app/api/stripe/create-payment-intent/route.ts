import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createPaymentIntent } from '@/lib/stripe'

// POST /api/stripe/create-payment-intent - Создать Payment Intent для покупки кредитов
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

    // Создаем заказ в базе данных
    const { data: order, error: orderError } = await supabaseClient
      .from('payment_orders')
      .insert({
        user_id: user.id,
        package_id,
        package_type,
        credits_amount,
        price_rub,
        status: 'pending',
        payment_method: 'stripe'
      })
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Создаем Payment Intent в Stripe
    const paymentResult = await createPaymentIntent(
      price_rub,
      'rub',
      {
        user_id: user.id,
        order_id: order.id,
        package_type,
        credits_amount: credits_amount.toString(),
      }
    )

    if (!paymentResult.success) {
      return NextResponse.json({ 
        error: 'Failed to create payment intent', 
        details: paymentResult.error 
      }, { status: 500 })
    }

    // Обновляем заказ с Payment Intent ID
    const { error: updateError } = await supabaseClient
      .from('payment_orders')
      .update({
        stripe_payment_intent_id: paymentResult.payment_intent_id,
        status: 'payment_pending'
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Error updating order with payment intent:', updateError)
    }

    return NextResponse.json({
      success: true,
      client_secret: paymentResult.client_secret,
      order_id: order.id,
      payment_intent_id: paymentResult.payment_intent_id,
      message: 'Payment intent created successfully'
    })

  } catch (error) {
    console.error('Error in POST /api/stripe/create-payment-intent:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

