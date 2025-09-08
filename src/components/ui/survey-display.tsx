'use client'

import React from 'react'
import { UXQuestion, UXSurvey } from '@/lib/analysis-types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface SurveyDisplayProps {
  survey: UXSurvey
  showCategories?: boolean
  showPrinciples?: boolean
}

export function SurveyDisplay({ 
  survey, 
  showCategories = true, 
  showPrinciples = true 
}: SurveyDisplayProps) {
  const getCategoryColor = (category: string) => {
    const colors = {
      clarity: 'bg-blue-100 text-blue-800',
      usability: 'bg-green-100 text-green-800',
      accessibility: 'bg-purple-100 text-purple-800',
      conversion: 'bg-orange-100 text-orange-800',
      navigation: 'bg-cyan-100 text-cyan-800',
      content: 'bg-pink-100 text-pink-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600'
    if (confidence >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 80) return 'Высокая'
    if (confidence >= 60) return 'Средняя'
    return 'Низкая'
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и общая статистика */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">UX-опрос</h3>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Уверенность:</span>{' '}
            <span className={getConfidenceColor(survey.overallConfidence)}>
              {survey.overallConfidence}% ({getConfidenceLabel(survey.overallConfidence)})
            </span>
          </div>
          <Badge variant="outline">
            {survey.summary.totalQuestions} вопросов
          </Badge>
        </div>
      </div>

      {/* Вопросы */}
      <div className="space-y-4">
        {survey.questions.map((question, index) => (
          <Card key={question.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg font-medium text-gray-900">
                  {question.id}. {question.question}
                </CardTitle>
                <div className="flex items-center gap-2">
                  {showCategories && (
                    <Badge className={getCategoryColor(question.category)}>
                      {question.category}
                    </Badge>
                  )}
                  <div className="text-sm text-gray-500">
                    Уверенность: <span className={getConfidenceColor(question.confidence)}>
                      {question.confidence}%
                    </span>
                  </div>
                </div>
              </div>
              
              {showPrinciples && question.principle && (
                <div className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Принцип:</span> {question.principle}
                </div>
              )}
              
              {question.explanation && (
                <div className="mt-1 text-sm text-gray-500">
                  {question.explanation}
                </div>
              )}
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="space-y-3">
                {question.options.map((option, optionIndex) => {
                  const score = question.scores[optionIndex]
                  const isHighest = score === Math.max(...question.scores)
                  
                  return (
                    <div key={optionIndex} className="relative">
                      <div className={`
                        flex items-center justify-between p-4 rounded-lg border-2 transition-all
                        ${isHighest 
                          ? 'border-purple-300 bg-purple-50 shadow-sm' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                        }
                      `}>
                        <div className="flex items-center gap-3">
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center text-sm font-medium
                            ${isHighest 
                              ? 'bg-purple-500 text-white' 
                              : 'bg-gray-200 text-gray-600'
                            }
                          `}>
                            {String.fromCharCode(65 + optionIndex)}
                          </div>
                          <span className={`
                            font-medium
                            ${isHighest ? 'text-purple-900' : 'text-gray-900'}
                          `}>
                            {option}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className={`
                              text-2xl font-bold
                              ${isHighest ? 'text-purple-600' : 'text-gray-600'}
                            `}>
                              {score}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {isHighest ? 'Наиболее вероятно' : 'Менее вероятно'}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Прогресс-бар */}
                      <div className="mt-2">
                        <Progress 
                          value={score} 
                          className="h-2"
                          style={{
                            backgroundColor: isHighest ? '#e0e7ff' : '#f3f4f6'
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Сводка */}
      {survey.summary && (
        <Card className="bg-gray-50">
          <CardContent className="pt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Сводка опроса</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {survey.summary.totalQuestions}
                </div>
                <div className="text-sm text-gray-600">Всего вопросов</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {survey.summary.averageConfidence}%
                </div>
                <div className="text-sm text-gray-600">Средняя уверенность</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {survey.summary.criticalIssues}
                </div>
                <div className="text-sm text-gray-600">Критических проблем</div>
              </div>
            </div>
            
            {survey.summary.recommendations.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-900 mb-2">Рекомендации:</h5>
                <ul className="space-y-1">
                  {survey.summary.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

