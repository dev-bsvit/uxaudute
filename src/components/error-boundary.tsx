'use client'

import React, { Component, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { errorHandler } from '@/lib/i18n/error-handler'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Генерируем уникальный ID для ошибки
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем ошибку через error handler
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Вызываем callback если предоставлен
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleReportError = () => {
    if (this.state.error && this.state.errorId) {
      const report = errorHandler.generateErrorReport()
      
      // В реальном приложении здесь бы отправляли отчет на сервер
      console.log('Error report:', report)
      
      // Копируем отчет в буфер обмена
      if (navigator.clipboard) {
        navigator.clipboard.writeText(report).then(() => {
          // TODO: Заменить на toast уведомление
          alert('Error report copied to clipboard') // Временно на английском
        })
      }
    }
  }

  render() {
    if (this.state.hasError) {
      // Если предоставлен кастомный fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Стандартный UI ошибки
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Что-то пошло не так
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                Произошла неожиданная ошибка. Мы уже работаем над её исправлением.
              </p>
              
              {this.state.errorId && (
                <div className="bg-gray-100 rounded-lg p-3">
                  <p className="text-sm text-gray-600 mb-1">ID ошибки:</p>
                  <code className="text-xs font-mono text-gray-800">
                    {this.state.errorId}
                  </code>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={this.handleRetry}
                  className="flex-1 flex items-center gap-2"
                  variant="outline"
                >
                  <RefreshCw className="w-4 h-4" />
                  Попробовать снова
                </Button>
                
                <Button
                  onClick={this.handleReportError}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Bug className="w-4 h-4" />
                  Отчет
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Если проблема не исчезает, обратитесь в службу поддержки
              </p>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Хук для обработки ошибок в функциональных компонентах
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: string) => {
    console.error(`Error in ${context || 'component'}:`, error)
    
    // Можно добавить дополнительную логику обработки ошибок
    // например, отправку на сервер аналитики
  }

  return { handleError }
}