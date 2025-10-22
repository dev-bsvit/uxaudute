'use client'

import { ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CanvasAnnotations } from '@/components/ui/canvas-annotations'
import { Monitor } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface SurveySplitLayoutProps {
  children: ReactNode
  screenshot?: string | null
  surveyId?: string
  showAnnotations?: boolean
  onAnnotationSave?: (data: string) => void
  initialAnnotationData?: string
}

export function SurveySplitLayout({
  children,
  screenshot,
  surveyId,
  showAnnotations = true,
  onAnnotationSave,
  initialAnnotationData
}: SurveySplitLayoutProps) {
  const { t } = useTranslation()

  return (
    <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
      {/* Левая колонка - Контент */}
      <div className="space-y-6">
        {children}
      </div>

      {/* Правая колонка - Скриншот с аннотациями */}
      <div className="sticky top-4 h-fit">
        {screenshot && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                {t('surveys.screenshot') || 'Анализируемый интерфейс'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {showAnnotations ? (
                  <>
                    <CanvasAnnotations
                      src={screenshot}
                      alt="Survey screenshot"
                      className="w-full h-auto max-h-[70vh] object-contain"
                      onAnnotationSave={onAnnotationSave}
                      initialAnnotationData={initialAnnotationData}
                      auditId={surveyId}
                    />
                    <div className="text-sm text-gray-500 text-center">
                      💡 {t('surveys.annotationHint') || 'Кликните на изображение, чтобы добавить заметки'}
                    </div>
                  </>
                ) : (
                  <img
                    src={screenshot}
                    alt="Survey screenshot"
                    className="w-full h-auto max-h-[70vh] object-contain rounded-lg"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
