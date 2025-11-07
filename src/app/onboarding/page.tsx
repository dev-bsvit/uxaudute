'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { OnboardingWizard, OnboardingData } from '@/components/onboarding/onboarding-wizard'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Пользователь не авторизован - редирект на главную
        router.push('/')
        return
      }

      setUserId(user.id)

      // Проверяем, прошел ли пользователь уже онбординг
      const { data: onboarding } = await supabase
        .from('user_onboarding')
        .select('completed')
        .eq('user_id', user.id)
        .single()

      if (onboarding?.completed) {
        // Уже прошел онбординг - редирект на home
        router.push('/home')
        return
      }

      setIsLoading(false)
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsLoading(false)
    }
  }

  const handleComplete = async (data: OnboardingData) => {
    if (!userId) return

    try {
      // Сохраняем данные через API
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          firstName: data.firstName,
          role: data.role,
          interests: data.interests,
          source: data.source,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save onboarding data')
      }

      // Начисляем начальные 5 кредитов для нового пользователя
      console.log('💰 Начисляем начальные кредиты для пользователя:', userId)
      try {
        const balanceResponse = await fetch('/api/ensure-user-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        if (balanceResponse.ok) {
          const balanceResult = await balanceResponse.json()
          console.log('✅ Баланс создан:', balanceResult)
        } else {
          console.error('❌ Ошибка создания баланса:', await balanceResponse.json())
        }
      } catch (balanceError) {
        console.error('❌ Ошибка при начислении кредитов:', balanceError)
      }

      // Редирект на home после успешного сохранения
      router.push('/home')
    } catch (error) {
      console.error('Error completing onboarding:', error)
      alert('Произошла ошибка при сохранении данных. Пожалуйста, попробуйте еще раз.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-[#0058FC] border-t-transparent animate-spin"></div>
          </div>
          <p className="text-[#6c6c89] text-sm">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Form (756px = 50%) */}
      <div className="w-full lg:w-1/2 bg-white flex items-center justify-center overflow-y-auto">
        {/* Logo */}
        <div className="absolute top-[26px] left-[20px]">
          <svg width="116" height="21" viewBox="0 0 116 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="0" y="16" fill="#0058FC" fontFamily="Inter Display, sans-serif" fontSize="18" fontWeight="600">
              QuickUX
            </text>
            <path d="M110 8 L116 8 L113 12 Z" fill="#0058FC"/>
          </svg>
        </div>

        {/* Form container: 467px width */}
        <div className="w-full max-w-[467px] px-[10px]">
          <OnboardingWizard onComplete={handleComplete} />
        </div>
      </div>

      {/* Right side - Image (756px = 50%, height 982px) */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden h-screen">
        {/* Rectangle 24 - настоящее изображение с зелеными холмами и оранжевыми цветами */}
        <Image
          src="/rectangle-24.png"
          alt="Onboarding background with green hills"
          fill
          className="object-cover object-center"
          priority
        />
      </div>
    </div>
  )
}
