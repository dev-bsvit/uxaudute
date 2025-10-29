'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { createProject, createAudit, uploadScreenshotFromBase64 } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'

export default function AuthCallback() {
  const router = useRouter()
  const { currentLanguage } = useTranslation()
  const { formatDate } = useFormatters()
  const [status, setStatus] = useState('Проверяем авторизацию...')
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    // Плавное появление
    setTimeout(() => setOpacity(1), 100)
    handleAuthCallback()
  }, [])

  const handleAuthCallback = async () => {
    try {
      // Проверяем пользователя
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Не авторизован - редирект на главную
        fadeOutAndRedirect('/')
        return
      }

      // Проверяем, прошел ли пользователь онбординг
      setStatus('Проверяем профиль...')
      const { data: onboarding } = await supabase
        .from('user_onboarding')
        .select('completed')
        .eq('user_id', user.id)
        .single()

      // Если пользователь новый (не прошел онбординг), редиректим на онбординг
      // Кредиты начислятся после завершения онбординга
      if (!onboarding || !onboarding.completed) {
        setStatus('Настройка профиля...')
        await new Promise(resolve => setTimeout(resolve, 500))
        fadeOutAndRedirect('/onboarding')
        return
      }

      // Если пользователь уже прошел онбординг, проверяем баланс
      setStatus('Проверяем баланс...')
      try {
        const response = await fetch('/api/ensure-user-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        if (response.ok) {
          console.log('✅ Баланс проверен/создан')
        }
      } catch (error) {
        console.error('Ошибка проверки баланса:', error)
      }

      // Проверяем pendingAnalysis
      const pendingAnalysis = localStorage.getItem('pendingAnalysis')

      if (!pendingAnalysis) {
        // Обычная авторизация - редирект на home
        setStatus('Перенаправляем...')
        await new Promise(resolve => setTimeout(resolve, 500))
        fadeOutAndRedirect('/home')
        return
      }

      // Есть pendingAnalysis - создаем аудит
      setStatus('Создаем проект...')
      const data = JSON.parse(pendingAnalysis)

      const projectName = currentLanguage === 'en'
        ? `Quick Analysis ${formatDate(new Date())}`
        : `Быстрый анализ ${formatDate(new Date())}`

      const project = await createProject(
        projectName,
        currentLanguage === 'en' ? 'Analysis from landing' : 'Анализ с лендинга'
      )

      setStatus('Загружаем данные...')

      // Загружаем скриншот если есть
      let screenshotUrl = null
      if (data.type === 'screenshot' && data.data) {
        screenshotUrl = await uploadScreenshotFromBase64(data.data, user.id)
      }

      setStatus('Создаем анализ...')

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

      // Сохраняем для автозапуска с привязкой к пользователю
      localStorage.setItem('pendingAuditAnalysis', JSON.stringify({
        type: data.type,
        data: data.data,
        auditId: audit.id,
        userId: user.id, // Добавляем ID пользователя для безопасности
        autoStart: true
      }))

      // Очищаем pendingAnalysis
      localStorage.removeItem('pendingAnalysis')

      setStatus('Запускаем анализ...')
      await new Promise(resolve => setTimeout(resolve, 300))

      // Редирект на аудит
      fadeOutAndRedirect(`/audit/${audit.id}`)

    } catch (error) {
      console.error('Ошибка в auth callback:', error)
      setStatus('Произошла ошибка...')
      await new Promise(resolve => setTimeout(resolve, 1000))
      fadeOutAndRedirect('/home')
    }
  }

  const fadeOutAndRedirect = (url: string) => {
    setOpacity(0)
    setTimeout(() => {
      router.push(url)
    }, 300)
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center"
      style={{
        opacity,
        transition: 'opacity 300ms ease-in-out'
      }}
    >
      <div className="text-center max-w-md px-6">
        <div className="relative w-24 h-24 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          {status}
        </h2>

        <p className="text-slate-600">
          Пожалуйста, подождите
        </p>
      </div>
    </div>
  )
}
