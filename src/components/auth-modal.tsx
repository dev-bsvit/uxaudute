'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { signInWithGoogle } from '@/lib/database'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [authLoading, setAuthLoading] = useState(false)

  // Закрытие по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      console.error('Error signing in:', error)
      setAuthLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-0 right-0 z-[9999] p-4 animate-in slide-in-from-top-5 fade-in duration-300">
      {/* Модальное окно в стиле Google One Tap */}
      <div className="bg-white rounded-xl shadow-2xl w-[380px] border border-gray-200">
        {/* Шапка */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm font-medium text-gray-700">Войти с помощью Google</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Контент */}
        <div className="px-6 py-5">
          <h3 className="text-base font-medium text-gray-900 mb-2">
            Начните работу с UX Audit
          </h3>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Войдите, чтобы создавать UX анализы, проводить исследования и улучшать ваши продукты
          </p>

          {/* Кнопка входа через Google */}
          <button
            onClick={handleGoogleSignIn}
            disabled={authLoading}
            className="w-full bg-[#4285F4] hover:bg-[#357ae8] disabled:bg-gray-300 text-white rounded-lg py-3 px-4 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
          >
            {authLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Подключение...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" className="bg-white rounded p-0.5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Войти через Google
              </>
            )}
          </button>

          {/* Дополнительный текст */}
          <p className="text-xs text-gray-500 mt-4 text-center leading-relaxed">
            Нажимая кнопку, вы соглашаетесь с условиями использования
          </p>
        </div>
      </div>
    </div>
  )
}
