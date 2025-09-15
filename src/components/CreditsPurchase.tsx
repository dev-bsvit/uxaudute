'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import StripeCheckout from './StripeCheckout'

interface Package {
  id: string
  package_type: string
  credits_amount: number
  price_rub: number
  is_active: boolean
}

interface CreditsPurchaseProps {
  userId?: string
  onPurchaseComplete?: () => void
}

export default function CreditsPurchase({ userId, onPurchaseComplete }: CreditsPurchaseProps) {
  const [packages, setPackages] = useState<Package[]>([
    {
      id: 'basic',
      package_type: 'basic',
      credits_amount: 10,
      price_rub: 199, // $1.99
      is_active: true
    },
    {
      id: 'pro',
      package_type: 'pro', 
      credits_amount: 50,
      price_rub: 899, // $8.99
      is_active: true
    },
    {
      id: 'team',
      package_type: 'team',
      credits_amount: 200,
      price_rub: 2999, // $29.99
      is_active: true
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null)
  const [purchasing, setPurchasing] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [stripePromise, setStripePromise] = useState<any>(null)

  useEffect(() => {
    // Используем моковые данные с правильными ценами
    // const fetchPackages = async () => {
    //   try {
    //     setLoading(true)
    //     setError(null)

    //     const response = await fetch('/api/credits/packages')
    //     if (!response.ok) {
    //       throw new Error('Failed to fetch packages')
    //     }

    //     const data = await response.json()
    //     setPackages(data.packages || [])
    //   } catch (err) {
    //     console.error('Error fetching packages:', err)
    //     setError(err instanceof Error ? err.message : 'Unknown error')
    //   } finally {
    //     setLoading(false)
    //   }
    // }

    // Инициализируем Stripe
    const initStripe = async () => {
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      setStripePromise(stripe)
    }

    // fetchPackages() // Отключено, используем моковые данные
    initStripe()
  }, [])

  const handlePurchase = async (pkg: Package) => {
    if (!userId) {
      setError('Пользователь не авторизован')
      return
    }

    try {
      setPurchasing(true)
      setError(null)

      // Создаем Payment Intent через Stripe
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userId}`
        },
        body: JSON.stringify({
          package_id: pkg.id,
          package_type: pkg.package_type,
          credits_amount: pkg.credits_amount,
          price_rub: pkg.price_rub
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const data = await response.json()
      setClientSecret(data.client_secret)
      setSelectedPackage(pkg)

    } catch (err) {
      console.error('Error creating payment intent:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setPurchasing(false)
    }
  }

  const handlePaymentSuccess = () => {
    setClientSecret(null)
    setSelectedPackage(null)
    if (onPurchaseComplete) {
      onPurchaseComplete()
    }
  }

  const handlePaymentError = (error: string) => {
    setError(error)
    setClientSecret(null)
    setSelectedPackage(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Загрузка пакетов...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Ошибка: {error}</p>
      </div>
    )
  }

  // Если есть clientSecret, показываем Stripe Checkout
  if (clientSecret && selectedPackage && stripePromise) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Оплата</h2>
          <p className="text-gray-600">Завершите покупку кредитов</p>
        </div>

        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripeCheckout
            clientSecret={clientSecret}
            packageInfo={selectedPackage}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </Elements>

        <button
          onClick={() => {
            setClientSecret(null)
            setSelectedPackage(null)
          }}
          className="w-full py-2 px-4 rounded-md font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
        >
          Отменить покупку
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Пополнить баланс</h2>
        <p className="text-gray-600">Выберите пакет кредитов для покупки</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <div
            key={pkg.id}
            className={`relative rounded-lg border-2 p-6 transition-all duration-200 ${
              selectedPackage?.id === pkg.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">
                {pkg.package_type}
              </h3>
              
              <div className="mb-4">
                <div className="text-3xl font-bold text-blue-600">
                  {pkg.credits_amount}
                </div>
                <div className="text-sm text-gray-500">кредитов</div>
              </div>

              <div className="mb-6">
                <div className="text-2xl font-bold text-gray-900">
                  ${(pkg.price_rub / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  ${(pkg.price_rub / 100 / pkg.credits_amount).toFixed(2)} за кредит
                </div>
              </div>

              <button
                onClick={() => handlePurchase(pkg)}
                disabled={purchasing}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                  purchasing
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {purchasing ? 'Подготовка платежа...' : 'Купить'}
              </button>
            </div>

            {pkg.package_type === 'pro' && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                Популярный
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Информация о кредитах:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Основной аудит: 2 кредита</li>
          <li>• Дополнительный аудит: 1 кредит</li>
          <li>• Кредиты не имеют срока действия</li>
          <li>• Grace-лимит: можно уйти в минус на 1 кредит</li>
        </ul>
      </div>
    </div>
  )
}
