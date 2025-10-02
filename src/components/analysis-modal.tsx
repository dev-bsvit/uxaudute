'use client'

import { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Brain, BarChart3, CheckCircle, Sparkles, X } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface AnalysisModalProps {
  isOpen: boolean
  onClose: () => void
  screenshot?: string | null
  url?: string | null
  canClose?: boolean
}

export function AnalysisModal({
  isOpen,
  onClose,
  screenshot,
  url,
  canClose = false
}: AnalysisModalProps) {
  const { t } = useTranslation()
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const steps = useMemo(
    () => [
      { icon: Brain, text: t('analysis.analysisModal.steps.interface'), progress: 25 },
      { icon: BarChart3, text: t('analysis.analysisModal.steps.metrics'), progress: 50 },
      { icon: CheckCircle, text: t('analysis.analysisModal.steps.recommendations'), progress: 75 },
      { icon: Sparkles, text: t('analysis.analysisModal.steps.finalizing'), progress: 100 }
    ],
    [t]
  )

  useEffect(() => {
    if (!isOpen) {
      setProgress(0)
      setCurrentStep(0)
      return
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 100)

    return () => clearInterval(interval)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval)
          return steps.length - 1
        }
        return prev + 1
      })
    }, 2000)

    return () => clearInterval(stepInterval)
  }, [isOpen, steps.length])

  const CurrentStepIcon = steps[currentStep]?.icon || Brain
  const statusCompleted = t('analysis.analysisModal.status.completed')
  const statusActive = t('analysis.analysisModal.status.active')
  const statusPending = t('analysis.analysisModal.status.pending')

  return (
    <Dialog open={isOpen} onOpenChange={canClose ? onClose : undefined}>
      <DialogContent
        className={`max-w-2xl mx-auto ${!canClose ? '[&>button]:hidden' : ''}`}
        aria-describedby="analysis-progress-description"
      >
        <DialogHeader className="text-center">
          <DialogDescription id="analysis-progress-description">
            {t('analysis.analysisModal.description')}
          </DialogDescription>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-lg">
              <CurrentStepIcon className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold text-gradient mb-2">
            {t('analysis.analysisModal.title')}
          </DialogTitle>
          <p className="text-slate-600 text-lg">
            {steps[currentStep]?.text || t('analysis.analysisModal.loadingFallback')}
          </p>
        </DialogHeader>

        <CardContent className="p-6">
          <div className="mb-8">
            <div className="flex justify-between text-sm text-slate-600 mb-2">
              <span>{t('analysis.analysisModal.progress')}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="mb-8">
            <h4 className="font-semibold text-slate-800 mb-4">{t('analysis.analysisModal.contentTitle')}</h4>

            {screenshot ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">{t('analysis.analysisModal.screenshotLabel')}</div>
                <div className="relative">
                  <img
                    src={screenshot}
                    alt={t('analysis.analysisModal.screenshotLabel')}
                    className="w-full h-48 object-cover rounded-xl border-2 border-slate-200"
                  />
                  <div className="absolute inset-0 bg-blue-500/10 rounded-xl flex items-center justify-center">
                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-3">
                      <Brain className="w-6 h-6 text-blue-600 animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
            ) : url ? (
              <div className="space-y-4">
                <div className="text-sm text-slate-600">{t('analysis.analysisModal.urlLabel')}</div>
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-slate-800 font-medium">{url}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 text-center">
                <div className="text-slate-600">{t('analysis.analysisModal.loadingPlaceholder')}</div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold text-slate-800 mb-4">{t('analysis.analysisModal.stagesTitle')}</h4>
            {steps.map((step, index) => {
              const StepIcon = step.icon
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <div
                  key={index}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-50 border-2 border-blue-200'
                      : isCompleted
                        ? 'bg-green-50 border-2 border-green-200'
                        : 'bg-slate-50 border-2 border-slate-200'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div
                      className={`font-medium ${
                        isActive ? 'text-blue-800' : isCompleted ? 'text-green-800' : 'text-slate-600'
                      }`}
                    >
                      {step.text}
                    </div>
                    <div className="text-sm text-slate-500">
                      {isCompleted ? statusCompleted : isActive ? statusActive : statusPending}
                    </div>
                  </div>
                  {isActive && (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="text-sm text-slate-600 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span>{t('analysis.analysisModal.noteTitle')}</span>
              </div>
              <p>{t('analysis.analysisModal.noteDescription')}</p>
            </div>
          </div>

          {canClose && (
            <div className="mt-6 flex justify-center">
              <Button
                onClick={onClose}
                variant="outline"
                className="flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                {t('analysis.analysisModal.cancel')}
              </Button>
            </div>
          )}
        </CardContent>
      </DialogContent>
    </Dialog>
  )
}
