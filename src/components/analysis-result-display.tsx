'use client'

import React, { useState } from 'react'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
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
  // Простые функции без переводов
  const formatDateTime = (timestamp: string) => new Date(timestamp).toLocaleString('ru-RU')
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'common.noDataToDisplay': 'Нет данных для отображения',
      'common.unknown': 'Неизвестно',
      'common.notLoaded': 'Не загружено',
      'common.loadingError': 'Ошибка загрузки',
      'common.confidence': 'Уверенность',
      'common.high': 'Высокий',
      'common.medium': 'Средний',
      'common.low': 'Низкий',
      'common.problems': 'проблем',
      'common.priority': 'Приоритет',
      'common.analysis': 'Анализ',
      'common.version': 'Версия',
      'common.model': 'Модель',
      'common.time': 'Время',
      'analysis-results.title': 'Результаты UX анализа',
      'analysis-results.screenDescription.title': 'Описание экрана',
      'analysis-results.screenDescription.screenType': 'Тип экрана',
      'analysis-results.screenDescription.userGoal': 'Цель пользователя',
      'analysis-results.screenDescription.keyElements': 'Ключевые элементы',
      'analysis-results.screenDescription.confidenceReason': 'Обоснование уверенности',
      'analysis-results.audience.title': 'Аудитория',
      'analysis-results.audience.targetAudience': 'Целевая аудитория',
      'analysis-results.audience.mainPain': 'Основная боль',
      'analysis-results.audience.fears': 'Страхи пользователей',
      'analysis-results.behavior.title': 'Поведение',
      'analysis-results.behavior.userScenarios': 'Пользовательские сценарии',
      'analysis-results.behavior.idealPath': 'Идеальный путь:',
      'analysis-results.behavior.typicalError': 'Типичная ошибка:',
      'analysis-results.behavior.alternativeWorkaround': 'Альтернативный обход:',
      'analysis-results.behavior.behavioralPatterns': 'Поведенческие паттерны',
      'analysis-results.behavior.frictionPoints': 'Точки трения',
      'analysis-results.behavior.actionMotivation': 'Мотивация к действию',
      'analysis-results.behavior.majorImpact': 'Серьезное влияние',
      'analysis-results.behavior.minorImpact': 'Незначительное влияние',
      'analysis-results.problemsAndSolutions.title': 'Проблемы и решения',
      'analysis-results.problemsAndSolutions.problem': 'Проблема:',
      'analysis-results.problemsAndSolutions.principle': 'Принцип:',
      'analysis-results.problemsAndSolutions.consequence': 'Последствие:',
      'analysis-results.problemsAndSolutions.recommendation': 'Рекомендация:',
      'analysis-results.problemsAndSolutions.expectedEffect': 'Ожидаемый эффект:',
      'analysis-results.problemsAndSolutions.noProblemsFound': 'Проблемы и решения не найдены',
      'analysis-results.selfCheck.title': 'Проверка качества анализа',
      'analysis-results.selfCheck.checklist': 'Чек-лист',
      'analysis-results.selfCheck.confidenceByBlocks': 'Уверенность по блокам',
      'analysis-results.selfCheck.coversAllElements': 'Покрывает все элементы',
      'analysis-results.selfCheck.noContradictions': 'Нет противоречий',
      'analysis-results.selfCheck.principlesJustified': 'Принципы обоснованы',
      'analysis-results.selfCheck.actionClarity': 'Четкость действий',
      'analysis-results.selfCheck.survey': 'Опрос',
      'analysis-results.selfCheck.recommendations': 'Рекомендации',
      'analysis-results.metadata.title': 'Метаданные',
      'analysis-results.interface.analyzedInterface': 'Анализируемый интерфейс',
      'analysis-results.interface.analyzedUrl': 'Анализируемый URL',
      'analysis-results.interface.annotationEditor': 'Редактор аннотаций - кликните и рисуйте на изображении'
    }
    return translations[key] || key
  }
  
  // Защита от ошибок - проверяем структуру данных
  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Нет данных для отображения</p>
      </div>
    )
  }

  console.log('🔍 AnalysisResultDisplay получил данные:', analysis)
  console.log('📊 Структура данных:', Object.keys(analysis))

  // Проверяем, что у нас есть минимально необходимая структура
  const safeAnalysis: StructuredAnalysisResponse = {
    screenDescription: analysis.screenDescription || { 
      screenType: (analysis as any).screenType || 'Неизвестно', 
      confidence: (analysis as any).confidence || 0,
      userGoal: (analysis as any).userGoal || 'Не определено',
      keyElements: (analysis as any).keyElements || [],
      confidenceReason: (analysis as any).confidenceReason || 'Не указано'
    },
    uxSurvey: analysis.uxSurvey || { 
      questions: (analysis as any).questions || [], 
      overallConfidence: (analysis as any).overallConfidence || 0,
      summary: (analysis as any).summary || {
        totalQuestions: 0,
        averageConfidence: 0,
        criticalIssues: 0,
        recommendations: []
      }
    },
    audience: analysis.audience || { 
      targetAudience: (analysis as any).targetAudience || 'Не определена', 
      mainPain: (analysis as any).mainPain || 'Не выявлена',
      fears: (analysis as any).fears || []
    },
    behavior: analysis.behavior || { 
      userScenarios: (analysis as any).userScenarios || {
        idealPath: 'Не определен',
        typicalError: 'Не определена', 
        alternativeWorkaround: 'Не определен'
      }, 
      behavioralPatterns: (analysis as any).behavioralPatterns || 'Не выявлены',
      frictionPoints: (analysis as any).frictionPoints || [],
      actionMotivation: (analysis as any).actionMotivation || 'Не определена'
    },
    problemsAndSolutions: analysis.problemsAndSolutions || [],
    selfCheck: analysis.selfCheck || { 
      checklist: (analysis as any).checklist || {}, 
      varietyCheck: (analysis as any).varietyCheck || {}, 
      confidence: (analysis as any).confidence || { analysis: 0 } 
    },
    annotations: analysis.annotations || '',
    metadata: analysis.metadata || { 
      version: '1.0', 
      model: 'GPT-4', 
      timestamp: new Date().toISOString() 
    }
  }

  console.log('✅ Безопасная структура данных создана:', safeAnalysis)
  console.log('🔍 safeAnalysis.screenDescription:', safeAnalysis.screenDescription)
  console.log('🔍 safeAnalysis.uxSurvey:', safeAnalysis.uxSurvey)
  console.log('🔍 safeAnalysis.audience:', safeAnalysis.audience)
  console.log('🔍 safeAnalysis.behavior:', safeAnalysis.behavior)
  console.log('🔍 safeAnalysis.problemsAndSolutions:', safeAnalysis.problemsAndSolutions)

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
              Результаты UX анализа
            </h2>
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
              {(safeAnalysis.screenDescription.keyElements || []).map((element: string, index: number) => (
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
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {typeof safeAnalysis.audience.targetAudience === 'string' 
                    ? safeAnalysis.audience.targetAudience
                    : typeof safeAnalysis.audience.targetAudience === 'object' && safeAnalysis.audience.targetAudience !== null
                    ? JSON.stringify(safeAnalysis.audience.targetAudience, null, 2)
                    : t('common.loadingError')
                  }
                </div>
              </div>
            </div>

            {/* Основная боль */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.audience.mainPain')}</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {typeof safeAnalysis.audience.mainPain === 'string' 
                    ? safeAnalysis.audience.mainPain
                    : typeof safeAnalysis.audience.mainPain === 'object' && safeAnalysis.audience.mainPain !== null
                    ? JSON.stringify(safeAnalysis.audience.mainPain, null, 2)
                    : t('common.loadingError')
                  }
                </div>
              </div>
            </div>

            {/* Страхи */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">{t('analysis-results.audience.fears')}</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {(safeAnalysis.audience?.fears || []).map((fear: string, index: number) => (
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
                  {(safeAnalysis.behavior?.frictionPoints || []).map((frictionPoint: any, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700">
                          {typeof frictionPoint === 'string' ? frictionPoint : frictionPoint.point}
                        </span>
                        {typeof frictionPoint === 'object' && frictionPoint.impact && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            frictionPoint.impact === 'major' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {frictionPoint.impact === 'major' ? t('analysis-results.behavior.majorImpact') : t('analysis-results.behavior.minorImpact')}
                          </span>
                        )}
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
              {(safeAnalysis.problemsAndSolutions || []).length} {t('common.problems')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {(safeAnalysis.problemsAndSolutions || []).length > 0 ? (safeAnalysis.problemsAndSolutions || []).map((problem: any, index: number) => {
              // Очищаем лишние кавычки из ключей
              const cleanProblem = {
                element: (problem.element || problem["'element'"] || '').replace(/^'|'$/g, ''),
                problem: (problem.problem || problem["'problem'"] || '').replace(/^'|'$/g, ''),
                principle: (problem.principle || problem["'principle'"] || '').replace(/^'|'$/g, ''),
                consequence: (problem.consequence || problem["'consequence'"] || '').replace(/^'|'$/g, ''),
                recommendation: (problem.recommendation || problem["'recommendation'"] || '').replace(/^'|'$/g, ''),
                expectedEffect: (problem.expectedEffect || problem["'expectedEffect'"] || '').replace(/^'|'$/g, ''),
                priority: (problem.priority || problem["'priority'"] || 'medium').replace(/^'|'$/g, '')
              }
              
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{cleanProblem.element}</h4>
                  <Badge className={getPriorityColor(cleanProblem.priority)}>
                    {getPriorityText(cleanProblem.priority)} приоритет
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Проблема:</span>{' '}
                    <span className="text-gray-700">{cleanProblem.problem}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Принцип:</span>{' '}
                    <span className="text-gray-700">{cleanProblem.principle}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">Последствие:</span>{' '}
                    <span className="text-gray-700">{cleanProblem.consequence}</span>
                  </div>
                  <div>
                    <span className="font-medium text-green-600">Рекомендация:</span>{' '}
                    <span className="text-gray-700">{cleanProblem.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-600">Ожидаемый эффект:</span>{' '}
                    <span className="text-gray-700">{cleanProblem.expectedEffect}</span>
                  </div>
                </div>
                </div>
              )
            }
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
                {Object.entries(safeAnalysis.selfCheck?.checklist || {}).map(([key, value]: [string, any]) => (
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
                {Object.entries(safeAnalysis.selfCheck?.confidence || {}).map(([key, value]: [string, any]) => (
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
