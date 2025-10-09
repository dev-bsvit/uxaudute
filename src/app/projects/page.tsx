'use client'

import { useState, useEffect } from 'react'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Projects } from '@/components/projects'
import { Auth } from '@/components/auth'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import { createProject, createAudit, uploadScreenshotFromBase64 } from '@/lib/database'

export default function ProjectsPage() {
  const { t, currentLanguage } = useTranslation()
  const { formatDate } = useFormatters()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [processingPending, setProcessingPending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Проверяем текущего пользователя и баланс
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      setLoading(false)

      // Проверяем и создаем начальный баланс для нового пользователя
      if (user) {
        try {
          const response = await fetch('/api/ensure-user-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          })
          if (response.ok) {
            console.log('✅ Баланс проверен/создан для нового пользователя')
          }
        } catch (error) {
          console.error('Ошибка проверки баланса:', error)
        }
      }
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)

      // При входе проверяем баланс
      if (session?.user) {
        try {
          const response = await fetch('/api/ensure-user-balance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: session.user.id })
          })
          if (response.ok) {
            console.log('✅ Баланс проверен/создан при входе')
          }
        } catch (error) {
          console.error('Ошибка проверки баланса:', error)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Проверяем pending analysis из localStorage после авторизации
  useEffect(() => {
    if (user && !loading && !processingPending) {
      handlePendingAnalysis()
    }
  }, [user, loading])

  const handlePendingAnalysis = async () => {
    const pendingAnalysis = localStorage.getItem('pendingAnalysis')
    if (!pendingAnalysis || !user) return

    setProcessingPending(true)
    try {
      const data = JSON.parse(pendingAnalysis)
      console.log('🔍 Обнаружен pendingAnalysis:', data)

      // Создаем проект
      const projectName = currentLanguage === 'en'
        ? `Quick Analysis ${formatDate(new Date())}`
        : `Быстрый анализ ${formatDate(new Date())}`

      const project = await createProject(projectName, currentLanguage === 'en' ? 'Analysis from landing' : 'Анализ с лендинга')
      console.log('✅ Проект создан:', project.id)

      // Загружаем скриншот если есть
      let screenshotUrl = null
      if (data.type === 'screenshot' && data.data) {
        screenshotUrl = await uploadScreenshotFromBase64(data.data, user.id)
        console.log('✅ Скриншот загружен:', screenshotUrl)
      }

      // Создаем аудит
      const auditName = currentLanguage === 'en'
        ? `Analysis ${formatDate(new Date())}`
        : `Анализ ${formatDate(new Date())}`

      const audit = await createAudit(
        project.id,
        auditName,
        'research',
        {
          url: data.type === 'url' ? data.data : undefined,
          hasScreenshot: data.type === 'screenshot',
          screenshotUrl: screenshotUrl,
          timestamp: new Date().toISOString()
        },
        undefined,
        currentLanguage
      )
      console.log('✅ Аудит создан:', audit.id)

      // Сохраняем данные анализа для страницы аудита
      localStorage.setItem('pendingAuditAnalysis', JSON.stringify({
        type: data.type,
        data: data.data,
        auditId: audit.id,
        autoStart: true
      }))

      // Очищаем pendingAnalysis
      localStorage.removeItem('pendingAnalysis')

      // Редирект на страницу аудита
      console.log('🔄 Редирект на /audit/' + audit.id)
      window.location.href = `/audit/${audit.id}`
    } catch (error) {
      console.error('❌ Ошибка обработки pendingAnalysis:', error)
      localStorage.removeItem('pendingAnalysis')
      setProcessingPending(false)
    }
  }

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
      <Projects user={user} />
    </SidebarDemo>
  )
}