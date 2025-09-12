'use client'

import { useState } from 'react'
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js'

interface StripeCheckoutProps {
  clientSecret: string
  packageInfo: {
    package_type: string
    credits_amount: number
    price_rub: number
  }
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ clientSecret, packageInfo, onSuccess, onError }: StripeCheckoutProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/credits?success=true`,
        },
        redirect: 'if_required',
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        onSuccess()
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Покупка пакета {packageInfo.package_type}
        </h3>
        <div className="flex justify-between items-center">
          <span className="text-blue-800">
            {packageInfo.credits_amount} кредитов
          </span>
          <span className="text-xl font-bold text-blue-900">
            {packageInfo.price_rub.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-4">
        <PaymentElement />
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
          !stripe || isProcessing
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {isProcessing ? 'Обработка платежа...' : `Оплатить ${packageInfo.price_rub.toLocaleString('ru-RU')} ₽`}
      </button>
    </form>
  )
}

export default function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <div className="max-w-md mx-auto">
      <CheckoutForm {...props} />
    </div>
  )
}
