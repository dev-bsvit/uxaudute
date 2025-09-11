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
}

export function AnalysisResultDisplay({ 
  analysis, 
  showDetails = true,
  screenshot,
  url,
  onAnnotationUpdate,
  auditId
}: AnalysisResultDisplayProps) {
  const [annotationData, setAnnotationData] = useState<string>(analysis?.annotations || '')

  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Нет данных для отображения</p>
      </div>
    )
  }

  const handleAnnotationSave = (data: string) => {
    setAnnotationData(data)
    onAnnotationUpdate?.(data)
    console.log('Annotation data saved:', data)
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
        {/* Описание экрана */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Описание экрана
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Тип экрана</h4>
              <p className="text-gray-600">{analysis.screenDescription.screenType}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Цель пользователя</h4>
              <p className="text-gray-600">{analysis.screenDescription.userGoal}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Ключевые элементы</h4>
            <div className="flex flex-wrap gap-2">
              {analysis.screenDescription.keyElements.map((element, index) => (
                <Badge key={index} variant="secondary">
                  {element}
                </Badge>
              ))}
            </div>
          </div>
          
        </CardContent>
      </Card>

      {/* UX-опрос */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 UX-опрос
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SurveyDisplay survey={analysis.uxSurvey} />
        </CardContent>
      </Card>

      {/* Аудитория */}
      {analysis.audience && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              👥 Аудитория
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Целевая аудитория */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Целевая аудитория</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.audience.targetAudience}
                </p>
              </div>
            </div>

            {/* Основная боль */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Основная боль</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.audience.mainPain}
                </p>
              </div>
            </div>

            {/* Страхи */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Страхи пользователей</h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <ol className="space-y-2">
                  {analysis.audience.fears.map((fear, index) => (
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
      {analysis.behavior && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🎯 Поведение
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Пользовательские сценарии */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Пользовательские сценарии</h4>
              <div className="space-y-4">
                {/* Идеальный путь */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h5 className="font-medium text-green-800 mb-2">✅ Идеальный путь</h5>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {typeof analysis.behavior.userScenarios === 'string' 
                      ? analysis.behavior.userScenarios 
                      : analysis.behavior.userScenarios.idealPath}
                  </p>
                </div>
                
                {/* Типичная ошибка */}
                {typeof analysis.behavior.userScenarios === 'object' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h5 className="font-medium text-red-800 mb-2">❌ Типичная ошибка</h5>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {analysis.behavior.userScenarios.typicalError}
                    </p>
                  </div>
                )}
                
                {/* Альтернативный обход */}
                {typeof analysis.behavior.userScenarios === 'object' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h5 className="font-medium text-blue-800 mb-2">🔄 Альтернативный обход</h5>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {analysis.behavior.userScenarios.alternativeWorkaround}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Поведенческие паттерны */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Поведенческие паттерны</h4>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.behavior.behavioralPatterns}
                </p>
              </div>
            </div>

            {/* Точки трения */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Точки трения</h4>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <ol className="space-y-3">
                  {analysis.behavior.frictionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-gray-700">
                          {typeof point === 'string' ? point : point.point}
                        </span>
                        {typeof point === 'object' && point.impact && (
                          <Badge 
                            className={`ml-2 ${
                              point.impact === 'major' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {point.impact === 'major' ? 'Критично' : 'Незначительно'}
                          </Badge>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Мотивация к действию */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Мотивация к действию</h4>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.behavior.actionMotivation}
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
            🔧 Проблемы и решения
            <Badge variant="outline">
              {analysis.problemsAndSolutions.length} проблем
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.problemsAndSolutions.map((problem, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="font-medium text-gray-900">{problem.element}</h4>
                  <Badge className={getPriorityColor(problem.priority)}>
                    {problem.priority === 'high' ? 'Высокий' : 
                     problem.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-red-600">Проблема:</span>{' '}
                    <span className="text-gray-700">{problem.problem}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-600">Принцип:</span>{' '}
                    <span className="text-gray-700">{problem.principle}</span>
                  </div>
                  <div>
                    <span className="font-medium text-orange-600">Последствие:</span>{' '}
                    <span className="text-gray-700">{problem.consequence}</span>
                  </div>
                  
                  {/* Влияние на бизнес (v2) */}
                  {problem.businessImpact && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-slate-700">💼 Влияние на бизнес:</span>
                        <Badge className={
                          problem.businessImpact.impactLevel === 'high' ? 'bg-red-100 text-red-800' :
                          problem.businessImpact.impactLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }>
                          {problem.businessImpact.impactLevel === 'high' ? 'Высокое' :
                           problem.businessImpact.impactLevel === 'medium' ? 'Среднее' : 'Низкое'} влияние
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div><strong>Метрика:</strong> {problem.businessImpact.metric}</div>
                        <div><strong>Описание:</strong> {problem.businessImpact.description}</div>
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="font-medium text-green-600">Рекомендация:</span>{' '}
                    <span className="text-gray-700">{problem.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-600">Ожидаемый эффект:</span>{' '}
                    <span className="text-gray-700">{problem.expectedEffect}</span>
                  </div>
                  
                  {/* Уверенность в рекомендации (v2) */}
                  {problem.confidence && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-indigo-600">Уверенность:</span>
                      <span className="text-gray-700">{problem.confidence}%</span>
                      {problem.confidenceSource && (
                        <span className="text-gray-500">({problem.confidenceSource})</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Self-Check (v2) */}
      {analysis.selfCheck && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🔍 Само-проверка анализа
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Основная проверка */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Чек-лист качества</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${analysis.selfCheck.checklist.coversAllElements ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">Покрыты все элементы</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${analysis.selfCheck.checklist.noContradictions ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">Нет противоречий</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${analysis.selfCheck.checklist.principlesJustified ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">Принципы обоснованы</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${analysis.selfCheck.checklist.actionClarity ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  <span className="text-sm">Ясность действий</span>
                </div>
              </div>
            </div>

            {/* Проверка разнообразия (v2) */}
            {analysis.selfCheck.varietyCheck && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Проверка разнообразия</h4>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-4 h-4 rounded-full ${analysis.selfCheck.varietyCheck.passed ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="font-medium">
                      {analysis.selfCheck.varietyCheck.passed ? 'Пройдена' : 'Не пройдена'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{analysis.selfCheck.varietyCheck.description}</p>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium">Принципы:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.selfCheck.varietyCheck.principleVariety.map((principle, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {principle}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Типы проблем:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {analysis.selfCheck.varietyCheck.issueTypes.map((type, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Анализ уверенности (v2) */}
            {analysis.selfCheck.confidenceVariation && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Анализ уверенности</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysis.selfCheck.confidenceVariation.min}%</div>
                      <div className="text-sm text-gray-600">Минимум</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysis.selfCheck.confidenceVariation.average}%</div>
                      <div className="text-sm text-gray-600">Среднее</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{analysis.selfCheck.confidenceVariation.max}%</div>
                      <div className="text-sm text-gray-600">Максимум</div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{analysis.selfCheck.confidenceVariation.explanation}</p>
                </div>
              </div>
            )}

            {/* Общая уверенность */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Уровни уверенности</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{analysis.selfCheck.confidence.analysis}%</div>
                  <div className="text-sm text-gray-600">Анализ</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{analysis.selfCheck.confidence.survey}%</div>
                  <div className="text-sm text-gray-600">Опрос</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{analysis.selfCheck.confidence.recommendations}%</div>
                  <div className="text-sm text-gray-600">Рекомендации</div>
                </div>
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
                {screenshot ? 'Анализируемый интерфейс' : 'Анализируемый URL'}
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
                    💡 Редактор аннотаций открывается автоматически. Добавьте комментарии и выделения к скриншоту
                  </div>
                  <div className="text-xs text-gray-400 text-center mt-2">
                    Анализ {new Date(analysis.metadata.timestamp).toLocaleDateString('ru-RU')}
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
