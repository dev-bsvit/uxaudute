'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface HeroSectionProps {
  title: string
  description?: string
  children?: ReactNode
  className?: string
  variant?: 'default' | 'gradient' | 'minimal'
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const variantClasses = {
  default: 'bg-background',
  gradient: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  minimal: 'bg-muted/30'
}

const sizeClasses = {
  sm: 'py-8',
  md: 'py-12',
  lg: 'py-16',
  xl: 'py-20'
}

export function HeroSection({ 
  title, 
  description, 
  children, 
  className,
  variant = 'gradient',
  size = 'lg'
}: HeroSectionProps) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-3xl border border-white/20 shadow-soft",
      variantClasses[variant],
      sizeClasses[size],
      className
    )}>
      {variant === 'gradient' && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-purple-400/10" />
      )}
      
      <div className="relative z-10 text-center">
        <h1 className={cn(
          "font-bold leading-tight",
          size === 'sm' && "text-2xl",
          size === 'md' && "text-3xl", 
          size === 'lg' && "text-4xl",
          size === 'xl' && "text-5xl"
        )}>
          {title}
        </h1>
        
        {description && (
          <p className={cn(
            "mt-4 text-muted-foreground leading-relaxed",
            size === 'sm' && "text-base max-w-lg mx-auto",
            size === 'md' && "text-lg max-w-xl mx-auto",
            size === 'lg' && "text-xl max-w-2xl mx-auto",
            size === 'xl' && "text-2xl max-w-3xl mx-auto"
          )}>
            {description}
          </p>
        )}
        
        {children && (
          <div className="mt-8">
            {children}
          </div>
        )}
      </div>
    </div>
  )
}










