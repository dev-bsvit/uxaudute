import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// GET /api/stripe/test-keys - Тест Stripe ключей
export async function GET(request: NextRequest) {
  try {
    // Проверяем наличие ключей
    const hasSecretKey = !!process.env.STRIPE_SECRET_KEY
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const hasWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET

    if (!hasSecretKey || !hasPublishableKey) {
      return NextResponse.json({
        success: false,
        message: 'Stripe keys not configured',
        missing: {
          secret_key: !hasSecretKey,
          publishable_key: !hasPublishableKey,
          webhook_secret: !hasWebhookSecret,
        }
      }, { status: 400 })
    }

    // Тестируем Stripe API
    if (!stripe) {
      return NextResponse.json({
        success: false,
        message: 'Stripe client not initialized',
        error: 'STRIPE_SECRET_KEY is invalid or empty'
      }, { status: 500 })
    }

    // Пробуем получить список платежей (тест API)
    try {
      const paymentIntents = await stripe.paymentIntents.list({ limit: 1 })
      
      return NextResponse.json({
        success: true,
        message: 'Stripe keys are working correctly',
        test_results: {
          api_connection: true,
          payment_intents_count: paymentIntents.data.length,
          secret_key_type: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_') ? 'live' : 'test',
          publishable_key_type: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_') ? 'live' : 'test',
        }
      })
    } catch (stripeError: any) {
      return NextResponse.json({
        success: false,
        message: 'Stripe API test failed',
        error: stripeError.message,
        error_code: stripeError.code
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in GET /api/stripe/test-keys:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

