import Stripe from 'stripe'
import { loadStripe } from '@stripe/stripe-js'

// Server-side Stripe (для API routes)
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
    })
  : null

// Client-side Stripe (для фронтенда)
export const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

// Конфигурация Stripe (Production)
export const STRIPE_CONFIG = {
  currency: 'rub',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?success=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/credits?canceled=true`,
  webhook_secret: process.env.STRIPE_WEBHOOK_SECRET!,
  // Проверяем что мы в продакшене
  is_production: process.env.NODE_ENV === 'production' && process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
}

// Создание Payment Intent для покупки кредитов
export async function createPaymentIntent(
  amount: number,
  currency: string = 'rub',
  metadata: Record<string, string> = {}
) {
  if (!stripe) {
    return {
      success: false,
      error: 'Stripe not configured - missing STRIPE_SECRET_KEY',
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe использует копейки
      currency,
      metadata,
      automatic_payment_methods: {
        enabled: true,
      },
    })

    return {
      success: true,
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Проверка статуса Payment Intent
export async function getPaymentIntentStatus(paymentIntentId: string) {
  if (!stripe) {
    return {
      success: false,
      error: 'Stripe not configured - missing STRIPE_SECRET_KEY',
    }
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      success: true,
      status: paymentIntent.status,
      payment_intent: paymentIntent,
    }
  } catch (error) {
    console.error('Error retrieving payment intent:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
