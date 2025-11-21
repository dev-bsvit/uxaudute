'use client'

import React from 'react'
import { SidebarDemo } from './sidebar-demo'

interface PageLayoutProps {
  children: React.ReactNode
  /** Контент для хедера страницы (PageHeader и т.д.) */
  header?: React.ReactNode
  /** Горизонтальные отступы: sm=px-4, md=px-6, lg=px-8 (default) */
  padding?: 'sm' | 'md' | 'lg'
  /** Вертикальные промежутки: sm=space-y-4, md=space-y-6, lg=space-y-8 (default) */
  spacing?: 'sm' | 'md' | 'lg'
  /** Максимальная ширина контента */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  /** Дополнительные классы для контейнера */
  className?: string
}

const paddingMap = {
  sm: 'px-4',
  md: 'px-6',
  lg: 'px-8'
}

const spacingMap = {
  sm: 'space-y-4',
  md: 'space-y-6',
  lg: 'space-y-8'
}

const maxWidthMap = {
  sm: 'max-w-4xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: ''
}

/**
 * Единый компонент лейаута страницы с консистентными отступами.
 * Оборачивает контент в SidebarDemo и применяет стандартные padding/spacing.
 *
 * Стандартные значения:
 * - padding: px-8 (32px)
 * - spacing: space-y-8 (32px между секциями)
 *
 * @example
 * <PageLayout header={<PageHeader title="Мои проекты" />}>
 *   <ProjectsList />
 * </PageLayout>
 */
export function PageLayout({
  children,
  header,
  padding = 'lg',
  spacing = 'lg',
  maxWidth = 'full',
  className = ''
}: PageLayoutProps) {
  const paddingClass = paddingMap[padding]
  const spacingClass = spacingMap[spacing]
  const maxWidthClass = maxWidthMap[maxWidth]

  return (
    <SidebarDemo>
      <div className={`${spacingClass} w-full ${className}`}>
        {header && (
          <div className={paddingClass}>
            {header}
          </div>
        )}
        <div className={`${paddingClass} ${spacingClass} ${maxWidthClass}`}>
          {children}
        </div>
      </div>
    </SidebarDemo>
  )
}

/**
 * Компонент для скелетона страницы с теми же отступами.
 * Используется для loading.tsx файлов.
 */
export function PageLayoutSkeleton({
  padding = 'lg',
  spacing = 'lg',
  children
}: {
  padding?: 'sm' | 'md' | 'lg'
  spacing?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}) {
  const paddingClass = paddingMap[padding]
  const spacingClass = spacingMap[spacing]

  return (
    <SidebarDemo>
      <div className={`${spacingClass} w-full`}>
        <div className={`${paddingClass} ${spacingClass}`}>
          {children}
        </div>
      </div>
    </SidebarDemo>
  )
}

export default PageLayout
