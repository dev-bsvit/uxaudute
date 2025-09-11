import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HypothesisResponse, Hypothesis } from '@/lib/analysis-types'
import { Download, RefreshCw, Lightbulb, Target, CheckCircle } from 'lucide-react'

interface HypothesesDisplayProps {
  data: HypothesisResponse | null
  isLoading?: boolean
  onGenerate?: () => void
}

export const HypothesesDisplay: React.FC<HypothesesDisplayProps> = ({ 
  data, 
  isLoading = false, 
  onGenerate 
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Генерируем гипотезы...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">Гипотезы не сгенерированы</h3>
          <p className="text-slate-600 mb-6">
            Нажмите кнопку ниже, чтобы сгенерировать гипотезы на основе результатов UX анализа
          </p>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <Lightbulb className="w-4 h-4 mr-2" />
              Получить гипотезы
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'bg-green-100 text-green-800'
    if (confidence >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Гипотезы</h2>
          <p className="text-slate-600">
            Сгенерировано {data.hypotheses.length} гипотез
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Экспорт
          </Button>
          {onGenerate && (
            <Button onClick={onGenerate} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          )}
        </div>
      </div>

      {/* Список гипотез */}
      <div className="space-y-4">
        {data.hypotheses.map((hypothesis, index) => (
          <Card key={hypothesis.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    Гипотеза #{index + 1}: {hypothesis.title}
                  </CardTitle>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge className={getPriorityColor(hypothesis.priority)}>
                      Приоритет: {hypothesis.priority}
                    </Badge>
                    <Badge className={getEffortColor(hypothesis.effort)}>
                      Усилия: {hypothesis.effort}
                    </Badge>
                    <Badge className={getConfidenceColor(hypothesis.confidence)}>
                      Уверенность: {hypothesis.confidence}/10
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Описание и проблема */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Описание
                  </h4>
                  <p className="text-slate-700">{hypothesis.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Проблема</h4>
                  <p className="text-slate-700">{hypothesis.problem}</p>
                </div>
              </div>

              {/* Решение и ожидаемый эффект */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Предлагаемое решение</h4>
                  <p className="text-slate-700">{hypothesis.solution}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Ожидаемый эффект</h4>
                  <p className="text-slate-700">{hypothesis.expected_impact}</p>
                </div>
              </div>

              {/* Метод валидации */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Метод валидации
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-slate-700">{hypothesis.validation_method}</p>
                </div>
              </div>

              {/* Метрики */}
              {hypothesis.metrics && hypothesis.metrics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Метрики для отслеживания</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {hypothesis.metrics.map((metric, metricIndex) => (
                      <div key={metricIndex} className="flex items-center bg-slate-50 p-3 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-slate-700">{metric}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Предположения */}
              {hypothesis.assumptions && hypothesis.assumptions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">Предположения</h4>
                  <ul className="space-y-2">
                    {hypothesis.assumptions.map((assumption, assumptionIndex) => (
                      <li key={assumptionIndex} className="flex items-start">
                        <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-slate-700">{assumption}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Следующие шаги */}
      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Следующие шаги</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.next_steps.map((step, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-slate-700">{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

