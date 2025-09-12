import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { stripe, STRIPE_CONFIG } from '@/lib/stripe'
import Stripe from 'stripe'

// POST /api/stripe/webhook - Обработка webhook от Stripe
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
      if (!stripe) {
        throw new Error('Stripe not configured')
      }
      event = stripe.webhooks.constructEvent(body, signature, STRIPE_CONFIG.webhook_secret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Обрабатываем разные типы событий
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break

      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent, supabaseClient)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error in webhook handler:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Обработка успешного платежа
async function handlePaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  try {
    const { user_id, order_id, credits_amount } = paymentIntent.metadata

    if (!user_id || !order_id || !credits_amount) {
      console.error('Missing metadata in payment intent:', paymentIntent.metadata)
      return
    }

    // Обновляем статус заказа
    const { error: orderError } = await supabaseClient
      .from('payment_orders')
      .update({
        status: 'paid',
        stripe_payment_intent_id: paymentIntent.id,
        paid_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (orderError) {
      console.error('Error updating order:', orderError)
      return
    }

    // Добавляем кредиты пользователю
    const { data: addResult, error: addError } = await supabaseClient
      .rpc('add_credits', {
        user_uuid: user_id,
        amount: parseInt(credits_amount),
        source: 'purchase',
        description: `Покупка кредитов через Stripe (заказ ${order_id})`
      })

    if (addError) {
      console.error('Error adding credits:', addError)
      return
    }

    // Создаем транзакцию
    const { error: transactionError } = await supabaseClient
      .from('transactions')
      .insert({
        user_id,
        amount: parseInt(credits_amount),
        source: 'purchase',
        description: `Покупка кредитов через Stripe (заказ ${order_id})`,
        related_order_id: order_id
      })

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
    }

    console.log(`Successfully processed payment for user ${user_id}, order ${order_id}`)

  } catch (error) {
    console.error('Error in handlePaymentSuccess:', error)
  }
}

// Обработка неудачного платежа
async function handlePaymentFailure(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  try {
    const { order_id } = paymentIntent.metadata

    if (!order_id) {
      console.error('Missing order_id in payment intent metadata')
      return
    }

    // Обновляем статус заказа
    const { error: orderError } = await supabaseClient
      .from('payment_orders')
      .update({
        status: 'failed',
        stripe_payment_intent_id: paymentIntent.id,
        failed_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
    }

    console.log(`Payment failed for order ${order_id}`)

  } catch (error) {
    console.error('Error in handlePaymentFailure:', error)
  }
}

// Обработка отмененного платежа
async function handlePaymentCanceled(
  paymentIntent: Stripe.PaymentIntent,
  supabaseClient: any
) {
  try {
    const { order_id } = paymentIntent.metadata

    if (!order_id) {
      console.error('Missing order_id in payment intent metadata')
      return
    }

    // Обновляем статус заказа
    const { error: orderError } = await supabaseClient
      .from('payment_orders')
      .update({
        status: 'canceled',
        stripe_payment_intent_id: paymentIntent.id,
        canceled_at: new Date().toISOString()
      })
      .eq('id', order_id)

    if (orderError) {
      console.error('Error updating order status:', orderError)
    }

    console.log(`Payment canceled for order ${order_id}`)

  } catch (error) {
    console.error('Error in handlePaymentCanceled:', error)
  }
}
