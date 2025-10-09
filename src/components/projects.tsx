'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createProject, getUserProjects, getProjectAudits, getProjectAuditsForPreview, updateProject, deleteProject } from '@/lib/database'
import { User } from '@supabase/supabase-js'
import { Plus, FolderOpen, Calendar, BarChart3, Edit, Trash2, MoreVertical } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProjectCard } from '@/components/project-card'
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
  screenshots?: string[]
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const shouldOpenCreateForm = searchParams?.get('create') === '1'

  useEffect(() => {
    loadProjects()
  }, [])

  useEffect(() => {
    if (shouldOpenCreateForm) {
      setShowCreateForm(true)
    }
  }, [shouldOpenCreateForm])

  const updateCreateQuery = (value: '1' | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '')
    if (value) {
      params.set('create', value)
    } else {
      params.delete('create')
    }
    const queryString = params.toString()
    router.replace(queryString ? `/projects?${queryString}` : '/projects', { scroll: false })
  }

  const openCreateForm = () => {
    setShowCreateForm(true)
    if (!shouldOpenCreateForm) {
      updateCreateQuery('1')
    }
  }

  const closeCreateForm = () => {
    setShowCreateForm(false)
    setNewProject({ name: '', description: '', context: '' })
    updateCreateQuery(null)
  }

  const loadProjects = async () => {
    try {
      const userProjects = await getUserProjects()

      // Загружаем данные для каждого проекта параллельно (оптимизированный запрос)
      const projectsWithCounts = await Promise.all(
        userProjects.map(async (project) => {
          const { count, audits } = await getProjectAuditsForPreview(project.id)

          // Извлекаем скриншоты из аудитов (максимум 4)
          const screenshots: string[] = []
          for (const audit of audits) {
            if (screenshots.length >= 4) break

            const inputData = audit.input_data as { screenshot?: string; screenshotUrl?: string } | null
            const screenshotUrl = inputData?.screenshotUrl || inputData?.screenshot
            if (screenshotUrl) {
              screenshots.push(screenshotUrl)
            }
          }

          return {
            ...project,
            auditsCount: count,
            screenshots
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
      closeCreateForm()
      await loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
      const errorMessage = error instanceof Error ? error.message : 'unknown'
      alert(t('projects.errors.createError', { error: errorMessage }))
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
      alert(t('projects.errors.updateError'))
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
      alert(t('projects.errors.deleteError'))
    }
  }

  const formatProjectDate = (dateString: string) => {
    return formatDate(dateString)
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-40 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden h-[170px] bg-[#F5F5F5] animate-pulse">
              <div className="flex h-full gap-4 p-4">
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="h-6 w-3/4 bg-gray-300 rounded"></div>
                    <div className="h-4 w-full bg-gray-200 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                  </div>
                  <div className="flex gap-3">
                    <div className="h-4 w-24 bg-gray-300 rounded"></div>
                    <div className="h-4 w-20 bg-gray-300 rounded"></div>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className="grid grid-cols-2 gap-2">
                    {[1, 2, 3, 4].map((j) => (
                      <div key={j} className="w-[58px] h-[58px] bg-white rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
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
          onClick={openCreateForm}
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
            <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('projects.createProject.title')}</h3>
            <p className="text-slate-600">{t('projects.createProject.description')}</p>
          </div>
          
          <form onSubmit={handleCreateProject} className="space-y-6">
            <div>
              <label htmlFor="projectName" className="block text-sm font-medium text-slate-700 mb-2">
                {t('projects.createProject.nameLabel')}
              </label>
              <input
                id="projectName"
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder={t('projects.createProject.namePlaceholder')}
                required
              />
            </div>
            
            <div>
              <label htmlFor="projectDescription" className="block text-sm font-medium text-slate-700 mb-2">
                {t('projects.createProject.descriptionLabel')}
              </label>
              <textarea
                id="projectDescription"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={3}
                placeholder={t('projects.createProject.descriptionPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="projectContext" className="block text-sm font-medium text-slate-700 mb-2">
                {t('projects.createProject.contextLabel')}
              </label>
              <textarea
                id="projectContext"
                value={newProject.context}
                onChange={(e) => setNewProject({ ...newProject, context: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                rows={4}
                placeholder={t('projects.createProject.contextPlaceholder')}
              />
              <p className="text-sm text-slate-500 mt-1">
                {t('projects.createProject.contextNote')}
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
                {creating ? t('projects.createProject.loading') : t('projects.createProject.createButton')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateForm}
                className="px-6 py-3 rounded-lg font-medium border-2 border-gray-200 hover:border-gray-300"
              >
                {t('projects.createProject.cancel')}
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
            {t('projects.empty.title')}
          </h3>
          <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
            {t('projects.empty.description')}
          </p>
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 mx-auto bg-black hover:bg-gray-800 text-white px-8 py-4 rounded-lg font-medium text-lg"
          >
            <Plus className="w-5 h-5" />
            {t('projects.empty.createFirst')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              formatDate={formatProjectDate}
            />
          ))}
        </div>
      )}

      {/* Модалка редактирования проекта */}
      {editingProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">{t('projects.edit.title')}</h2>
            <form onSubmit={handleUpdateProject}>
              <div className="mb-6">
                <Label htmlFor="editName" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('projects.edit.nameLabel')}
                </Label>
                <Input
                  id="editName"
                  value={editName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                  placeholder={t('projects.edit.namePlaceholder')}
                  required
                />
              </div>
              <div className="mb-6">
                <Label htmlFor="editDescription" className="block text-sm font-medium text-slate-700 mb-2">
                  {t('projects.edit.descriptionLabel')}
                </Label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  rows={4}
                  placeholder={t('projects.edit.descriptionPlaceholder')}
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" className="flex-1">
                  {t('projects.edit.save')}
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
                  {t('projects.edit.cancel')}
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
            <AlertDialogTitle>{t('projects.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('projects.delete.description', { name: projectToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('projects.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              {t('projects.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
