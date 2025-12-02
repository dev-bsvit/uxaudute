import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createCheckoutData, createSubscriptionData } from '@/lib/liqpay'
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/config/tokenomics.config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * POST /api/liqpay/create-payment
 *
 * Создает платеж через LiqPay для покупки кредитов или подписки
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, packageId, subscriptionId, type } = body

    console.log('🔵 LiqPay create-payment:', { userId, packageId, subscriptionId, type })

    // Валидация
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    if (!type || !['credits', 'subscription'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "credits" or "subscription"' },
        { status: 400 }
      )
    }

    let amount: number
    let description: string
    let productName: string
    let orderId: string

    // ======================================
    // ПОКУПКА КРЕДИТОВ
    // ======================================
    if (type === 'credits') {
      if (!packageId) {
        return NextResponse.json(
          { error: 'Package ID is required for credit purchase' },
          { status: 400 }
        )
      }

      const creditPackage = CREDIT_PACKAGES[packageId as keyof typeof CREDIT_PACKAGES]
      if (!creditPackage) {
        return NextResponse.json(
          { error: 'Invalid package ID' },
          { status: 400 }
        )
      }

      amount = creditPackage.priceUSD
      description = `Purchase ${creditPackage.credits} credits - ${creditPackage.name}`
      productName = `${creditPackage.credits} Credits Package`

      // Создаем заказ в БД
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .insert({
          user_id: userId,
          package_id: packageId,
          credits: creditPackage.credits,
          amount_usd: amount,
          payment_provider: 'liqpay',
          status: 'pending',
          order_type: 'credits'
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('❌ Error creating order:', orderError)
        return NextResponse.json(
          { error: 'Failed to create order' },
          { status: 500 }
        )
      }

      orderId = order.id

      // Создаем данные для checkout (LiqPay поддерживает USD)
      const { data, signature } = createCheckoutData({
        amount,
        currency: 'USD',
        description,
        orderId,
        productName,
        resultUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uxaudute.vercel.app'}/payment/success?order_id=${orderId}`,
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uxaudute.vercel.app'}/api/liqpay/webhook`
      })

      // Обновляем заказ с данными LiqPay
      await supabase
        .from('payment_orders')
        .update({
          liqpay_data: data,
          liqpay_signature: signature
        })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        type: 'credits',
        orderId,
        data,
        signature,
        amount,
        description,
        checkoutUrl: `https://www.liqpay.ua/api/3/checkout`
      })
    }

    // ======================================
    // ПОКУПКА ПОДПИСКИ
    // ======================================
    if (type === 'subscription') {
      if (!subscriptionId) {
        return NextResponse.json(
          { error: 'Subscription ID is required' },
          { status: 400 }
        )
      }

      const subscriptionPlan = SUBSCRIPTION_PLANS[subscriptionId as keyof typeof SUBSCRIPTION_PLANS]
      if (!subscriptionPlan) {
        return NextResponse.json(
          { error: 'Invalid subscription ID' },
          { status: 400 }
        )
      }

      amount = subscriptionPlan.priceUSD
      description = `Subscription ${subscriptionPlan.name} - ${subscriptionPlan.billingPeriod}`
      productName = subscriptionPlan.name

      // Создаем заказ подписки в БД
      const { data: order, error: orderError } = await supabase
        .from('payment_orders')
        .insert({
          user_id: userId,
          subscription_type: subscriptionId,
          amount_usd: amount,
          payment_provider: 'liqpay',
          status: 'pending',
          order_type: 'subscription'
        })
        .select()
        .single()

      if (orderError || !order) {
        console.error('❌ Error creating subscription order:', orderError)
        return NextResponse.json(
          { error: 'Failed to create subscription order' },
          { status: 500 }
        )
      }

      orderId = order.id

      // Создаем данные для подписки (LiqPay поддерживает USD)
      const { data, signature } = createSubscriptionData({
        amount,
        currency: 'USD',
        description,
        orderId,
        productName,
        resultUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uxaudute.vercel.app'}/payment/success?order_id=${orderId}`,
        serverUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://uxaudute.vercel.app'}/api/liqpay/webhook`
      })

      // Обновляем заказ с данными LiqPay
      await supabase
        .from('payment_orders')
        .update({
          liqpay_data: data,
          liqpay_signature: signature
        })
        .eq('id', orderId)

      return NextResponse.json({
        success: true,
        type: 'subscription',
        orderId,
        data,
        signature,
        amount,
        description,
        subscriptionPlan: subscriptionPlan.name,
        checkoutUrl: `https://www.liqpay.ua/api/3/checkout`
      })
    }

  } catch (error) {
    console.error('❌ Error in create-payment:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
