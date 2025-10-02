import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, Target, Zap, AlertCircle, 
  Lightbulb, Share2, RefreshCw, ArrowUp, ArrowDown 
} from 'lucide-react'
import { BusinessAnalyticsResponse } from '@/lib/analysis-types'
import { useTranslation } from '@/hooks/use-translation'

interface BusinessAnalyticsModernProps {
  data: BusinessAnalyticsResponse | null
  isLoading?: boolean
  onGenerate?: () => void
  onShare?: () => void
  publicUrl?: string | null
  publicUrlLoading?: boolean
}

export const BusinessAnalyticsModern: React.FC<BusinessAnalyticsModernProps> = ({
  data,
  isLoading = false,
  onGenerate,
  onShare,
  publicUrl,
  publicUrlLoading = false
}) => {
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>{t('business.loading')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold">{t('business.notGenerated')}</h3>
            <p className="text-gray-600 max-w-md">{t('business.notGeneratedDesc')}</p>
            {onGenerate && (
              <Button onClick={onGenerate} className="w-full max-w-xs">
                <BarChart3 className="w-4 h-4 mr-2" />
                {t('business.generateButton')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getSeverityColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            {t('business.title')}
          </h2>
          <p className="text-gray-600 mt-1">{t('business.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          {onShare && (
            !publicUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShare}
                disabled={publicUrlLoading}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {publicUrlLoading ? t('business.creating') : t('business.share')}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('business.copyLink')}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Industry Analysis */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {t('business.industry.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-1">{t('business.industry.identified')}</p>
              <p className="text-lg font-semibold text-gray-900">{data.industry_analysis.identified_industry}</p>
            </div>
            {data.industry_analysis.key_metrics_framework && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('business.industry.framework')}</p>
                <p className="text-lg font-semibold text-gray-900">{data.industry_analysis.key_metrics_framework}</p>
              </div>
            )}
            {data.industry_analysis.industry_benchmarks && (
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('business.industry.benchmarks')}</p>
                <p className="text-sm text-gray-700">{data.industry_analysis.industry_benchmarks}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {data.summary_table && (
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('business.summary.totalHypotheses')}</p>
                  <p className="text-2xl font-bold text-blue-600">{data.summary_table.total_hypotheses}</p>
                </div>
                <Lightbulb className="w-8 h-8 text-blue-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Top ICE Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {data.summary_table.top_3_ice_scores[0]?.toFixed(1) || 'N/A'}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('business.summary.conversionLift')}</p>
                  <p className="text-2xl font-bold text-orange-600">{data.summary_table.expected_conversion_lift}</p>
                </div>
                <ArrowUp className="w-8 h-8 text-orange-500 opacity-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t('business.summary.timeline')}</p>
                  <p className="text-2xl font-bold text-purple-600">{data.summary_table.implementation_timeline}</p>
                </div>
                <Target className="w-8 h-8 text-purple-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPI Table */}
      {data.kpi_table && data.kpi_table.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              {t('business.kpi.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-semibold text-gray-700">{t('business.kpi.metric')}</th>
                    <th className="pb-3 font-semibold text-gray-700">{t('business.kpi.current')}</th>
                    <th className="pb-3 font-semibold text-gray-700">{t('business.kpi.benchmark')}</th>
                    <th className="pb-3 font-semibold text-gray-700">{t('business.kpi.improvement')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.kpi_table.map((kpi, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="py-3 font-medium text-gray-900">{kpi.metric}</td>
                      <td className="py-3 text-gray-700">{kpi.current_value}</td>
                      <td className="py-3 text-gray-700">{kpi.industry_benchmark}</td>
                      <td className="py-3">
                        <Badge className="bg-green-100 text-green-800">
                          {kpi.potential_improvement}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hypotheses */}
      {data.hypotheses && data.hypotheses.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5" />
              {t('business.hypotheses.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {data.hypotheses
                .sort((a, b) => b.ice_score - a.ice_score)
                .map((hyp) => (
                  <div 
                    key={hyp.id} 
                    className={`p-4 rounded-lg border-2 ${hyp.is_top_3 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-sm font-bold">
                            #{hyp.priority_rank}
                          </Badge>
                          {hyp.is_top_3 && (
                            <Badge className="bg-yellow-500 text-white">TOP-3</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-900 mb-2">{hyp.hypothesis}</h4>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <Badge className="bg-blue-600 text-white text-lg px-3 py-1">
                          ICE: {hyp.ice_score.toFixed(1)}
                        </Badge>
                        {hyp.rice_score && (
                          <Badge className="bg-purple-600 text-white text-sm">
                            RICE: {hyp.rice_score.toFixed(0)}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Impact:</span>
                        <Badge variant="outline">{hyp.impact}/10</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Confidence:</span>
                        <Badge variant="outline">{hyp.confidence}/10</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Effort:</span>
                        <Badge variant="outline">{hyp.effort}/10</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <p><span className="font-semibold text-gray-700">Problem:</span> {hyp.problem}</p>
                      <p><span className="font-semibold text-gray-700">Solution:</span> {hyp.solution}</p>
                      <p className="text-green-700">
                        <span className="font-semibold">Expected:</span> {hyp.expected_outcome}
                      </p>
                    </div>

                    {hyp.is_top_3 && (
                      <div className="mt-4 pt-4 border-t space-y-3">
                        {hyp.user_story && (
                          <div className="bg-blue-50 p-3 rounded">
                            <p className="text-sm font-semibold text-blue-900 mb-1">User Story:</p>
                            <p className="text-sm text-blue-800 italic">"{hyp.user_story}"</p>
                          </div>
                        )}
                        {hyp.ux_patterns && (
                          <div className="bg-purple-50 p-3 rounded">
                            <p className="text-sm font-semibold text-purple-900 mb-1">UX Patterns:</p>
                            <p className="text-sm text-purple-800">{hyp.ux_patterns}</p>
                          </div>
                        )}
                        {hyp.test_plan && (
                          <div className="bg-green-50 p-3 rounded">
                            <p className="text-sm font-semibold text-green-900 mb-2">Test Plan:</p>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="font-medium">Method:</span> {hyp.test_plan.method}
                              </div>
                              <div>
                                <span className="font-medium">Duration:</span> {hyp.test_plan.duration}
                              </div>
                              <div>
                                <span className="font-medium">Sample:</span> {hyp.test_plan.sample_size}
                              </div>
                              <div>
                                <span className="font-medium">Success:</span> {hyp.test_plan.success_criteria}
                              </div>
                            </div>
                            {hyp.test_plan.delta_metrics && (
                              <div className="mt-2">
                                <span className="font-medium">Δ-metrics:</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {hyp.test_plan.delta_metrics.map((metric, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {metric}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Barriers & Risks - Compact Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Conversion Barriers */}
        {data.conversion_barriers && data.conversion_barriers.length > 0 && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5" />
                {t('business.barriers.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {data.conversion_barriers.map((barrier, index) => (
                  <div key={index} className="p-3 border-l-4 border-red-400 bg-red-50 rounded-r">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">{barrier.barrier}</p>
                      {(barrier.severity || barrier.impact_level) && (
                        <Badge className={getSeverityColor((barrier.severity || barrier.impact_level) as 'high' | 'medium' | 'low')}>
                          {barrier.severity || barrier.impact_level}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-700 mb-1">{barrier.affected_stage || barrier.affected_users}</p>
                    <p className="text-xs text-gray-600">{barrier.recommended_fix || barrier.solution}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Business Risks */}
        {data.business_risks && data.business_risks.length > 0 && (
          <Card>
            <CardHeader className="bg-gradient-to-r from-orange-50 to-yellow-50">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="w-5 h-5" />
                {t('business.risks.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {data.business_risks.map((risk, index) => (
                  <div key={index} className="p-3 border-l-4 border-orange-400 bg-orange-50 rounded-r">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm text-gray-900">{risk.risk}</p>
                      <Badge className={getSeverityColor(risk.severity)}>
                        {risk.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">{risk.mitigation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Missed Opportunities */}
      {data.missed_opportunities && data.missed_opportunities.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-50">
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              {t('business.opportunities.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="grid md:grid-cols-2 gap-4">
              {data.missed_opportunities.map((opp, index) => (
                <div key={index} className="p-4 border border-green-200 rounded-lg bg-green-50">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{opp.opportunity}</h4>
                    <Badge className="bg-green-600 text-white">
                      {opp.potential_value || opp.potential_impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{opp.how_to_capture || opp.implementation}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Effort:</span>
                    <Badge variant="outline" className="text-xs">{opp.effort_required}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              {t('business.nextSteps.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ol className="space-y-3">
              {data.next_steps.map((step, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 pt-1">{step}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
