'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProject, getUserProjects, getProjectAudits, updateProject, deleteProject } from '@/lib/database'
import { User } from '@supabase/supabase-js'
import { Plus, FolderOpen, Calendar, BarChart3, Edit, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'

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
  const { t } = useTranslation()
  const { formatDate } = useFormatters()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newProject, setNewProject] = useState({ name: '', description: '', context: '' })
  const [creating, setCreating] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | null>(null)
  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null)

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
      await createProject(
        newProject.name, 
        newProject.description || undefined,
        newProject.context || undefined
      )
      setNewProject({ name: '', description: '', context: '' })
      setShowCreateForm(false)
      await loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при создании проекта: ${errorMessage}`)
    } finally {
      setCreating(false)
    }
  }

  const handleEditProject = (project: Project) => {
    setEditingProject(project)
    setEditName(project.name)
    setEditDescription(project.description || '')
  }

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProject || !editName.trim()) return

    try {
      await updateProject(editingProject.id, {
        name: editName,
        description: editDescription || undefined
      })
      setEditingProject(null)
      setEditName('')
      setEditDescription('')
      await loadProjects()
    } catch (error) {
      console.error('Error updating project:', error)
      alert('Ошибка при обновлении проекта')
    }
  }

  const handleDeleteClick = (project: Project) => {
    setProjectToDelete(project)
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return

    try {
      await deleteProject(projectToDelete.id)
      setShowDeleteDialog(false)
      setProjectToDelete(null)
      await loadProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Ошибка при удалении проекта')
    }
  }

  const formatProjectDate = (dateString: string) => {
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('projects.management.title')}</h2>
          <p className="text-slate-600">{t('projects.management.description')}</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium"
        >
          <Plus className="w-4 h-4" />
          {t('projects.newProject')}
        </Button>
      </div>

      {/* Форма создания проекта */}
      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
          <div className="mb-6">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Создать новый проект</h3>
            <p className="text-slate-600">Заполните информацию о вашем новом UX проекте</p>
          </div>
          
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">
                Название проекта
              </label>
              <input
                id="projectName"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="Например: Редизайн интернет-магазина"
                required
              />
            </div>
            
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-2">
                Описание (опционально)
              </label>
              <textarea
                id="projectDescription"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={3}
                placeholder="Краткое описание целей проекта"
              />
            </div>

            <div>
              <label htmlFor="projectContext" className="block text-sm font-medium text-slate-700 mb-2">
                Контекст проекта (опционально)
              </label>
              <textarea
                id="projectContext"
                value={newProject.context}
                onChange={(e) => setNewProject({ ...newProject, context: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={4}
                placeholder="Например: Мобильное приложение для заказа еды. Основная аудитория - молодые люди 18-35 лет. Ключевые цели: быстрое оформление заказа, удобная навигация по меню, прозрачная система оплаты..."
              />
              <p className="text-sm text-slate-500 mt-1">
                Этот контекст будет применяться ко всем аудитам в проекте
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-medium"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Создать проект
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false)
                  setNewProject({ name: '', description: '', context: '' })
                }}
                className="px-6 py-3 rounded-lg font-medium border-2 border-gray-200 hover:border-gray-300"
              >
                Отмена
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Список проектов */}
      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-3">
            У вас пока нет проектов
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            Создайте первый проект, чтобы начать UX исследования и анализ интерфейсов
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 mx-auto bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-medium text-lg"
          >
            <Plus className="w-5 h-5" />
            Создать первый проект
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link href={`/projects/${project.id}`} className="block">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {project.name}
                      </h3>
                      {project.description && (
                        <p className="text-slate-600 line-clamp-2 leading-relaxed">
                          {project.description}
                        </p>
                      )}
                    </Link>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-blue-500" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditProject(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Переименовать
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteClick(project)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Удалить
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <Link href={`/projects/${project.id}`}>
                  <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span className="font-medium">{project.auditsCount || 0} аудитов</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(project.created_at)}</span>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модалка редактирования проекта */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Редактировать проект</h2>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-6">
                <Label htmlFor="editName" className="block text-sm font-medium text-slate-700 mb-2">
                  Название проекта
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                  placeholder="Введите название проекта"
                  required
                />
              </div>
              <div className="mb-6">
                <Label htmlFor="editDescription" className="block text-sm font-medium text-slate-700 mb-2">
                  Описание (опционально)
                </Label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={4}
                  placeholder="Краткое описание целей проекта"
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  Сохранить
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingProject(null)
                    setEditName('')
                    setEditDescription('')
                  }}
                  className="flex-1"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Диалог удаления проекта */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить проект?</AlertDialogTitle>
            <AlertDialogDescription>
              Вы уверены, что хотите удалить проект "{projectToDelete?.name}"? 
              Это действие нельзя отменить. Все аудиты в этом проекте также будут удалены.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
