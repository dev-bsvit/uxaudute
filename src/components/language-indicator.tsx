'use client'

import { Badge } from '@/components/ui/badge'
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getLanguageIndicator } from '@/lib/i18n/formatters'
import { useTranslation } from '@/hooks/use-translation'

interface LanguageIndicatorProps {
  language: string
  variant?: 'default' | 'secondary' | 'outline'
  size?: 'sm' | 'default' | 'lg'
  showFlag?: boolean
  showName?: boolean
  showTooltip?: boolean
  className?: string
}

/**
 * Компонент для отображения индикатора языка
 */
export function LanguageIndicator({
  language,
  variant = 'outline',
  size = 'sm',
  showFlag = true,
  showName = true,
  showTooltip = true,
  className = ''
}: LanguageIndicatorProps) {
  const { t } = useTranslation()
  const indicator = getLanguageIndicator(language)

  const content = (
    <Badge 
      variant={variant} 
      className={`${className} ${size === 'sm' ? 'text-xs px-2 py-1' : size === 'lg' ? 'text-sm px-3 py-2' : ''}`}
    >
      {showFlag && <span className="mr-1">{indicator.flag}</span>}
      {showName && <span>{indicator.name}</span>}
    </Badge>
  )

  // Временно отключаем tooltip до настройки UI компонентов
  return content
}

/**
 * Компонент для отображения индикатора языка в списке анализов
 */
export function AnalysisLanguageIndicator({ 
  language, 
  className = '' 
}: { 
  language: string
  className?: string 
}) {
  return (
    <LanguageIndicator
      language={language}
      variant="secondary"
      size="sm"
      showFlag={true}
      showName={true}
      showTooltip={true}
      className={className}
    />
  )
}

/**
 * Компонент для отображения языка в заголовке результата анализа
 */
export function AnalysisResultLanguageIndicator({ 
  language,
  className = ''
}: { 
  language: string
  className?: string 
}) {
  return (
    <LanguageIndicator
      language={language}
      variant="outline"
      size="default"
      showFlag={true}
      showName={true}
      showTooltip={true}
      className={className}
    />
  )
}