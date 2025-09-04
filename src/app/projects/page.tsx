'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
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



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">
              Войдите для просмотра проектов
            </h2>
            <p className="text-lg text-slate-600">
              Создавайте и управляйте своими UX исследованиями
            </p>
          </div>
          <Auth onAuthChange={handleAuthChange} />
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="text-center">
          <h1 
            className="mb-4"
            style={{
              color: '#1F2937',
              textAlign: 'center',
              fontFamily: 'Inter Display',
              fontSize: '48px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '90%'
            }}
          >
            Мои проекты
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Управляйте своими UX исследованиями. Создавайте новые проекты или продолжайте работу с существующими.
          </p>
        </div>
        
        <Projects user={user} />
      </div>
    </SidebarDemo>
  )
}