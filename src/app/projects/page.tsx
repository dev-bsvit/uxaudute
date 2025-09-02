'use client'

import { Layout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FolderOpen } from 'lucide-react'
import { TEXTS } from '@/lib/utils'
import Link from 'next/link'

// Mock data
const projects = [
  {
    id: '1',
    name: 'Интернет-магазин электроники',
    description: 'Анализ UX главной страницы и каталога',
    auditsCount: 3,
    createdAt: '2024-01-15',
  },
  {
    id: '2', 
    name: 'Корпоративный сайт',
    description: 'Исследование формы обратной связи',
    auditsCount: 1,
    createdAt: '2024-01-10',
  }
]

export default function ProjectsPage() {
  return (
    <Layout title="Мои проекты">
      <div className="space-y-6">
        {/* Заголовок и кнопка создания */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Проекты
          </h2>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Новый проект
          </Button>
        </div>

        {/* Список проектов */}
        {projects.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                      <span className="text-xs text-gray-500">
                        {project.auditsCount} аудита
                      </span>
                    </div>
                    <CardTitle className="text-lg">
                      {project.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-3">
                      {project.description}
                    </p>
                    <p className="text-xs text-gray-400">
                      Создан: {new Date(project.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {TEXTS.emptyState}
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Создать проект
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}
