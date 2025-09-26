'use client'

import { useState, useEffect } from 'react'
import { Layout } from '@/components/layout'
import { ActionPanel } from '@/components/action-panel'
import { AnalysisResult } from '@/components/analysis-result'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Share } from 'lucide-react'
import { BackArrow } from '@/components/icons/back-arrow'
import { type ActionType } from '@/lib/utils'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import { safeAdaptAnalysisData } from '@/lib/analysis-data-adapter'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getAudit } from '@/lib/database'

interface AuditData {
  id: string
  name: string
  project_id: string
  type: string
  status: string
  created_at: string
  result_data?: {
    analysis_result?: string | StructuredAnalysisResponse
    screenshot_url?: string
  } | StructuredAnalysisResponse | any
  input_data?: Record<string, unknown> | null
  confidence?: number | null
}

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const auditId = params.id as string
  const [activeTab, setActiveTab] = useState<'result' | 'collected' | 'expert'>('result')
  const [auditData, setAuditData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAuditData()
  }, [auditId])

  const loadAuditData = async () => {
    try {
      setLoading(true)
      const audit = await getAudit(auditId)
      
      if (!audit) {
        setError('Аудит не найден')
        return
      }

      console.log('Аудит загружен:', audit)
      console.log('✅ Результат найден в audits:', audit.result_data)
      console.log('Отображаем результат аудита:', audit.result_data)
      console.log('Ключи result_data:', Object.keys(audit.result_data || {}))
      console.log('analysis_result:', audit.result_data?.analysis_result)
      console.log('Весь result_data:', JSON.stringify(audit.result_data))

      // Обрабатываем результат - он может быть в разных форматах
      let analysisResult: string | StructuredAnalysisResponse | undefined
      
      console.log('🔍 AUDIT PAGE: Обрабатываем результат...')
      console.log('🔍 AUDIT PAGE: result_data type:', typeof audit.result_data)
      console.log('🔍 AUDIT PAGE: result_data keys:', Object.keys(audit.result_data || {}))
      
      if (audit.result_data?.analysis_result) {
        console.log('✅ AUDIT PAGE: Найден analysis_result в result_data')
        analysisResult = audit.result_data.analysis_result as string | StructuredAnalysisResponse
      } else if (audit.result_data?.content) {
        console.log('✅ AUDIT PAGE: Найден content в result_data')
        // Результат может быть в поле content
        analysisResult = audit.result_data.content as string
      } else if (audit.result_data && (audit.result_data.screenDescription || audit.result_data.uxSurvey || audit.result_data.audience)) {
        console.log('✅ AUDIT PAGE: result_data содержит структурированные данные напрямую')
        // В новой системе данные лежат прямо в result_data
        analysisResult = audit.result_data as any
      } else if (audit.result_data) {
        console.log('✅ AUDIT PAGE: Используем весь result_data как результат')
        // Весь result_data может быть результатом
        analysisResult = audit.result_data as any
      } else {
        console.log('❌ AUDIT PAGE: Результат не найден')
      }

      console.log('🔍 AUDIT PAGE: Финальный analysisResult:', analysisResult)
      console.log('🔍 AUDIT PAGE: Тип analysisResult:', typeof analysisResult)
      
      // Адаптируем данные к новому формату
      console.log('🔄 AUDIT PAGE: Attempting to adapt data format...')
      const adaptedResult = safeAdaptAnalysisData(analysisResult || audit.result_data)
      
      if (adaptedResult) {
        console.log('✅ AUDIT PAGE: Data successfully adapted:', Object.keys(adaptedResult))
        setAuditData({
          ...audit,
          result_data: {
            ...audit.result_data,
            analysis_result: adaptedResult
          }
        })
      } else {
        console.log('⚠️ AUDIT PAGE: Could not adapt data, using original format')
        setAuditData({
          ...audit,
          result_data: {
            ...audit.result_data,
            analysis_result: analysisResult || audit.result_data
          }
        })
      }
    } catch (err) {
      console.error('Error loading audit:', err)
      setError('Ошибка загрузки аудита')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (action: ActionType) => {
    console.log('Action:', action)
    // TODO: Implement action handlers
  }

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export audit')
  }

  const handleShare = () => {
    // TODO: Implement share functionality  
    console.log('Share audit')
  }

  if (loading) {
    return (
      <Layout title="Загрузка...">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      </Layout>
    )
  }

  if (error || !auditData) {
    return (
      <Layout title="Ошибка">
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center py-12 bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {error || 'Аудит не найден'}
            </h2>
            <BackArrow onClick={() => router.push('/projects')} />
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout title={`Аудит: ${auditData.name}`}>
      <div className="space-y-6">
        {/* Навигация назад и действия */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {auditData.name}
              </h1>
              <p className="text-gray-600">
                {auditData.type} • {new Date(auditData.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share className="w-4 h-4 mr-2" />
              Поделиться
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
          </div>
        </div>

        {/* Табы */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'result', label: 'Результат анализа' },
              { id: 'collected', label: 'Собранные данные' },
              { id: 'expert', label: 'Экспертные заключения' }
            ].map((tab) => (
                          <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Контент табов */}
        <div className="space-y-6">
          {activeTab === 'result' && (
            <div>
              {auditData.result_data?.analysis_result ? (
                <AnalysisResult 
                  result={auditData.result_data.analysis_result}
                  screenshot={auditData.result_data.screenshot_url || (auditData.input_data as any)?.screenshotUrl}
                  url={(auditData.input_data as any)?.url}
                  auditId={auditId}
                />
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <p className="text-gray-500">Результат анализа не найден</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'collected' && (
            <Card>
              <CardHeader>
                <CardTitle>Собранные данные</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Здесь будут отображаться все предыдущие ответы ассистента, 
                  собранные в единый документ при использовании функции &quot;Собрать в один&quot;.
                </p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'expert' && (
            <Card>
              <CardHeader>
                <CardTitle>Экспертные заключения</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Результаты бизнес-аналитики, A/B тестов и созданных гипотез 
                  будут отображаться в этом разделе.
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Панель действий */}
        <ActionPanel onAction={handleAction} />
      </div>
    </Layout>
  )
}
