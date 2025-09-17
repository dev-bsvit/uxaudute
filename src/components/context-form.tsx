'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ContextFormProps {
  onContextSubmit: (context: string) => void
  onSkip: () => void
  isLoading?: boolean
}

export function ContextForm({ onContextSubmit, onSkip, isLoading = false }: ContextFormProps) {
  const [context, setContext] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onContextSubmit(context)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📝 Добавьте контекст для анализа
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="context">
              Опишите контекст использования интерфейса (необязательно)
            </Label>
            <Textarea
              id="context"
              placeholder="Например: Это мобильное приложение для заказа еды. Основная аудитория - молодые люди 18-35 лет. Пользователи должны быстро найти ресторан и оформить заказ..."
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-sm text-gray-500">
              Чем больше контекста вы предоставите, тем точнее будет анализ
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? 'Анализируем...' : 'Начать анализ'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              disabled={isLoading}
            >
              Пропустить
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}






