'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { PageHeader } from '@/components/page-header'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { getSurvey } from '@/lib/database'
import { useTranslation } from '@/hooks/use-translation'
import { User } from '@supabase/supabase-js'
import type { Survey } from '@/types/survey'
import { CreateTab } from '@/components/survey-tabs/create-tab'
import { ShareTab } from '@/components/survey-tabs/share-tab'
import { ResultsTab } from '@/components/survey-tabs/results-tab'

export default function SurveyEditorPage() {
  const router = useRouter()
  const params = useParams()
  const surveyId = params.id as string
  const { t, currentLanguage } = useTranslation()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [survey, setSurvey] = useState<Survey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'create' | 'share' | 'results'>('create')

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user && surveyId) {
      loadSurvey()
    }
  }, [user, surveyId])

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/projects')
        return
      }
      setUser(user)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/projects')
    } finally {
      setLoading(false)
    }
  }

  const loadSurvey = async () => {
    try {
      const surveyData = await getSurvey(surveyId)
      setSurvey(surveyData)
    } catch (error) {
      console.error('Error loading survey:', error)
      setError('Не удалось загрузить опрос')
    }
  }

  const handleSurveyUpdate = () => {
    loadSurvey()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (!user || !survey) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Главная', href: '/home' },
              { label: 'Опросы', href: '/surveys' },
              { label: survey.name }
            ]}
            title={survey.name}
            subtitle={
              survey.status === 'draft'
                ? 'Настройте опрос и опубликуйте его'
                : survey.status === 'published'
                ? 'Опрос опубликован и доступен для прохождения'
                : 'Опрос закрыт'
            }
            showBackButton={true}
            onBack={() => router.push(`/projects/${survey.project_id}`)}
          />
        </div>

        <div className="px-8">
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as 'create' | 'share' | 'results')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 h-16 relative z-10 p-1">
              <TabsTrigger
                value="create"
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {currentLanguage === 'en' ? 'Create' : 'Создание'}
              </TabsTrigger>
              <TabsTrigger
                value="share"
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                {currentLanguage === 'en' ? 'Share' : 'Поделиться'}
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="h-14 text-sm font-medium data-[state=active]:bg-white data-[state=active]:shadow-sm"
                disabled={survey.status === 'draft'}
              >
                {currentLanguage === 'en' ? 'Results' : 'Результаты'}
              </TabsTrigger>
            </TabsList>

            {/* Create Tab */}
            <TabsContent value="create">
              <CreateTab
                survey={survey}
                onUpdate={handleSurveyUpdate}
                currentLanguage={currentLanguage as 'ru' | 'en'}
              />
            </TabsContent>

            {/* Share Tab */}
            <TabsContent value="share">
              <ShareTab survey={survey} currentLanguage={currentLanguage as 'ru' | 'en'} />
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results">
              <ResultsTab survey={survey} currentLanguage={currentLanguage as 'ru' | 'en'} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SidebarDemo>
  )
}
