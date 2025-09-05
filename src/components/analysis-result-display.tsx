'use client'

import React from 'react'
import { StructuredAnalysisResponse } from '@/lib/analysis-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { SurveyDisplay } from '@/components/ui/survey-display'

interface AnalysisResultDisplayProps {
  analysis?: StructuredAnalysisResponse
  showDetails?: boolean
}

export function AnalysisResultDisplay({ 
  analysis, 
  showDetails = true 
}: AnalysisResultDisplayProps) {
  if (!analysis) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Нет данных для отображения</p>
      </div>
    )
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
    <div className="space-y-8">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Результаты UX анализа
        </h2>
        <p className="text-gray-600">
          Анализ выполнен {new Date(analysis.metadata.timestamp).toLocaleDateString('ru-RU')}
        </p>
      </div>

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
      <SurveyDisplay survey={analysis.uxSurvey} />

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
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
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
          </CardContent>
        </Card>
      )}
    </div>
  )
}
