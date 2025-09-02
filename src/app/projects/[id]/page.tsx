'use client'

import { Layout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// Mock data
const project = {
  id: '1',
  name: 'Интернет-магазин электроники',
  description: 'Комплексный UX анализ интернет-магазина электроники',
  createdAt: '2024-01-15',
}

const audits = [
  {
    id: '1',
    name: 'Главная страница',
    type: 'Начать исследование',
    status: 'completed',
    createdAt: '2024-01-15T10:00:00',
    confidence: 85,
  },
  {
    id: '2',
    name: 'Каталог товаров',
    type: 'Бизнес-аналитика',
    status: 'completed',
    createdAt: '2024-01-16T14:30:00',
    confidence: 78,
  },
  {
    id: '3',
    name: 'Корзина покупок',
    type: 'A/B тест',
    status: 'in_progress',
    createdAt: '2024-01-17T09:15:00',
    confidence: null,
  }
]

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'bg-green-100 text-green-800'
    case 'in_progress': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'completed': return 'Завершен'
    case 'in_progress': return 'В процессе'
    default: return 'Черновик'
  }
}

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id

  return (
    <Layout title={project.name}>
      <div className="space-y-6">
        {/* Информация о проекте */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {project.name}
                </CardTitle>
                <p className="text-gray-600 mt-2">
                  {project.description}
                </p>
              </div>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новый аудит
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
              </div>
              <div className="flex items-center">
                <FileText className="w-4 h-4 mr-1" />
                Аудитов: {audits.length}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Список аудитов */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Аудиты</h3>
          
          {audits.map((audit) => (
            <Link key={audit.id} href={`/audits/${audit.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <FileText className="w-5 h-5 text-blue-500" />
                        <h4 className="font-medium text-gray-900">
                          {audit.name}
                        </h4>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(audit.status)}`}>
                          {getStatusText(audit.status)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Тип анализа: {audit.type}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>
                          {new Date(audit.createdAt).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {audit.confidence && (
                          <div className="flex items-center">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Уверенность: {audit.confidence}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </Layout>
  )
}
