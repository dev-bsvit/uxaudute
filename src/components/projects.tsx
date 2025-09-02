'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProject, getUserProjects, getProjectAudits } from '@/lib/database'
import { User } from '@supabase/supabase-js'
import { Plus, FolderOpen, Calendar, BarChart3 } from 'lucide-react'
import Link from 'next/link'

interface ProjectsProps {
  user: User
  onProjectSelect?: (projectId: string) => void
}

interface Project {
  id: string
  name: string
  description: string | null
  created_at: string
  auditsCount?: number
}

export function Projects({ user, onProjectSelect }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const userProjects = await getUserProjects()
      
      // Загружаем количество аудитов для каждого проекта
      const projectsWithCounts = await Promise.all(
        userProjects.map(async (project) => {
          const audits = await getProjectAudits(project.id)
          return {
            ...project,
            auditsCount: audits.length
          }
        })
      )
      
      setProjects(projectsWithCounts)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProject.name.trim()) return

    setCreating(true)
    try {
      await createProject(newProject.name, newProject.description || undefined)
      setNewProject({ name: '', description: '' })
      setShowCreateForm(false)
      await loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Ошибка при создании проекта')
    } finally {
      setCreating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Мои проекты</h2>
          <p className="text-slate-600">Управляйте своими UX исследованиями</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Новый проект
        </Button>
      </div>

      {/* Форма создания проекта */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Создать новый проект</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-1">
                  Название проекта
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProject.name}
                  onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Например: Редизайн интернет-магазина"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-1">
                  Описание (опционально)
                </label>
                <textarea
                  id="projectDescription"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Краткое описание целей проекта"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2"
                >
                  {creating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Создать
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setNewProject({ name: '', description: '' })
                  }}
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Список проектов */}
      {projects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              У вас пока нет проектов
            </h3>
            <p className="text-slate-600 mb-4">
              Создайте первый проект, чтобы начать UX исследования
            </p>
            <Button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Создать проект
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href={`/projects/${project.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                        {project.name}
                      </CardTitle>
                      {project.description && (
                        <p className="text-sm text-slate-600 line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                    <FolderOpen className="w-5 h-5 text-blue-500 flex-shrink-0 ml-2" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <BarChart3 className="w-4 h-4" />
                      <span>{project.auditsCount || 0} аудитов</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
