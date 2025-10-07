'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, getCurrentUser } from '@/lib/database'
import { User } from '@supabase/supabase-js'
import { LogIn, LogOut, UserPlus } from 'lucide-react'
// import { useTranslation } from '@/hooks/use-translation' // Временно отключено

interface AuthProps {
  onAuthChange?: (user: User | null) => void
}

export function Auth({ onAuthChange }: AuthProps) {
  // Простые переводы
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'auth.signInWithGoogle': 'Войти через Google',
      'auth.signOut': 'Выйти',
      'auth.welcome': 'Добро пожаловать',
      'auth.loading': 'Загрузка...'
    }
    return translations[key] || key
  }
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
      onAuthChange?.(currentUser)
    } catch (error) {
      console.error('Error checking user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)

    try {
      const { user: signedInUser } = await signInWithEmail(email, password)
      setUser(signedInUser)
      onAuthChange?.(signedInUser)
      setEmail('')
      setPassword('')

      // Редиректим на /auth/callback для плавного перехода
      window.location.href = '/auth/callback'
    } catch (error: any) {
      setError(error.message)
      setAuthLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthLoading(true)
    setError(null)

    try {
      const { user: newUser } = await signUpWithEmail(email, password, fullName)
      if (newUser) {
        alert(t('auth.checkEmail'))
      }
      setEmail('')
      setPassword('')
      setFullName('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      setUser(null)
      onAuthChange?.(null)
    } catch (error: any) {
      setError(error.message)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setError(null)

    try {
      await signInWithGoogle()
      // Редирект происходит автоматически
    } catch (error: any) {
      setError(error.message)
      setAuthLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center justify-between p-4 bg-white rounded-xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white font-semibold">
              {user.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-slate-900">{user.user_metadata?.full_name || t('auth.user')}</p>
            <p className="text-sm text-slate-600">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSignOut}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t('navigation.logout')}
        </Button>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          {mode === 'signin' ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          {mode === 'signin' ? t('auth.signInTitle') : t('auth.signUpTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Google Sign In кнопка */}
        <div className="mb-6">
          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-3 py-3"
            onClick={handleGoogleSignIn}
            disabled={authLoading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {authLoading ? t('auth.connecting') : t('auth.continueWithGoogle')}
          </Button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-4 text-slate-500">{t('common.or')}</span>
          </div>
        </div>

        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-1">
                {t('common.fullName')}
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              {t('common.email')}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              {t('common.password')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={6}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={authLoading}
          >
            {authLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                {mode === 'signin' ? t('auth.signingIn') : t('auth.registering')}
              </div>
            ) : (
              mode === 'signin' ? t('auth.signInButton') : t('auth.signUpButton')
            )}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {mode === 'signin' 
                ? t('auth.noAccount') 
                : t('auth.hasAccount')
              }
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
