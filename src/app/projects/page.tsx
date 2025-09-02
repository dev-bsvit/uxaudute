'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { Projects } from '@/components/projects'
import { Auth } from '@/components/auth'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ProjectsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAuthChange = (user: User | null) => {
    setUser(user)
  }

  const handleProjectSelect = (projectId: string) => {
    // Перенаправляем на dashboard с выбранным проектом
    router.push(`/dashboard?project=${projectId}`)
  }

  if (loading) {
    return (
      <Layout title="Проекты">
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Проекты">
      {!user ? (
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              Войдите для просмотра проектов
            </h2>
            <p className="text-slate-600">
              Создавайте и управляйте своими UX исследованиями
            </p>
          </div>
          <Auth onAuthChange={handleAuthChange} />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-4">
              Мои проекты
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Управляйте своими UX исследованиями. Создавайте новые проекты или продолжайте работу с существующими.
            </p>
          </div>
          
          <Projects 
            user={user} 
            onProjectSelect={handleProjectSelect}
          />
        </div>
      )}
    </Layout>
  )
}