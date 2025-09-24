'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Projects } from '@/components/projects'
import { Auth } from '@/components/auth'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Section } from '@/components/ui/section'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/use-translation'

export default function ProjectsPage() {
  const { t } = useTranslation()
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
              {t('projects.signInTitle')}
            </h2>
            <p className="text-lg text-slate-600">
              {t('projects.signInDescription')}
            </p>
          </div>
          <Auth onAuthChange={handleAuthChange} />
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <PageContent maxWidth="7xl">
        <div className="space-y-8">
          <PageHeader 
            title={t('projects.title')}
            description={t('projects.description')}
          />
          
          <Section>
            <Projects user={user} />
          </Section>
        </div>
      </PageContent>
    </SidebarDemo>
  )
}