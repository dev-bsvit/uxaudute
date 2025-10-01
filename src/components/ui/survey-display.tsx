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
  // Простые переводы без системы
  const t = (key: string) => {
    const translations: Record<string, string> = {
      'analysis-results.questions': 'вопросов',
      'analysis-results.mostLikely': 'Наиболее вероятно',
      'analysis-results.lessLikely': 'Менее вероятно'
    }
    return translations[key] || key
  }
  
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


  return (
    <div className="space-y-6">
      {/* Общая статистика */}
      <div className="flex items-center justify-between">
        <Badge variant="outline">
          {survey.summary?.totalQuestions || survey.questions?.length || 0} {t('analysis-results.questions')}
        </Badge>
      </div>

      {/* Вопросы */}
      <div className="space-y-4">
        {(survey.questions || []).map((question, index) => {
          // Поддержка двух форматов: объект с полями или просто строка
          if (typeof question === 'string') {
            // Простой формат - только строка вопроса
            return (
              <div key={index} className="space-y-3">
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    {index + 1}. {question}
                  </h4>
                </div>
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
                  Вопрос для UX исследования
                </div>
              </div>
            )
          }
          
          // Полный формат - объект с опциями и оценками
          return (
            <div key={question.id || index} className="space-y-3">
              <div className="flex items-start justify-between">
                <h4 className="text-lg font-medium text-gray-900">
                  {question.id || (index + 1)}. {question.question}
                </h4>
                <div className="flex items-center gap-2">
                  {showCategories && question.category && (
                    <Badge className={getCategoryColor(question.category)}>
                      {question.category}
                    </Badge>
                  )}
                </div>
              </div>
              
              {showPrinciples && question.principle && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Принцип:</span> {question.principle}
                </div>
              )}
              
              {question.explanation && (
                <div className="text-sm text-gray-500">
                  {question.explanation}
                </div>
              )}
              
              {question.options && question.scores && (
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
                                {isHighest ? t('analysis-results.mostLikely') : t('analysis-results.lessLikely')}
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
              )}
            </div>
          )
        })}
      </div>

    </div>
  )
}



