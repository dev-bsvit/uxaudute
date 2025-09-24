'use client'

import React, { useState } from 'react'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SurveyDisplay } from '@/components/ui/survey-display'
import { CanvasAnnotations } from '@/components/ui/canvas-annotations'
import { Monitor, Link2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'
import { useFormatters } from '@/hooks/use-formatters'
import { AnalysisResultLanguageIndicator } from '@/components/language-indicator'
import { analysisLanguageTracker } from '@/lib/analysis-language-tracker'

interface AnalysisResultDisplayProps {
  analysis?: StructuredAnalysisResponse
  showDetails?: boolean
  screenshot?: string | null
  url?: string | null
  onAnnotationUpdate?: (annotationData: string) => void
  auditId?: string // ID аудита для сохранения аннотаций
  analysisLanguage?: string // Язык анализа для отображения индикатора
}

export function AnalysisResultDisplay({ 
  analysis, 
  showDetails = true,
  screenshot,
  url,
  onAnnotationUpdate,
  auditId,
  analysisLanguage
}: AnalysisResultDisplayProps) {
  const { t } = useTranslation()
  const { formatDateTime, getLanguageIndicator } = useFormatters()
  
  // Защита от ошибок - проверяем структуру данных
  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('common.noDataToDisplay')}</p>
      </div>
    )
  }

  // Проверяем, что у нас есть минимально необходимая структура
  const safeAnalysis: StructuredAnalysisResponse = {
    screenDescription: analysis.screenDescription || { screenType: t('common.unknown'), confidence: 0 },
    uxSurvey: analysis.uxSurvey || { questions: [], overallConfidence: 0 },
    audience: analysis.audience || { 
      targetAudience: t('common.notLoaded'), 
      mainPain: t('common.loadingError'),
      fears: []
    },
    behavior: analysis.behavior || { 
      userScenarios: {
        idealPath: t('common.notLoaded'),
        typicalError: t('common.notLoaded'), 
        alternativeWorkaround: t('common.notLoaded')
      }, 
      behavioralPatterns: t('common.loadingError'),
      frictionPoints: [],
      actionMotivation: t('common.notLoaded')
    },
    problemsAndSolutions: analysis.problemsAndSolutions || [],
    selfCheck: analysis.selfCheck || { 
      checklist: {}, 
      varietyCheck: {}, 
      confidence: { analysis: 0 } 
    },
    annotations: analysis.annotations || '',
    metadata: analysis.metadata || { version: '1.0', model: t('common.unknown'), timestamp: new Date().toISOString() }
  }

  const [annotationData, setAnnotationData] = useState<string>(safeAnalysis?.annotations || '')

  const handleAnnotationSave = (data: string) => {
    setAnnotationData(data)
    onAnnotationUpdate?.(data)
    console.log('Annotation data saved:', data)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return t('common.high')
      case 'medium': return t('common.medium')
      case 'low': return t('common.low')
      default: return priority
    }
  }

  return (
    <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
      {/* Левая колонка - Результаты анализа */}
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <h2 className="text-3xl font-bold text-gray-900">
              {t('analysis-results.title')}
            </h2>
            {analysisLanguage && (
              <AnalysisResultLanguageIndicator language={analysisLanguage} />
            )}
          </div>
        </div>


      {/* Описание экрана */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 {t('analysis-results.screenDescription.title')}
            <Badge variant="outline" className={getConfidenceColor(safeAnalysis.screenDescription.confidence)}>
              {t('common.confidence')}: {safeAnalysis.screenDescription.confidence}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('analysis-results.screenDescription.screenType')}</h4>
              <p className="text-gray-600">{safeAnalysis.screenDescription.screenType}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('analysis-results.screenDescription.userGoal')}</h4>
              <p className="text-gray-600">{safeAnalysis.screenDescription.userGoal}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('analysis-results.screenDescription.keyElements')}</h4>
            <div className="flex flex-wrap gap-2">
              {safeAnalysis.screenDescription.keyElements.map((element: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {element}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('analysis-results.screenDescription.confidenceReason')}</h4>
            <p className="text-gray-600">{safeAnalysis.screenDescription.confidenceReason}</p>
          </div>
        </CardContent>
      </Card>

      {/* UX-опрос */}
      <SurveyDisplay survey={safeAnalysis.uxSurvey} />

      {/* Аудитория */}
      {safeAnalysis.audience && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 {t('analysis-results.audience.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Целевая аудитория */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.audience.targetAudience')}</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.audience.targetAudience}
                </p>
              </div>
            </div>

            {/* Основная боль */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.audience.mainPain')}</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.audience.mainPain}
                </p>
              </div>
            </div>

            {/* Страхи */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.audience.fears')}</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {safeAnalysis.audience.fears.map((fear: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-yellow-200 text-yellow-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{fear}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Поведение */}
      {safeAnalysis.behavior && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 {t('analysis-results.behavior.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Пользовательские сценарии */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.behavior.userScenarios')}</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <span className="font-medium text-green-800">{t('analysis-results.behavior.idealPath')}</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.idealPath}</p>
                </div>
                <div>
                  <span className="font-medium text-orange-800">{t('analysis-results.behavior.typicalError')}</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.typicalError}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">{t('analysis-results.behavior.alternativeWorkaround')}</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.alternativeWorkaround}</p>
                </div>
              </div>
            </div>

            {/* Поведенческие паттерны */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.behavior.behavioralPatterns')}</h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.behavior.behavioralPatterns}
                </p>
              </div>
            </div>

            {/* Точки трения */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.behavior.frictionPoints')}</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {safeAnalysis.behavior.frictionPoints.map((frictionPoint: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700">{frictionPoint.point}</span>
                        <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                          frictionPoint.impact === 'major' 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {frictionPoint.impact === 'major' ? t('analysis-results.behavior.majorImpact') : t('analysis-results.behavior.minorImpact')}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Мотивация к действию */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.behavior.actionMotivation')}</h4>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.behavior.actionMotivation}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Проблемы и решения */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔧 {t('analysis-results.problemsAndSolutions.title')}
            <Badge variant="outline">
              {Array.isArray(safeAnalysis.problemsAndSolutions) ? safeAnalysis.problemsAndSolutions.length : 0} {t('common.problems')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.isArray(safeAnalysis.problemsAndSolutions) ? safeAnalysis.problemsAndSolutions.map((problem: any, index: number) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{problem.element}</h4>
                  <Badge className={getPriorityColor(problem.priority)}>
                    {getPriorityText(problem.priority)} {t('common.priority').toLowerCase()}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">{t('analysis-results.problemsAndSolutions.problem')}</span>{' '}
                    <span className="text-gray-700">{problem.problem}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">{t('analysis-results.problemsAndSolutions.principle')}</span>{' '}
                    <span className="text-gray-700">{problem.principle}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">{t('analysis-results.problemsAndSolutions.consequence')}</span>{' '}
                    <span className="text-gray-700">{problem.consequence}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{t('analysis-results.problemsAndSolutions.recommendation')}</span>{' '}
                    <span className="text-gray-700">{problem.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-600">{t('analysis-results.problemsAndSolutions.expectedEffect')}</span>{' '}
                    <span className="text-gray-700">{problem.expectedEffect}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <p>{t('analysis-results.problemsAndSolutions.noProblemsFound')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Self-Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ {t('analysis-results.selfCheck.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.selfCheck.checklist')}</h4>
              <div className="space-y-2">
                {Object.entries(safeAnalysis.selfCheck.checklist).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center gap-2">
                    <span className={value ? 'text-green-500' : 'text-red-500'}>
                      {value ? '✅' : '❌'}
                    </span>
                    <span className="text-sm text-gray-700">
                      {key === 'coversAllElements' && t('analysis-results.selfCheck.coversAllElements')}
                      {key === 'noContradictions' && t('analysis-results.selfCheck.noContradictions')}
                      {key === 'principlesJustified' && t('analysis-results.selfCheck.principlesJustified')}
                      {key === 'actionClarity' && t('analysis-results.selfCheck.actionClarity')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.selfCheck.confidenceByBlocks')}</h4>
              <div className="space-y-2">
                {Object.entries(safeAnalysis.selfCheck.confidence).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {key === 'analysis' && t('common.analysis')}
                      {key === 'survey' && t('analysis-results.selfCheck.survey')}
                      {key === 'recommendations' && t('analysis-results.selfCheck.recommendations')}
                    </span>
                    <span className={`font-medium ${getConfidenceColor(Number(value))}`}>
                      {value}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Метаданные */}
      {showDetails && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h4 className="font-medium text-gray-900 mb-2">{t('analysis-results.metadata.title')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">{t('common.version')}:</span> {safeAnalysis.metadata?.version || '1.0'}
              </div>
              <div>
                <span className="font-medium">{t('common.model')}:</span> {safeAnalysis.metadata?.model || t('common.unknown')}
              </div>
              <div>
                <span className="font-medium">{t('common.time')}:</span> {safeAnalysis.metadata?.timestamp ? formatDateTime(safeAnalysis.metadata.timestamp) : t('common.unknown')}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      </div>

      {/* Правая колонка - Изображение с редактором */}
      <div className="sticky top-4 h-fit">
        {(screenshot || url) && (
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {screenshot ? <Monitor className="w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                {screenshot ? t('analysis-results.interface.analyzedInterface') : t('analysis-results.interface.analyzedUrl')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {screenshot ? (
                <div className="space-y-4">
                  <CanvasAnnotations
                    src={screenshot}
                    alt="Анализируемый скриншот"
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onAnnotationSave={handleAnnotationSave}
                    initialAnnotationData={annotationData}
                    auditId={auditId}
                  />
                  <div className="text-sm text-gray-500 text-center">
                    💡 {t('analysis-results.interface.annotationEditor')}
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-2">
                    {t('common.analysis')} {safeAnalysis.metadata?.timestamp ? formatDateTime(safeAnalysis.metadata.timestamp) : t('common.unknown')}
                  </div>
                </div>
              ) : url ? (
                <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium break-all flex items-center gap-2"
                  >
                    <Link2 className="w-4 h-4" />
                    {url}
                  </a>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
