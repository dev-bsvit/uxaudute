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
      <SidebarDemo user={null}>
        <div className="space-y-8">
          <div className="px-8 flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-96 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="px-8">
            <div className="h-16 w-full bg-gray-100 rounded-lg animate-pulse mb-6"></div>
            <div className="bg-white rounded-2xl p-6 animate-pulse space-y-4">
              <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
              <div className="h-4 w-3/4 bg-gray-100 rounded"></div>
              <div className="h-4 w-2/3 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </SidebarDemo>
    )
  }

  if (!user || !survey) return null

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        <div className="px-8">
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
        <div className="px-8 space-y-8">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'create' | 'share' | 'results')}
          className="w-full"
        >
          {/* Tab List with Figma styling */}
          <div>
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
      </div>
    </SidebarDemo>
  )
}
