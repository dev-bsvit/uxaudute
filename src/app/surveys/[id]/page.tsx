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
      <div className="space-y-6">
        <div className="px-4">
          <PageHeader
            breadcrumbs={[
              { label: 'Мои проекты', href: '/projects' },
              { label: survey.name }
            ]}
            title={survey.name}
            subtitle={
              survey.status === 'draft'
                ? 'Буду проверять сам себя'
                : survey.status === 'published'
                ? 'Опрос опубликован и доступен для прохождения'
                : 'Опрос закрыт'
            }
            showBackButton={true}
            onBack={() => router.push(`/projects/${survey.project_id}`)}
          />
        </div>

        {/* Tabs - Positioned as per Figma spec */}
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'create' | 'share' | 'results')}
          className="w-full"
        >
          {/* Tab List with Figma styling */}
          <div className="px-4">
            <TabsList className="grid grid-cols-3 gap-0 mb-6 bg-[#F0F1F4] h-[61px] rounded-2xl p-1 w-full">
              <TabsTrigger
                value="create"
                className="h-[53px] text-base font-medium leading-[17.6px] tracking-[-0.16px] text-[#1F1F1F] data-[state=active]:bg-white data-[state=active]:shadow-[0_4px_4px_rgba(0,0,0,0.05)] data-[state=active]:rounded-[14px]"
              >
                {currentLanguage === 'en' ? 'Create' : 'Создание'}
              </TabsTrigger>
              <TabsTrigger
                value="share"
                className="h-[53px] text-base font-medium leading-[17.6px] tracking-[-0.16px] text-[#1F1F1F] data-[state=active]:bg-white data-[state=active]:shadow-[0_4px_4px_rgba(0,0,0,0.05)] data-[state=active]:rounded-[14px]"
              >
                {currentLanguage === 'en' ? 'Share' : 'Поделиться'}
              </TabsTrigger>
              <TabsTrigger
                value="results"
                className="h-[53px] text-base font-medium leading-[17.6px] tracking-[-0.16px] text-[#121217] data-[state=active]:bg-white data-[state=active]:shadow-[0_4px_4px_rgba(0,0,0,0.05)] data-[state=active]:rounded-[14px] disabled:opacity-50"
                disabled={survey.status === 'draft'}
              >
                {currentLanguage === 'en' ? 'Results' : 'Результаты'}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Create Tab */}
          <TabsContent value="create" className="mt-0">
            <CreateTab
              survey={survey}
              onUpdate={handleSurveyUpdate}
              currentLanguage={currentLanguage as 'ru' | 'en'}
            />
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="mt-0">
            <ShareTab survey={survey} currentLanguage={currentLanguage as 'ru' | 'en'} />
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="mt-0">
            <ResultsTab survey={survey} currentLanguage={currentLanguage as 'ru' | 'en'} />
          </TabsContent>
        </Tabs>
      </div>
    </SidebarDemo>
  )
}
