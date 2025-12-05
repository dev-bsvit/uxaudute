'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Eye, Search, Filter, ArrowUpDown } from 'lucide-react'

interface AuditWithUser {
  id: string
  project_name: string
  status: string
  created_at: string
  updated_at: string
  allow_blog_publication: boolean
  user: {
    id: string
    email: string
    full_name: string | null
  }
  input_data: any
}

export default function AdminAuditsPage() {
  const router = useRouter()
  const [audits, setAudits] = useState<AuditWithUser[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'date' | 'user' | 'status'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadAllAudits()
  }, [])

  const loadAllAudits = async () => {
    try {
      const response = await fetch('/api/admin/audits')
      const data = await response.json()

      if (data.success) {
        setAudits(data.data)
      } else {
        console.error('Error loading audits:', data.error)
      }
    } catch (error) {
      console.error('Error loading audits:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'В очереди', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Обработка', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Завершен', className: 'bg-green-100 text-green-800' },
      failed: { label: 'Ошибка', className: 'bg-red-100 text-red-800' },
    }

    const config = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

    return (
      <Badge variant="secondary" className={`${config.className} border-0`}>
        {config.label}
      </Badge>
    )
  }

  // Фильтрация и сортировка
  const filteredAndSortedAudits = audits
    .filter(audit => {
      const matchesSearch =
        audit.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        audit.user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === 'all' || audit.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      let comparison = 0

      switch (sortBy) {
        case 'date':
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case 'user':
          comparison = (a.user.email || '').localeCompare(b.user.email || '')
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  const toggleSort = (field: 'date' | 'user' | 'status') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 w-64 bg-gray-200 rounded"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Все аудиты пользователей
            </h1>
            <p className="text-gray-600">
              Всего аудитов: {audits.length}
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Поиск по проекту, email, имени..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Status filter */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                >
                  <option value="all">Все статусы</option>
                  <option value="pending">В очереди</option>
                  <option value="processing">Обработка</option>
                  <option value="completed">Завершен</option>
                  <option value="failed">Ошибка</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'date' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSort('date')}
                  className="flex-1"
                >
                  Дата
                  {sortBy === 'date' && (
                    <ArrowUpDown className="ml-2 w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant={sortBy === 'user' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSort('user')}
                  className="flex-1"
                >
                  Пользователь
                  {sortBy === 'user' && (
                    <ArrowUpDown className="ml-2 w-3 h-3" />
                  )}
                </Button>
                <Button
                  variant={sortBy === 'status' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleSort('status')}
                  className="flex-1"
                >
                  Статус
                  {sortBy === 'status' && (
                    <ArrowUpDown className="ml-2 w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Results count */}
          {searchTerm || statusFilter !== 'all' ? (
            <div className="mb-4 text-sm text-gray-600">
              Найдено: {filteredAndSortedAudits.length} из {audits.length}
            </div>
          ) : null}

          {/* Audits list */}
          <div className="space-y-4">
            {filteredAndSortedAudits.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Аудиты не найдены</p>
              </div>
            ) : (
              filteredAndSortedAudits.map((audit) => (
                <div
                  key={audit.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {audit.project_name || 'Без названия'}
                        </h3>
                        {getStatusBadge(audit.status)}
                        {audit.allow_blog_publication && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-0">
                            Разрешена публикация
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>
                            {audit.user.full_name || audit.user.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(audit.created_at)}</span>
                        </div>
                      </div>

                      {audit.input_data?.url && (
                        <div className="mt-2 text-sm text-blue-600">
                          {audit.input_data.url}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/projects/${audit.id}`)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Просмотр
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}
