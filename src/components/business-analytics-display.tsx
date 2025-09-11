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
              <h4 className="font-semibold text-slate-900 mb-2">Соответствие отраслевым стандартам</h4>
              <p className="text-slate-700">{data.industry_analysis.industry_standards}</p>
            </div>
            <div>
              <h4 className="font-semibold text-slate-900 mb-2">Контекст рынка</h4>
              <p className="text-slate-700">{data.industry_analysis.market_context}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Конверсионная воронка */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Конверсионная воронка
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {Object.entries(data.business_metrics.conversion_funnel).map(([stage, description], index) => (
              <div key={stage} className="text-center">
                <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-2">
                  {index + 1}
                </div>
                <h4 className="font-semibold text-slate-900 mb-2 capitalize">{stage}</h4>
                <p className="text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Ключевые KPI */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Ключевые KPI
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {data.business_metrics.key_kpis.map((kpi, index) => (
              <div key={index} className="bg-slate-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{kpi.metric}</h4>
                  <Badge className="bg-green-100 text-green-800">
                    {kpi.potential_improvement}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600">Текущее:</span>
                    <p className="font-medium">{kpi.current_value}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Бенчмарк:</span>
                    <p className="font-medium">{kpi.benchmark}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-700 mt-2">{kpi.impact}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Влияние на выручку */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="w-5 h-5 mr-2" />
            Влияние на выручку
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <h4 className="text-sm text-slate-600 mb-1">Текущие показатели</h4>
              <p className="text-2xl font-bold text-slate-900">{data.business_metrics.revenue_impact.current_performance}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm text-slate-600 mb-1">Потенциальный рост</h4>
              <p className="text-2xl font-bold text-green-600">{data.business_metrics.revenue_impact.potential_increase}</p>
            </div>
            <div className="text-center">
              <h4 className="text-sm text-slate-600 mb-1">Стоимость проблем</h4>
              <p className="text-2xl font-bold text-red-600">{data.business_metrics.revenue_impact.cost_of_issues}</p>
            </div>
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
                      <Badge variant="outline">
                        {risk.affected_users}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Бизнес-последствия:</span>
                      <p className="font-medium text-red-600">{risk.business_consequences}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Рекомендации по снижению:</span>
                      <p className="font-medium">{risk.mitigation}</p>
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
                      <Badge className={getImpactColor(opportunity.effort_required)}>
                        {opportunity.effort_required}
                      </Badge>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">Потенциальное влияние:</span>
                      <p className="font-medium text-green-600">{opportunity.potential_impact}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">Как реализовать:</span>
                      <p className="font-medium">{opportunity.implementation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Барьеры конверсии */}
      <Card>
        <CardHeader>
          <CardTitle>Барьеры конверсии</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.conversion_barriers.map((barrier, index) => (
              <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-slate-900">{barrier.barrier}</h4>
                  <div className="flex gap-2">
                    <Badge className={getImpactColor(barrier.impact_level)}>
                      {barrier.impact_level}
                    </Badge>
                    <Badge variant="outline">
                      {barrier.affected_users}
                    </Badge>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Бизнес-стоимость:</span>
                    <p className="font-medium text-red-600">{barrier.business_cost}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Решение:</span>
                    <p className="font-medium">{barrier.solution}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>


      {/* Инсайты поведения пользователей */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Инсайты поведения пользователей
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.user_behavior_insights.map((insight, index) => (
              <div key={index} className="border-l-4 border-blue-200 pl-4 py-2">
                <h4 className="font-semibold text-slate-900 mb-2">{insight.pattern}</h4>
                <p className="text-slate-700 mb-2">{insight.description}</p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Бизнес-влияние:</span>
                    <p className="font-medium">{insight.business_impact}</p>
                  </div>
                  <div>
                    <span className="text-slate-600">Рекомендация:</span>
                    <p className="font-medium">{insight.recommendation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

