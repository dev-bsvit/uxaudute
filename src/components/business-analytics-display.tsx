import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BusinessAnalyticsResponse } from '@/lib/analysis-types'
import { Download, RefreshCw, TrendingUp, DollarSign, Users, Target, BarChart3 } from 'lucide-react'

interface BusinessAnalyticsDisplayProps {
  data: BusinessAnalyticsResponse | null
  isLoading?: boolean
  onGenerate?: () => void
}

export const BusinessAnalyticsDisplay: React.FC<BusinessAnalyticsDisplayProps> = ({ 
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
            <span>Генерируем бизнес аналитику...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">Бизнес аналитика не сгенерирована</h3>
          <p className="text-slate-600 mb-6">
            Нажмите кнопку ниже, чтобы сгенерировать бизнес аналитику на основе результатов UX анализа
          </p>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              Получить бизнес аналитику
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
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
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Бизнес аналитика</h2>
          <p className="text-slate-600">
            Анализ бизнес-метрик и конверсионных возможностей
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

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Главный вывод</h4>
              <p className="text-slate-700">{data.executive_summary.main_finding}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Критический риск</h4>
              <p className="text-slate-700 text-red-600">{data.executive_summary.critical_risk}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Главная возможность</h4>
              <p className="text-slate-700 text-green-600">{data.executive_summary.top_opportunity}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Рекомендуемый фокус</h4>
              <p className="text-slate-700">{data.executive_summary.recommended_focus}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Анализ индустрии */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Анализ индустрии
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Определенная индустрия</h4>
              <p className="text-slate-700">{data.industry_analysis.identified_industry}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Бизнес-модель</h4>
              <p className="text-slate-700">{data.industry_analysis.identified_business_model}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">North Star Metric</h4>
              <p className="text-slate-700 font-medium">{data.industry_analysis.north_star_metric.metric}</p>
              <p className="text-slate-600 text-sm mt-1">{data.industry_analysis.north_star_metric.justification}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AARRR Воронка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            AARRR Воронка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {Object.entries(data.aarrr_funnel_analysis).map(([stage, data], index) => (
              <div key={stage} className="border-l-4 border-blue-200 pl-4 py-2">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                    {index + 1}
                  </div>
                  <h4 className="font-semibold text-slate-900 capitalize">{stage}</h4>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-slate-600 font-medium">Проблемы:</span>
                    <p className="text-slate-700">{data.issues}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Влияние на метрики:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {data.metrics_impact.map((metric, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">{metric}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Рекомендации:</span>
                    <p className="text-slate-700">{data.recommendations}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Бизнес-риски */}
      {data.business_risks && data.business_risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Бизнес-риски
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.business_risks.map((risk, index) => (
                <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{risk.risk}</h4>
                    <div className="flex gap-2">
                      <Badge className={getImpactColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                      <Badge variant="outline" className="bg-red-100 text-red-800">
                        {risk.potential_loss_percent}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600 font-medium">Цепочка рассуждений:</span>
                      <p className="text-slate-700">{risk.reasoning}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Рекомендации по снижению:</span>
                      <p className="text-slate-700">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Упущенные возможности */}
      {data.missed_opportunities && data.missed_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Упущенные возможности
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.missed_opportunities.map((opportunity, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{opportunity.opportunity}</h4>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(opportunity.priority)}>
                        {opportunity.priority}
                      </Badge>
                      <Badge className={getImpactColor(opportunity.impact_effort_matrix.impact)}>
                        Impact: {opportunity.impact_effort_matrix.impact}
                      </Badge>
                      <Badge className={getImpactColor(opportunity.impact_effort_matrix.effort)}>
                        Effort: {opportunity.impact_effort_matrix.effort}
                      </Badge>
                      <Badge variant="outline" className="bg-green-100 text-green-800">
                        {opportunity.potential_gain_percent}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600 font-medium">Обоснование:</span>
                      <p className="text-slate-700">{opportunity.reasoning}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Шаги реализации:</span>
                      <p className="text-slate-700">{opportunity.implementation_steps}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Стратегические рекомендации */}
      {data.strategic_recommendations && data.strategic_recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Стратегические рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.strategic_recommendations
                .sort((a, b) => a.priority - b.priority)
                .map((recommendation, index) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{recommendation.title}</h4>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        Приоритет: {recommendation.priority}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-slate-600 font-medium">Проблема:</span>
                      <p className="text-slate-700">{recommendation.problem_statement}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Предлагаемое решение:</span>
                      <p className="text-slate-700">{recommendation.proposed_solution}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Ожидаемый результат:</span>
                      <p className="text-slate-700 text-green-600">{recommendation.expected_outcome}</p>
                    </div>
                    <div>
                      <span className="text-slate-600 font-medium">Метрики для отслеживания:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {recommendation.metrics_to_track.map((metric, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">{metric}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

