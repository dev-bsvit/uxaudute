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
        {/* Описание экрана */}
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📱 Описание экрана
            <Badge variant="outline" className={getConfidenceColor(analysis.screenDescription.confidence)}>
              Уверенность: {analysis.screenDescription.confidence}%
            </Badge>
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
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Обоснование уверенности</h4>
            <p className="text-gray-600">{analysis.screenDescription.confidenceReason}</p>
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
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {analysis.behavior.userScenarios}
                </p>
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
                <ol className="space-y-2">
                  {analysis.behavior.frictionPoints.map((point, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-orange-800 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{point}</span>
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
                  <div>
                    <span className="font-medium text-green-600">Рекомендация:</span>{' '}
                    <span className="text-gray-700">{problem.recommendation}</span>
                  </div>
                  <div>
                    <span className="font-medium text-purple-600">Ожидаемый эффект:</span>{' '}
                    <span className="text-gray-700">{problem.expectedEffect}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Self-Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✅ Проверка качества анализа
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Чек-лист</h4>
              <div className="space-y-2">
                {Object.entries(analysis.selfCheck.checklist).map(([key, value]) => (
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
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Уверенность по блокам</h4>
              <div className="space-y-2">
                {Object.entries(analysis.selfCheck.confidence).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {key === 'analysis' && 'Анализ'}
                      {key === 'survey' && 'Опрос'}
                      {key === 'recommendations' && 'Рекомендации'}
                    </span>
                    <span className={`font-medium ${getConfidenceColor(value)}`}>
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
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-2">Информация об анализе</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Версия:</span> {analysis.metadata.version}
            </div>
            <div>
              <span className="font-medium">Модель:</span> {analysis.metadata.model}
            </div>
            <div>
              <span className="font-medium">Время:</span> {new Date(analysis.metadata.timestamp).toLocaleString('ru-RU')}
            </div>
          </div>
        </div>
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
