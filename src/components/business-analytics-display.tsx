import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BusinessAnalyticsResponse } from '@/lib/analysis-types'
import { RefreshCw, TrendingUp, DollarSign, Users, Target, BarChart3 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

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
  const { t } = useTranslation()

  const severityLabels = useMemo(
    () => ({
      high: t('analysis.business.labels.high'),
      medium: t('analysis.business.labels.medium'),
      low: t('analysis.business.labels.low')
    }),
    [t]
  )

  const priorityLabels = useMemo(
    () => ({
      high: t('analysis.business.labels.priorityHigh'),
      medium: t('analysis.business.labels.priorityMedium'),
      low: t('analysis.business.labels.priorityLow')
    }),
    [t]
  )

  const getSeverityLabel = (key?: string | null) => {
    if (!key) return key || t('analysis.business.labels.notAvailable')
    return severityLabels[key as keyof typeof severityLabels] || key
  }

  const getPriorityLabel = (key?: string | null) => {
    if (!key) return undefined
    return priorityLabels[key as keyof typeof priorityLabels] || key
  }

  const getImpactColor = (level?: string | null) => {
    switch (level) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>{t('analysis.business.loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">{t('analysis.business.empty.title')}</h3>
            <p className="text-slate-600">
              {t('analysis.business.empty.description')}
            </p>
          </div>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t('analysis.business.empty.action')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">{t('analysis.business.title')}</h2>
        <p className="text-slate-600">{t('analysis.business.subtitle')}</p>
      </div>

      {data.industry_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {t('analysis.business.sections.industry.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">
                  {t('analysis.business.sections.industry.industry')}
                </h4>
                <p className="text-slate-700">{data.industry_analysis.identified_industry}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">
                  {t('analysis.business.sections.industry.standards')}
                </h4>
                <p className="text-slate-700">{data.industry_analysis.industry_standards}</p>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2">
                  {t('analysis.business.sections.industry.context')}
                </h4>
                <p className="text-slate-700">{data.industry_analysis.market_context}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.business_metrics?.conversion_funnel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('analysis.business.sections.funnel.title')}
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
      )}

      {data.business_metrics?.key_kpis && data.business_metrics.key_kpis.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('analysis.business.sections.kpis.title')}
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
                      <span className="text-slate-600">{t('analysis.business.sections.kpis.current')}</span>
                      <p className="font-medium">{kpi.current_value}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">{t('analysis.business.sections.kpis.benchmark')}</span>
                      <p className="font-medium">{kpi.benchmark}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{kpi.impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.business_metrics?.revenue_impact && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t('analysis.business.sections.revenue.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <h4 className="text-sm text-slate-600 mb-1">{t('analysis.business.sections.revenue.current')}</h4>
                <p className="text-2xl font-bold text-slate-900">
                  {data.business_metrics.revenue_impact.current_monthly_revenue || t('analysis.business.labels.notAvailable')}
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-sm text-slate-600 mb-1">{t('analysis.business.sections.revenue.potential')}</h4>
                <p className="text-2xl font-bold text-green-600">
                  {data.business_metrics.revenue_impact.potential_increase || t('analysis.business.labels.notAvailable')}
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-sm text-slate-600 mb-1">{t('analysis.business.sections.revenue.cost')}</h4>
                <p className="text-2xl font-bold text-red-600">
                  {data.business_metrics.revenue_impact.cost_of_issues || t('analysis.business.labels.notAvailable')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {data.business_risks && data.business_risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('analysis.business.sections.businessRisks')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.business_risks.map((risk, index) => (
                <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{risk.risk}</h4>
                    <div className="flex gap-2">
                      {risk.severity && (
                        <Badge className={getImpactColor(risk.severity)}>
                          {getSeverityLabel(risk.severity)}
                        </Badge>
                      )}
                      {(risk.affected_users || risk.probability) && (
                        <Badge variant="outline">
                          {risk.affected_users || risk.probability}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    {(risk.business_consequences || risk.probability) && (
                      <div>
                        <span className="text-slate-600">
                          {risk.business_consequences
                            ? t('analysis.business.labels.businessConsequences')
                            : t('analysis.business.labels.probability')}
                        </span>
                        <p className="font-medium text-red-600">
                          {risk.business_consequences || risk.probability}
                        </p>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.mitigation')}</span>
                      <p className="font-medium">{risk.mitigation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.missed_opportunities && data.missed_opportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('analysis.business.sections.missedOpportunities')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.missed_opportunities.map((opportunity, index) => (
                <div key={index} className="bg-slate-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{opportunity.opportunity}</h4>
                    <div className="flex gap-2">
                      {opportunity.priority && (
                        <Badge className={getPriorityColor(opportunity.priority)}>
                          {getPriorityLabel(opportunity.priority)}
                        </Badge>
                      )}
                      {opportunity.effort_required && (
                        <Badge className={getImpactColor(opportunity.effort_required)}>
                          {getSeverityLabel(opportunity.effort_required)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.potentialImpact')}</span>
                      <p className="font-medium text-green-600">
                        {opportunity.potential_impact || opportunity.potential_value || t('analysis.business.labels.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.implementation')}</span>
                      <p className="font-medium">
                        {opportunity.implementation || opportunity.how_to_capture || t('analysis.business.labels.notAvailable')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.conversion_barriers && data.conversion_barriers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analysis.business.sections.conversionBarriers')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.conversion_barriers.map((barrier, index) => (
                <div key={index} className="border-l-4 border-red-200 pl-4 py-2">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-slate-900">{barrier.barrier}</h4>
                    <div className="flex gap-2">
                      {(barrier.impact_level || barrier.severity) && (
                        <Badge className={getImpactColor(barrier.impact_level || barrier.severity)}>
                          {getSeverityLabel(barrier.impact_level || barrier.severity)}
                        </Badge>
                      )}
                      {(barrier.affected_users || barrier.affected_stage) && (
                        <Badge variant="outline">
                          {barrier.affected_users || barrier.affected_stage}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.businessCost')}</span>
                      <p className="font-medium text-red-600">
                        {barrier.business_cost || barrier.cost_to_business || t('analysis.business.labels.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.solution')}</span>
                      <p className="font-medium">
                        {barrier.solution || barrier.recommended_fix || t('analysis.business.labels.notAvailable')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.user_behavior_insights && data.user_behavior_insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t('analysis.business.sections.userInsights')}
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
                      <span className="text-slate-600">{t('analysis.business.labels.businessImpact')}</span>
                      <p className="font-medium">{insight.business_impact}</p>
                    </div>
                    <div>
                      <span className="text-slate-600">{t('analysis.business.labels.recommendation')}</span>
                      <p className="font-medium">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analysis.business.sections.nextSteps')}</CardTitle>
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
