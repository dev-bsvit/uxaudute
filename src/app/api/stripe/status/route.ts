import { NextRequest, NextResponse } from 'next/server'

// GET /api/stripe/status - Проверка статуса Stripe интеграции
export async function GET(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    // Проверяем переменные окружения
    const envCheck = {
      stripe_secret_key: !!stripeSecretKey,
      stripe_publishable_key: !!stripePublishableKey,
      webhook_secret: !!webhookSecret,
      app_url: !!appUrl,
    }

    // Проверяем режим (test/live)
    const mode = {
      is_production: process.env.NODE_ENV === 'production' && stripeSecretKey?.startsWith('sk_live_'),
      secret_key_type: stripeSecretKey?.startsWith('sk_live_') ? 'live' : 'test',
      publishable_key_type: stripePublishableKey?.startsWith('pk_live_') ? 'live' : 'test',
    }

    // Проверяем конфигурацию
    const config = {
      currency: 'rub',
      success_url: `${appUrl}/credits?success=true`,
      cancel_url: `${appUrl}/credits?canceled=true`,
      webhook_configured: !!webhookSecret,
    }

    return NextResponse.json({
      success: true,
      message: 'Stripe status check completed',
      environment: envCheck,
      mode: mode,
      config: config,
      status: {
        all_env_vars_present: Object.values(envCheck).every(Boolean),
        production_ready: mode.is_production,
        webhook_ready: config.webhook_configured,
      }
    })

  } catch (error) {
    console.error('Error in GET /api/stripe/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
