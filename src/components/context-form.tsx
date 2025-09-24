'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useTranslation } from '@/hooks/use-translation'

interface ContextFormProps {
  onContextSubmit: (context: string) => void
  onSkip: () => void
  isLoading?: boolean
}

export function ContextForm({ onContextSubmit, onSkip, isLoading = false }: ContextFormProps) {
  const { t } = useTranslation()
  const [context, setContext] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onContextSubmit(context)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📝 {t('analysis.addContext')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">
              {t('components.analysis.contextDescription')}
            </Label>
            <Textarea
              id="context"
              placeholder={t('components.upload.contextPlaceholder')}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              {t('components.analysis.contextHelp')}
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? t('components.analysis.analyzing') : t('components.analysis.startAnalysis')}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              disabled={isLoading}
            >
              {t('components.analysis.skip')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}







