'use client'

import { useState } from 'react'
import { useTranslation } from '@/hooks/use-translation'
import { createFormatters } from '@/lib/i18n/formatters'
import { CREDIT_PACKAGES, type PackageType } from '@/config/tokenomics.config'

interface CreditsPurchaseProps {
  userId?: string
  onPurchaseComplete?: () => void
}

export default function CreditsPurchase({ userId, onPurchaseComplete }: CreditsPurchaseProps) {
  const [purchasing, setPurchasing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t, currentLanguage } = useTranslation()
  const { formatNumber } = createFormatters(currentLanguage || 'en')

  const handlePurchase = async (packageId: PackageType) => {
    if (!userId) {
      setError(t('components.credits.userNotAuthorized'))
      return
    }

    try {
      setPurchasing(true)
      setError(null)

      // Создаем платеж через LiqPay
      const response = await fetch('/api/liqpay/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          packageId,
          type: 'credits'
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create payment')
      }

      const data = await response.json()

      // Создаем форму и отправляем на LiqPay
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = data.checkoutUrl
      form.style.display = 'none'

      const dataInput = document.createElement('input')
      dataInput.name = 'data'
      dataInput.value = data.data
      form.appendChild(dataInput)

      const signatureInput = document.createElement('input')
      signatureInput.name = 'signature'
      signatureInput.value = data.signature
      form.appendChild(signatureInput)

      document.body.appendChild(form)
      form.submit()

    } catch (err) {
      console.error('Error creating payment:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPurchasing(false)
    }
  }

  // Конвертируем CREDIT_PACKAGES в массив для отображения
  const packagesArray = Object.entries(CREDIT_PACKAGES).map(([id, pkg]) => ({
    id,
    ...pkg
  }))

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packagesArray.map((pkg) => {
          const packageName = t(`components.credits.packages.${pkg.id}` as const)
          const totalPrice = pkg.priceUSD.toFixed(2)
          const pricePerCredit = (pkg.priceUSD / pkg.credits).toFixed(2)

          return (
            <div
              key={pkg.id}
              className={`relative rounded-lg border-2 p-6 transition-all duration-200 ${
                pkg.isPopular
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 capitalize mb-2">
                  {packageName}
                </h3>

                <div className="mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {formatNumber(pkg.credits)}
                  </div>
                  <div className="text-sm text-gray-500">{t('components.credits.purchase.credits')}</div>
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-bold text-gray-900">
                    ${totalPrice}
                  </div>
                  <div className="text-sm text-gray-500">
                    {t('components.credits.purchase.pricePerCredit', { price: pricePerCredit })}
                  </div>
                </div>

                <button
                  onClick={() => handlePurchase(pkg.id as PackageType)}
                  disabled={purchasing}
                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                    purchasing
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {purchasing ? t('components.credits.preparingPayment') : t('components.credits.buy')}
                </button>
              </div>

              {pkg.isPopular && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {t('components.credits.purchase.popular')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">{t('components.credits.purchase.infoTitle')}</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• {t('components.credits.purchase.info.mainAudit')}</li>
          <li>• {t('components.credits.purchase.info.additionalAudit')}</li>
          <li>• {t('components.credits.purchase.info.noExpiry')}</li>
          <li>• {t('components.credits.purchase.info.graceLimit')}</li>
        </ul>
      </div>
    </div>
  )
}
