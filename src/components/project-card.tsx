import Link from 'next/link'
import { Edit, BarChart3 } from 'lucide-react'

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string | null
    created_at: string
    auditsCount?: number
    screenshots?: string[]
  }
  formatDate: (dateString: string) => string
}

export function ProjectCard({ project, formatDate }: ProjectCardProps) {
  // Создаём массив из 4 элементов для сетки
  const screenshotSlots = Array.from({ length: 4 }, (_, i) =>
    project.screenshots?.[i] || null
  )

  return (
    <div className="relative rounded-2xl transition-all duration-300 group overflow-hidden h-[170px] bg-[#F5F5F5] w-full lg:w-[372px]">
      <Link href={`/projects/${project.id}`} className="block h-full">
        <div className="flex h-full gap-4 p-4">
          {/* Левая колонка - контент */}
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {project.name}
              </h3>
              {project.description && (
                <p className="text-sm text-slate-600 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>

            {/* Низ: карандаш + дата + количество */}
            <div className="flex items-center gap-3 text-xs text-slate-500 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <Edit className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{formatDate(project.created_at)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">
                  {project.auditsCount || 0} {project.auditsCount === 1 ? 'аудит' : project.auditsCount && project.auditsCount < 5 ? 'аудита' : 'аудитов'}
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
                  className="w-[58px] h-[58px] rounded-lg overflow-hidden bg-white"
                >
                  {screenshot && (
                    <img
                      src={screenshot}
                      alt={`Audit ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}
