'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionProps {
  children: ReactNode
  className?: string
  spacing?: 'sm' | 'md' | 'lg' | 'xl'
  background?: 'default' | 'muted' | 'accent'
}

const spacingClasses = {
  sm: 'py-4',
  md: 'py-8', 
  lg: 'py-12',
  xl: 'py-16'
}

const backgroundClasses = {
  default: 'bg-background',
  muted: 'bg-muted/30',
  accent: 'bg-accent/30'
}

export function Section({ 
  children, 
  className, 
  spacing = 'lg',
  background = 'default' 
}: SectionProps) {
  return (
    <section className={cn(
      backgroundClasses[background],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </section>
  )
}










