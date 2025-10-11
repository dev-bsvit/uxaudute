'use client'

import { useRouter } from 'next/navigation'
import type { KeyboardEvent, MouseEvent } from 'react'
import { BarChart3, Edit, MoreVertical, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

interface ProjectSummary {
  id: string
  name: string
  description: string | null
  created_at: string
  auditsCount?: number
  screenshots?: string[]
}

interface ProjectCardProps {
  project: ProjectSummary
  formatDate: (dateString: string) => string
  onEdit?: (project: ProjectSummary) => void
  onDelete?: (project: ProjectSummary) => void
  menuLabels?: {
    edit?: string
    delete?: string
  }
}

export function ProjectCard({
  project,
  formatDate,
  onEdit,
  onDelete,
  menuLabels
}: ProjectCardProps) {
  // Создаём массив из 4 элементов для сетки
  const screenshotSlots = Array.from({ length: 4 }, (_, i) =>
    project.screenshots?.[i] || null
  )

  const hasMenuActions = Boolean(onEdit || onDelete)
  const editLabel = menuLabels?.edit || 'Edit'
  const deleteLabel = menuLabels?.delete || 'Delete'
  const triggerLabel = menuLabels?.edit || menuLabels?.delete || 'Actions'
  const router = useRouter()

  const handleNavigate = () => {
    router.push(`/projects/${project.id}`)
  }

  const handleCardClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement
    if (target.closest('[data-card-interactive="true"]')) {
      return
    }
    handleNavigate()
  }

  const handleCardKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleNavigate()
    }
  }

  const handleEditSelect = () => {
    if (onEdit) {
      onEdit(project)
    }
  }

  const handleDeleteSelect = () => {
    if (onDelete) {
      onDelete(project)
    }
  }

  return (
    <div
      className="relative h-[170px] w-full cursor-pointer rounded-2xl bg-[#F5F5F5] transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F5F5F5] group lg:w-[372px]"
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
    >
      <div className="flex h-full gap-4 p-4">
        {/* Левая колонка - контент */}
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-slate-900 line-clamp-2 transition-colors group-hover:text-blue-600">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-600 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>

          {/* Низ: меню действий + дата + количество */}
          <div className="flex items-center justify-between text-xs text-slate-500 whitespace-nowrap">
            <div className="flex items-center gap-1.5 min-w-0">
              {hasMenuActions && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-700"
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => event.stopPropagation()}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.stopPropagation()
                        }
                      }}
                      data-card-interactive="true"
                      aria-label={triggerLabel}
                      aria-haspopup="menu"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    side="top"
                    sideOffset={8}
                    className="w-44"
                  >
                    {onEdit && (
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-sm"
                        onSelect={handleEditSelect}
                      >
                        <Edit className="w-4 h-4" />
                        {editLabel}
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem
                        className="flex items-center gap-2 text-sm text-red-600 focus:text-red-600"
                        onSelect={handleDeleteSelect}
                      >
                        <Trash2 className="w-4 h-4" />
                        {deleteLabel}
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <span className="truncate">{formatDate(project.created_at)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {project.auditsCount || 0}{' '}
                {project.auditsCount === 1
                  ? 'аудит'
                  : project.auditsCount && project.auditsCount < 5
                  ? 'аудита'
                  : 'аудитов'}
              </span>
            </div>
          </div>
        </div>

        {/* Правая колонка - сетка 2x2 */}
        <div className="flex-shrink-0">
          <div className="grid grid-cols-2 gap-2">
            {screenshotSlots.map((screenshot, index) => (
              <div
                key={index}
                className="h-[58px] w-[58px] rounded-lg bg-white overflow-hidden"
              >
                {screenshot && (
                  <img
                    src={screenshot}
                    alt={`Audit ${index + 1}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
