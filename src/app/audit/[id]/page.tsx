'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { AnalysisResult } from '@/components/analysis-result'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Download, Share2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import Link from 'next/link'

interface Audit {
  id: string
  name: string
  type: string
  status: string
  input_data: any
  result_data: any
  created_at: string
  updated_at: string
  project_id: string
  projects?: {
    id: string
    name: string
  }
}

export default function AuditPage() {
  const params = useParams()
  const auditId = params.id as string
  
  const [user, setUser] = useState<User | null>(null)
  const [audit, setAudit] = useState<Audit | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем текущего пользователя
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
    })

    // Слушаем изменения аутентификации
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (auditId && user) {
      loadAudit()
    }
  }, [auditId, user])

  const loadAudit = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('Загружаем аудит с ID:', auditId)
      
      const { data: auditData, error: auditError } = await supabase
        .from('audits')
        .select(`
          *,
          projects!inner(id, name)
        `)
        .eq('id', auditId)
        .single()

      if (auditError) {
        console.error('Ошибка загрузки аудита:', auditError)
        setError('Аудит не найден')
        return
      }

      console.log('Аудит загружен:', auditData)
      setAudit(auditData)

      // Если результат не загружен, пробуем загрузить из analysis_results
      if (!auditData.result_data) {
        console.log('Результат не найден в audits, ищем в analysis_results')
        
        const { data: analysisData, error: analysisError } = await supabase
          .from('analysis_results')
          .select('*')
          .eq('audit_id', auditId)
          .eq('result_type', 'ux_analysis')
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        console.log('Поиск в analysis_results:', { analysisData, analysisError })

        if (!analysisError && analysisData) {
          console.log('Найден результат в analysis_results:', analysisData)
          
          // Обновляем аудит с результатом из analysis_results
          const updatedAudit = {
            ...auditData,
            result_data: analysisData.result_data
          }
          setAudit(updatedAudit)
          
          // Обновляем аудит в базе данных
          const { error: updateError } = await supabase
            .from('audits')
            .update({
              result_data: analysisData.result_data,
              status: 'completed'
            })
            .eq('id', auditId)
            
          if (updateError) {
            console.error('Ошибка обновления audits:', updateError)
          } else {
            console.log('Аудит обновлен с результатом')
          }
        } else {
          console.log('Результат не найден в analysis_results')
        }
      } else {
        console.log('Результат найден в audits:', auditData.result_data)
      }
    } catch (err) {
      console.error('Ошибка загрузки аудита:', err)
      setError('Ошибка загрузки аудита')
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = () => {
    loadAudit()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">
            Аудит не найден
          </h2>
          <p className="text-slate-600 mb-6">
            {error || 'Аудит с указанным ID не существует'}
          </p>
          <Link href="/dashboard">
            <Button className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Вернуться к Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-8">
        {/* Навигация */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={audit?.project_id ? `/projects/${audit.project_id}` : '/dashboard'}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Назад к проекту
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{audit.name}</h1>
              <p className="text-sm text-slate-600">
                Создан: {new Date(audit.created_at).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Обновить
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Скачать отчет
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              Поделиться
            </Button>
          </div>
        </div>

        {/* Информация об аудите */}
        <Card>
          <CardHeader>
            <CardTitle>Информация об аудите</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-600">Тип аудита</label>
                <p className="text-slate-900">{audit.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Статус</label>
                <p className="text-slate-900">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    audit.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {audit.status === 'completed' ? 'Завершен' : 'В процессе'}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Результаты анализа */}
        {audit.result_data ? (
          <AnalysisResult 
            result={audit.result_data}
            screenshot={audit.input_data?.screenshotUrl}
            url={audit.input_data?.url}
            auditId={audit.id}
          />
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Анализ в процессе
              </h3>
              <p className="text-slate-600 mb-4">
                Результаты анализа будут доступны через несколько минут
              </p>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Обновить
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarDemo>
  )
}
