'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { StructuredAnalysisResponse, SelfCheck } from '@/lib/analysis-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SurveyDisplay } from '@/components/ui/survey-display'
import { CanvasAnnotations } from '@/components/ui/canvas-annotations'
import { Monitor, Link2 } from 'lucide-react'

interface AnalysisResultDisplayProps {
  analysis?: StructuredAnalysisResponse
  showDetails?: boolean
  screenshot?: string | null
  url?: string | null
  onAnnotationUpdate?: (annotationData: string) => void
  auditId?: string // ID аудита для сохранения аннотаций
}

export function AnalysisResultDisplay({ 
  analysis, 
  showDetails = true,
  screenshot,
  url,
  onAnnotationUpdate,
  auditId
}: AnalysisResultDisplayProps) {
  const t = useTranslations('analysis')
  const tAnnotations = useTranslations('annotations')
  
  // Защита от ошибок - проверяем структуру данных
  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Нет данных для отображения</p>
      </div>
    )
  }

  // Проверяем, что у нас есть минимально необходимая структура
  const safeAnalysis: StructuredAnalysisResponse = {
    screenDescription: analysis.screenDescription || { screenType: "Неизвестно", confidence: 0 },
    uxSurvey: analysis.uxSurvey || { questions: [], overallConfidence: 0 },
    audience: analysis.audience || { 
      targetAudience: "Не загружено", 
      mainPain: "Ошибка загрузки",
      fears: []
    },
    behavior: analysis.behavior || { 
      userScenarios: {
        idealPath: "Не загружено",
        typicalError: "Не загружено", 
        alternativeWorkaround: "Не загружено"
      }, 
      behavioralPatterns: "Ошибка загрузки",
      frictionPoints: [],
      actionMotivation: "Не загружено"
    },
    problemsAndSolutions: analysis.problemsAndSolutions || analysis.problemsAndRecommendations || [],
    selfCheck: analysis.selfCheck || { 
      allKeyElementsCovered: false,
      contextualQuestionsAdded: false,
      audienceInsightsExtracted: false,
      targetActionClarityChecked: false,
      allRecommendationsJustified: false,
      noContradictoryRecommendations: false,
      checklist: {}, 
      varietyCheck: {}, 
      confidence: { analysis: 0, survey: 0, recommendations: 0 } 
    } as SelfCheck,
    annotations: analysis.annotations || '',
    metadata: analysis.metadata || { version: '1.0', model: 'Unknown', timestamp: new Date().toISOString() }
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

  return (
    <div className="w-full max-w-none grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-screen">
      {/* Левая колонка - Результаты анализа */}
      <div className="space-y-8">
        {/* Заголовок */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h2>
        </div>


      {/* Описание экрана */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 {t('screenDescription')}
            <Badge variant="outline" className={getConfidenceColor(safeAnalysis.screenDescription.confidence)}>
              {t('confidence')}: {safeAnalysis.screenDescription.confidence}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('screenType')}</h4>
              <p className="text-gray-600">{safeAnalysis.screenDescription.screenType}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{t('userGoal')}</h4>
              <p className="text-gray-600">{safeAnalysis.screenDescription.userGoal}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('keyElements')}</h4>
            <div className="flex flex-wrap gap-2">
              {(safeAnalysis.screenDescription.keyElements || []).map((element: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {element}
                </Badge>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">{t('confidenceReason')}</h4>
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
              👥 {t('audience')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Целевая аудитория */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('targetAudience')}</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.audience.targetAudience}
                </p>
              </div>
            </div>

            {/* Основная боль */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('mainPain')}</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.audience.mainPain}
                </p>
              </div>
            </div>

            {/* Страхи */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('userFears')}</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {(safeAnalysis.audience.fears || []).map((fear: string, index: number) => (
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
              🎯 {t('behavior')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Пользовательские сценарии */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('userScenarios')}</h4>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div>
                  <span className="font-medium text-green-800">{t('idealPath')}:</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.idealPath}</p>
                </div>
                <div>
                  <span className="font-medium text-orange-800">{t('typicalError')}:</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.typicalError}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-800">{t('alternativeWorkaround')}:</span>
                  <p className="text-gray-700 mt-1">{safeAnalysis.behavior.userScenarios.alternativeWorkaround}</p>
                </div>
              </div>
            </div>

            {/* Поведенческие паттерны */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('behavioralPatterns')}</h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {safeAnalysis.behavior.behavioralPatterns}
                </p>
              </div>
            </div>

            {/* Точки трения */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('frictionPoints')}</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {(safeAnalysis.behavior.frictionPoints || []).map((frictionPoint: any, index: number) => (
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
                          {frictionPoint.impact === 'major' ? 'Высокое' : 'Низкое'} влияние
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Мотивация к действию */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('actionMotivation')}</h4>
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
            🔧 {t('problemsAndSolutions')}
            <Badge variant="outline">
              {Array.isArray(safeAnalysis.problemsAndSolutions) ? safeAnalysis.problemsAndSolutions.length : 0} {t('problems')}
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
                    {problem.priority === 'high' ? t('highPriority') : 
                     problem.priority === 'medium' ? t('mediumPriority') : t('lowPriority')}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">{t('problem')}:</span>{' '}
                    <span className="text-gray-700">{problem.problem}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">{t('principle')}:</span>{' '}
                    <span className="text-gray-700">{problem.principle}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">{t('consequence')}:</span>{' '}
                    <span className="text-gray-700">{problem.consequence}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">{t('recommendation')}:</span>{' '}
                    <span className="text-gray-700">{problem.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-600">{t('expectedEffect')}:</span>{' '}
                    <span className="text-gray-700">{problem.expectedEffect}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-8">
                <p>{t('problemsAndSolutions')} не найдены</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Self-Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ {t('selfCheck')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('checklist')}</h4>
              <div className="space-y-2">
                {/* Новый формат selfCheck с булевыми полями */}
                {safeAnalysis.selfCheck.allKeyElementsCovered !== undefined && (
                  <>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.allKeyElementsCovered ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.allKeyElementsCovered ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Покрыты все ключевые элементы</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.contextualQuestionsAdded ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.contextualQuestionsAdded ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Добавлены контекстные вопросы</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.audienceInsightsExtracted ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.audienceInsightsExtracted ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Извлечены инсайты аудитории</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.targetActionClarityChecked ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.targetActionClarityChecked ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Проверена понятность целевого действия</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.allRecommendationsJustified ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.allRecommendationsJustified ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Все рекомендации обоснованы</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={safeAnalysis.selfCheck.noContradictoryRecommendations ? 'text-green-500' : 'text-red-500'}>
                        {safeAnalysis.selfCheck.noContradictoryRecommendations ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">Нет противоречивых рекомендаций</span>
                    </div>
                  </>
                )}
                
                {/* Старый формат checklist для обратной совместимости */}
                {safeAnalysis.selfCheck.checklist && Object.keys(safeAnalysis.selfCheck.checklist).length > 0 && (
                  Object.entries(safeAnalysis.selfCheck.checklist || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={value ? 'text-green-500' : 'text-red-500'}>
                        {value ? '✅' : '❌'}
                      </span>
                      <span className="text-sm text-gray-700">
                        {key === 'coversAllElements' && 'Покрыты все ключевые элементы'}
                        {key === 'noContradictions' && 'Нет противоречивых рекомендаций'}
                        {key === 'principlesJustified' && 'Каждая рекомендация обоснована принципом'}
                        {key === 'actionClarity' && 'Проверена понятность целевого действия'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('confidenceByBlocks')}</h4>
              <div className="space-y-2">
                {Object.entries(safeAnalysis.selfCheck.confidence || {}).map(([key, value]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {key === 'analysis' && t('analysis')}
                      {key === 'survey' && t('survey')}
                      {key === 'recommendations' && t('recommendations')}
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
            <h4 className="font-medium text-gray-900 mb-2">Информация об анализе</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Версия:</span> {safeAnalysis.metadata?.version || '1.0'}
              </div>
              <div>
                <span className="font-medium">Модель:</span> {safeAnalysis.metadata?.model || 'Unknown'}
              </div>
              <div>
                <span className="font-medium">Время:</span> {safeAnalysis.metadata?.timestamp ? new Date(safeAnalysis.metadata.timestamp).toLocaleString('ru-RU') : 'Неизвестно'}
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
                {screenshot ? tAnnotations('analyzedInterface') : tAnnotations('analyzedUrl')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {screenshot ? (
                <div className="space-y-4">
                  <CanvasAnnotations
                    src={screenshot}
                    alt={tAnnotations('analyzedScreenshot')}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    onAnnotationSave={handleAnnotationSave}
                    initialAnnotationData={annotationData}
                    auditId={auditId}
                  />
                  <div className="text-sm text-gray-500 text-center">
                    💡 {tAnnotations('editorHint')}
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-2">
                    {tAnnotations('analysis')} {safeAnalysis.metadata?.timestamp ? new Date(safeAnalysis.metadata.timestamp).toLocaleDateString('ru-RU') : 'Неизвестно'}
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
