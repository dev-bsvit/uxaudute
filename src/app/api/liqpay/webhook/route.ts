import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { parseWebhookData, isPaymentSuccessful, type LiqPayStatus } from '@/lib/liqpay'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/config/tokenomics.config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/liqpay/webhook
 *
 * Обработка webhook уведомлений от LiqPay
 * LiqPay отправляет POST запрос с параметрами data и signature
 */
export async function POST(request: NextRequest) {
  try {
    console.log('🔵 LiqPay webhook received')

    // Получаем данные из формы (application/x-www-form-urlencoded)
    const formData = await request.formData()
    const data = formData.get('data') as string
    const signature = formData.get('signature') as string

    if (!data || !signature) {
      console.error('❌ Missing data or signature')
      return NextResponse.json(
        { error: 'Missing data or signature' },
        { status: 400 }
      )
    }

    console.log('🔍 Parsing webhook data...')

    // Парсим и проверяем подпись
    const webhookData = parseWebhookData(data, signature)

    if (!webhookData) {
      console.error('❌ Invalid signature or corrupted data')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    console.log('✅ Webhook data:', {
      payment_id: webhookData.payment_id,
      order_id: webhookData.order_id,
      status: webhookData.status,
      amount: webhookData.amount,
      action: webhookData.action
    })

    const { order_id, payment_id, status, action } = webhookData

    // Получаем заказ из БД
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
        .select('*')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', order_id)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('📦 Order found:', {
      order_type: order.order_type,
      user_id: order.user_id,
      status: order.status
    })

    // Проверяем, не обработан ли уже платеж
    if (order.status === 'completed') {
      console.log('⚠️ Order already completed')
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // ======================================
    // ОБРАБОТКА УСПЕШНОГО ПЛАТЕЖА
    // ======================================
    if (action === 'pay' && isPaymentSuccessful(status as LiqPayStatus)) {
      console.log('💰 Processing successful payment...')

      // Обновляем заказ
      await supabase
        .from('payment_orders')
        .update({
          status: 'completed',
          liqpay_payment_id: payment_id.toString(),
          completed_at: new Date().toISOString(),
          metadata: { webhook_data: webhookData }
        })
        .eq('id', order_id)

      // ======================================
      // ПОКУПКА КРЕДИТОВ
      // ======================================
      if (order.order_type === 'credits') {
        console.log('🪙 Adding credits to user balance...')

        const creditsToAdd = order.credits

        // Добавляем кредиты через RPC функцию
        const { error: addCreditsError } = await supabase.rpc('add_credits', {
          user_uuid: order.user_id,
          amount: creditsToAdd,
          source: 'purchase_liqpay',
          description: `Покупка ${creditsToAdd} кредитів через LiqPay`
        })

        if (addCreditsError) {
          console.error('❌ Failed to add credits:', addCreditsError)
          // Помечаем заказ как failed
          await supabase
            .from('payment_orders')
            .update({ status: 'failed' })
            .eq('id', order_id)

          return NextResponse.json(
            { error: 'Failed to add credits' },
            { status: 500 }
          )
        }

        console.log('✅ Credits added successfully')
      }

      // ======================================
      // ПОДПИСКА
      // ======================================
      if (order.order_type === 'subscription') {
        console.log('📅 Creating subscription...')

        const subscriptionPlan = SUBSCRIPTION_PLANS[order.subscription_type as keyof typeof SUBSCRIPTION_PLANS]
        if (!subscriptionPlan) {
          console.error('❌ Invalid subscription type:', order.subscription_type)
          return NextResponse.json(
            { error: 'Invalid subscription type' },
            { status: 400 }
          )
        }

        // Вычисляем end_date
        const startDate = new Date()
        const endDate = new Date()

        if (subscriptionPlan.billingPeriod === 'monthly') {
          endDate.setMonth(endDate.getMonth() + 1)
        } else if (subscriptionPlan.billingPeriod === 'yearly') {
          endDate.setFullYear(endDate.getFullYear() + 1)
        }

        // Создаем или обновляем подписку
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: order.user_id,
            subscription_type: order.subscription_type,
            status: 'active',
            payment_provider: 'liqpay',
            external_subscription_id: payment_id.toString(),
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            daily_limit: subscriptionPlan.dailyLimit,
            metadata: { liqpay_payment_id: payment_id }
          }, {
            onConflict: 'user_id'
          })

        if (subError) {
          console.error('❌ Failed to create subscription:', subError)
          await supabase
            .from('payment_orders')
            .update({ status: 'failed' })
            .eq('id', order_id)

          return NextResponse.json(
            { error: 'Failed to create subscription' },
            { status: 500 }
          )
        }

        console.log('✅ Subscription created successfully')
      }

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully'
      })
    }

    // ======================================
    // ОБРАБОТКА ПОДПИСКИ (subscribe/unsubscribe)
    // ======================================
    if (action === 'subscribe' && status === 'subscribed') {
      console.log('📅 Subscription confirmed via webhook')

      // Уже обработано выше в pay action
      return NextResponse.json({
        success: true,
        message: 'Subscription confirmed'
      })
    }

    if (action === 'unsubscribe' && status === 'unsubscribed') {
      console.log('❌ Subscription cancelled via webhook')

      // Отменяем подписку
      await supabase
        .from('subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('external_subscription_id', payment_id.toString())

      return NextResponse.json({
        success: true,
        message: 'Subscription cancelled'
      })
    }

    // ======================================
    // ОБРАБОТКА НЕУСПЕШНОГО ПЛАТЕЖА
    // ======================================
    if (status === 'failure' || status === 'error') {
      console.log('❌ Payment failed')

      await supabase
        .from('payment_orders')
        .update({
          status: 'failed',
          metadata: { webhook_data: webhookData }
        })
        .eq('id', order_id)

      return NextResponse.json({
        success: true,
        message: 'Payment failed - order updated'
      })
    }

    // Другие статусы (processing, wait_accept и т.д.)
    console.log('⏳ Payment status:', status)
    return NextResponse.json({
      success: true,
      message: `Payment status: ${status}`
    })

  } catch (error) {
    console.error('❌ Error in LiqPay webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET метод для проверки работоспособности webhook
export async function GET() {
  return NextResponse.json({
    message: 'LiqPay webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}
