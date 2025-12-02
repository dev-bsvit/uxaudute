import { NextRequest, NextResponse } from 'next/server'

/**
 * TEST endpoint для симуляции LiqPay webhook в sandbox режиме
 *
 * В sandbox LiqPay не отправляет реальные webhooks
 * Этот endpoint позволяет вручную триггернуть обработку платежа
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Создаем фейковые данные webhook
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/liqpay/webhook`

    // Формируем данные как если бы LiqPay их отправил
    const fakeWebhookData = new FormData()

    const paymentData = {
      public_key: process.env.LIQPAY_PUBLIC_KEY,
      version: 3,
      action: 'pay',
      payment_id: Math.floor(Math.random() * 1000000000),
      status: 'sandbox',  // sandbox статус считается успешным
      amount: 8.99,
      currency: 'USD',
      order_id: orderId,
      description: 'Test payment',
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
    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: fakeWebhookData
    })

    const result = await response.json()

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
