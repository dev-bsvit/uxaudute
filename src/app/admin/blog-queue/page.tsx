'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAuditsForBlog } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { FileText, Sparkles, Eye, Calendar } from 'lucide-react'
import { PageHeader } from '@/components/page-header'

interface AuditWithRelations {
  id: string
  name: string
  created_at: string
  input_data: any
  result_data: any
  project: {
    name: string
  }
  user: {
    full_name: string
    email: string
  }
}

export default function BlogQueuePage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [audits, setAudits] = useState<AuditWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState<string | null>(null)

  useEffect(() => {
    checkAuthAndLoadData()
  }, [])

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/projects')
        return
      }

      setUser(user)
      await loadAudits()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAudits = async () => {
    try {
      const data = await getAuditsForBlog()
      setAudits(data as any)
    } catch (error) {
      console.error('Error loading audits:', error)
      alert('Ошибка загрузки аудитов')
    }
  }

  const handleGenerateArticle = async (auditId: string) => {
    setGenerating(auditId)
    try {
      // TODO: Вызов API для генерации статьи
      alert('Генерация статьи будет реализована в следующем этапе')
    } catch (error) {
      console.error('Error generating article:', error)
      alert('Ошибка при генерации статьи')
    } finally {
      setGenerating(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <SidebarDemo user={null}>
        <div className="space-y-6">
          <div className="px-8 flex items-center justify-between">
            <div>
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-96 bg-gray-100 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
      </SidebarDemo>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-6">
        {/* Header */}
        <div className="px-8">
          <PageHeader
            breadcrumbs={[
              { label: 'Админ-панель', href: '/admin' },
              { label: 'Очередь блога' }
            ]}
            title="Очередь блога"
            subtitle={`${audits.length} аудитов с согласием на публикацию`}
            showBackButton={true}
            onBack={() => router.push('/admin')}
          />
        </div>

        <div className="px-8">
          {/* Empty state */}
          {audits.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="w-12 h-12 text-slate-400 mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Нет аудитов для публикации
                </h3>
                <p className="text-sm text-slate-600 text-center max-w-md">
                  Здесь будут отображаться завершённые аудиты, для которых пользователи дали согласие на публикацию в блоге
                </p>
              </CardContent>
            </Card>
          ) : (
            /* Таблица аудитов */
            <div className="w-full">
              {/* Заголовки таблицы */}
              <div className="grid grid-cols-[auto_200px_150px_150px_200px] gap-4 px-4 py-3 text-sm font-medium text-slate-500">
                <div>Аудит</div>
                <div>Проект</div>
                <div>Пользователь</div>
                <div>Дата создания</div>
                <div>Действия</div>
              </div>

              {/* Строки таблицы */}
              <div className="space-y-0">
                {audits.map((audit, index) => (
                  <div key={audit.id}>
                    <div className="grid grid-cols-[auto_200px_150px_150px_200px] gap-4 px-4 py-4 items-center bg-white hover:bg-slate-50 transition-colors rounded-lg">
                      {/* Превью + Название */}
                      <div className="flex items-center gap-4">
                        <div className="w-[80px] h-[60px] bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                          {audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url ? (
                            <img
                              src={audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url}
                              alt={audit.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Eye className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{audit.name}</h3>
                          <Badge variant="secondary" className="mt-1">
                            <FileText className="w-3 h-3 mr-1" />
                            Готов к публикации
                          </Badge>
                        </div>
                      </div>

                      {/* Проект */}
                      <div className="text-sm text-slate-600 truncate">
                        {audit.project?.name || 'Без проекта'}
                      </div>

                      {/* Пользователь */}
                      <div className="text-sm text-slate-600 truncate">
                        {audit.user?.full_name || audit.user?.email || 'Аноним'}
                      </div>

                      {/* Дата */}
                      <div className="text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(audit.created_at)}
                        </div>
                      </div>

                      {/* Действия */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => router.push(`/audit/${audit.id}`)}
                          variant="outline"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Просмотр
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleGenerateArticle(audit.id)}
                          disabled={generating === audit.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {generating === audit.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          Генерировать
                        </Button>
                      </div>
                    </div>

                    {/* Separator */}
                    {index < audits.length - 1 && (
                      <div className="h-[1px] bg-[#EEF2FA]"></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidebarDemo>
  )
}
