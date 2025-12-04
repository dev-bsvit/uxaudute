import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * TEST endpoint для симуляции LiqPay webhook в sandbox режиме
 *
 * В sandbox LiqPay не отправляет реальные webhooks
 * Этот endpoint позволяет вручную триггернуть обработку платежа
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    console.log('🧪 Test webhook triggered for order:', orderId)

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Получаем заказ из БД
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('❌ Order not found:', orderId)
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    console.log('📦 Order found:', order)

    // Создаем фейковые данные webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.aiscan.space'}/api/liqpay/webhook`

    // Формируем данные как если бы LiqPay их отправил
    const fakeWebhookData = new FormData()

    const paymentData = {
      public_key: process.env.LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      payment_id: Math.floor(Math.random() * 1000000000),
      status: 'sandbox',  // sandbox статус считается успешным
      amount: order.amount_usd || 8.99,
      currency: 'USD',
      order_id: orderId,
      description: `Payment for order ${orderId}`,
      sender_card_mask2: '424242******4242',
      create_date: Date.now(),
      end_date: Date.now(),
      transaction_id: Math.floor(Math.random() * 1000000000)
    }

    const data = Buffer.from(JSON.stringify(paymentData)).toString('base64')

    // Генерируем подпись
    const crypto = require('crypto')
    const privateKey = process.env.LIQPAY_PRIVATE_KEY!
    const signString = privateKey + data + privateKey
    const signature = crypto.createHash('sha1').update(signString).digest('base64')

    fakeWebhookData.append('data', data)
    fakeWebhookData.append('signature', signature)

    // Отправляем на наш webhook
    console.log('📤 Sending webhook to:', webhookUrl)

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: fakeWebhookData
    })

    console.log('📥 Webhook response status:', response.status)

    const result = await response.json()

    console.log('✅ Webhook result:', result)

    if (!response.ok) {
      console.error('❌ Webhook failed:', result)
      return NextResponse.json({
        success: false,
        message: 'Webhook processing failed',
        webhookResponse: result,
        orderId,
        paymentId: paymentData.payment_id
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook triggered successfully',
      webhookResponse: result,
      orderId,
      paymentId: paymentData.payment_id
    })

  } catch (error) {
    console.error('Error triggering test webhook:', error)
    return NextResponse.json(
      { error: 'Failed to trigger webhook', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Test webhook endpoint. Use POST with orderId to simulate payment.',
    example: {
      method: 'POST',
      body: { orderId: '3477c90c-6361-46d2-8242-51ed517d6eb2' }
    }
  })
}
