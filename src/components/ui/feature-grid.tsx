'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface FeatureGridProps {
  children: ReactNode
  className?: string
  columns?: 1 | 2 | 3 | 4
}

const columnClasses = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
}

export function FeatureGrid({ 
  children, 
  className, 
  columns = 3 
}: FeatureGridProps) {
  return (
    <div className={cn(
      "grid gap-6",
      columnClasses[columns],
      className
    )}>
      {children}
    </div>
  )
}




