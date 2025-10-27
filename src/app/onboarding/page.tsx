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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="w-full lg:w-1/2 bg-white overflow-y-auto">
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="w-full max-w-2xl">
            <OnboardingWizard onComplete={handleComplete} />
          </div>
        </div>
      </div>

      {/* Right side - Image/Illustration */}
      <div className="hidden lg:block lg:w-1/2 bg-gradient-to-br from-pink-400 via-pink-300 to-yellow-400 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative w-full h-full max-w-3xl max-h-[600px]">
            {/* Placeholder for design mockup image */}
            <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl shadow-2xl flex items-center justify-center">
              <div className="text-center text-white/80">
                <div className="w-64 h-64 mx-auto mb-6 bg-white/20 rounded-lg flex items-center justify-center">
                  {/* You can replace this with an actual image */}
                  <svg
                    className="w-32 h-32 text-white/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-2">Welcome to UX Audit</h3>
                <p className="text-lg">Design mockup placeholder</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
