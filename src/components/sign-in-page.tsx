'use client'

import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Image from 'next/image'

interface SignInPageProps {
  onAuthChange?: (user: User | null) => void
}

export function SignInPage({ onAuthChange }: SignInPageProps) {
  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/projects`,
        },
      })

      if (error) {
        console.error('Error signing in with Google:', error)
        alert('Не удалось войти через Google. Попробуйте еще раз.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Произошла ошибка. Попробуйте еще раз.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Form */}
      <div className="w-1/2 flex items-center justify-center bg-white">
        <div className="absolute top-[26px] left-[20px]">
          <Image
            src="/Logo-b.svg"
            alt="QuickUX"
            width={116}
            height={21}
            priority
          />
        </div>

        <div className="w-[467px] space-y-6">
          {/* Title */}
          <div className="space-y-1">
            <h1 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#1F1F1F]">
              Войдите для просмотра проектов
            </h1>
            <p className="text-base leading-[17.12px] text-[#A9A9BC]">
              Создавайте и управляйте своими UX исследованиями
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            onClick={handleGoogleSignIn}
            className="w-full h-[56px] flex items-center justify-center gap-[10px] bg-white border border-[#D1D1DB] rounded-[52px] px-[33px] py-5 hover:bg-[#F7F7F8] hover:border-[#C9C9D4] active:bg-[#EFEFF3] active:border-[#BDBDCC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(0,88,252,0.24)] disabled:bg-[#F7F7F8] disabled:border-[#E0E0E6] disabled:text-[#A9A9BC] disabled:cursor-not-allowed transition-all"
            aria-label="Продолжить с Google"
          >
            {/* Google Icon */}
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M29.3334 16.3067C29.3334 15.2534 29.2401 14.48 29.0401 13.68H16.2668V18.4534H23.7601C23.6268 19.4134 22.9868 20.8534 21.5734 21.8267L21.5468 22.0134L25.2934 24.88L25.5468 24.9067C27.9334 22.7334 29.3334 19.7867 29.3334 16.3067Z" fill="#4285F4"/>
              <path d="M16.2667 28C19.3334 28 21.9067 27.0133 23.5467 24.9067L21.5734 21.8267C20.9867 22.2 20.1734 22.4667 16.2667 22.4667C13.2667 22.4667 10.72 20.2933 9.78669 17.36L9.61336 17.3733L5.73336 20.3467L5.66669 20.5067C7.29336 23.7067 11.4667 28 16.2667 28Z" fill="#34A853"/>
              <path d="M9.78669 17.36C9.53336 16.5867 9.38669 15.76 9.38669 14.9067C9.38669 14.0534 9.53336 13.2267 9.77336 12.4534L9.76669 12.2534L5.84003 9.22669L5.66669 9.30669C4.81336 10.9867 4.30669 12.88 4.30669 14.9067C4.30669 16.9334 4.81336 18.8267 5.66669 20.5067L9.78669 17.36Z" fill="#FBBC05"/>
              <path d="M16.2667 7.34667C20.8667 7.34667 23.8134 9.30667 25.4667 10.84L27.1467 9.22667C21.8934 4.30667 19.3334 2 16.2667 2C11.4667 2 7.29336 6.29333 5.66669 9.49333L9.77336 12.6267C10.72 9.69333 13.2667 7.34667 16.2667 7.34667Z" fill="#EB4335"/>
            </svg>

            <span className="text-base font-medium leading-normal tracking-[-0.16px] text-[#000000]">
              Продолжить с Google
            </span>
          </button>
        </div>
      </div>

      {/* Right Column - Image/Gradient */}
      <div className="w-1/2 relative bg-gradient-to-br from-green-400 via-green-500 to-green-600">
        {/* Можно заменить на изображение когда оно будет доступно */}
        {/* <Image
          src="/auth-background.jpg"
          alt="Background"
          fill
          className="object-cover"
          style={{ objectPosition: '50% 50%' }}
          priority
        /> */}
        <div className="absolute inset-0 bg-[url('/auth-pattern.svg')] opacity-10" />
      </div>
    </div>
  )
}
