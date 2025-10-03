import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { HypothesisResponse, Hypothesis } from '@/lib/analysis-types'
import { Download, RefreshCw, Lightbulb, Target, CheckCircle, Share2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface HypothesesDisplayProps {
  data: HypothesisResponse | null
  isLoading?: boolean
  onGenerate?: () => void
  onShare?: () => void
  publicUrl?: string | null
  publicUrlLoading?: boolean
}

export const HypothesesDisplay: React.FC<HypothesesDisplayProps> = ({
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
            <span>{t("hypotheses.generating")}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">{t("hypotheses.notGenerated")}</h3>
          <p className="text-slate-600 mb-6">
            {t("hypotheses.notGeneratedDescription")}
          </p>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <Lightbulb className="w-4 h-4 mr-2" />
              {t("hypotheses.generateButton")}
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
          <h2 className="text-2xl font-bold text-slate-900">{t("hypotheses.title")}</h2>
          <p className="text-slate-600">
            {t("hypotheses.generated", { count: (data.hypotheses?.length || 0).toString() })}
          </p>
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
                {publicUrlLoading ? t("hypotheses.creating") : t("hypotheses.share")}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t("hypotheses.copyLink")}
              </Button>
            )
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t("hypotheses.export")}
          </Button>
          {onGenerate && (
            <Button onClick={onGenerate} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("hypotheses.refresh")}
            </Button>
          )}
        </div>
      </div>

      {/* Анализ KPI */}
      {data.kpi_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="w-5 h-5 mr-2" />
              {t("hypotheses.kpiAnalysis.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Текущие метрики */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">{ t("hypotheses.kpiAnalysis.currentMetrics")}</h4>
                <div className="space-y-2">
                  {data.kpi_analysis.current_metrics.map((metric, index) => (
                    <div key={index} className="bg-slate-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-slate-900">{metric.metric}</span>
                        <span className="text-sm text-slate-600">{metric.current_value}</span>
                      </div>
                      <div className="text-xs text-slate-600">
                        {t("hypotheses.kpiAnalysis.target")}: {metric.target_value} | {t("hypotheses.kpiAnalysis.benchmark")}: {metric.industry_benchmark}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Болевые точки */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">{ t("hypotheses.kpiAnalysis.painPoints")}</h4>
                <div className="space-y-2">
                  {data.kpi_analysis.pain_points.map((point, index) => (
                    <div key={index} className="border-l-4 border-red-200 pl-3 py-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {point.type}
                        </Badge>
                        <span className="text-xs text-slate-600">{point.frequency}</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-1">{point.description}</p>
                      <p className="text-xs text-slate-600">{point.impact}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ICE Рейтинг */}
      {data.ice_ranking && data.ice_ranking.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" />
              {t("hypotheses.iceRating.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">{t("hypotheses.iceRating.rank")}</th>
                    <th className="text-left py-2">{t("hypotheses.iceRating.hypothesis")}</th>
                    <th className="text-center py-2">{t("hypotheses.iceRating.ice")}</th>
                    <th className="text-center py-2">{t("hypotheses.iceRating.impact")}</th>
                    <th className="text-center py-2">{t("hypotheses.iceRating.confidence")}</th>
                    <th className="text-center py-2">{t("hypotheses.iceRating.effort")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ice_ranking.map((item) => {
                    const hypothesis = data.hypotheses.find(h => h.id === item.hypothesis_id)
                    return (
                      <tr key={item.rank} className="border-b">
                        <td className="py-2 font-medium">{item.rank}</td>
                        <td className="py-2">{hypothesis?.title || t("hypotheses.notFound")}</td>
                        <td className="py-2 text-center font-bold text-blue-600">{item.ice_score.toFixed(2)}</td>
                        <td className="py-2 text-center">{item.impact}</td>
                        <td className="py-2 text-center">{item.confidence}</td>
                        <td className="py-2 text-center">{item.effort}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Список гипотез */}
      <div className="space-y-4">
        {data.hypotheses?.map((hypothesis, index) => (
          <Card key={hypothesis.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2 text-yellow-500" />
                    {t("hypotheses.hypothesis.title")} #{index + 1}: {hypothesis.title}
                  </CardTitle>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <Badge className={getPriorityColor(hypothesis.priority)}>
                      {t("hypotheses.hypothesis.priority")}: {hypothesis.priority}
                    </Badge>
                    <Badge className={getEffortColor(hypothesis.effort_days <= 3 ? 'low' : hypothesis.effort_days <= 7 ? 'medium' : 'high')}>
                      {t("hypotheses.hypothesis.effort")}: {t("hypotheses.hypothesis.effortDays", { days: hypothesis.effort_days.toString() })}
                    </Badge>
                    <Badge className={getConfidenceColor(hypothesis.confidence_score * 10)}>
                      {t("hypotheses.hypothesis.confidenceScore")}: {Math.round(hypothesis.confidence_score * 10)}/10
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-800">
                      ICE: {hypothesis.ice_score.ice_total.toFixed(2)}
                    </Badge>
                    {hypothesis.is_top_3 && (
                      <Badge className="bg-green-100 text-green-800">
                        {t("hypotheses.hypothesis.top3")}
                      </Badge>
                    )}
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
                    {t("hypotheses.hypothesis.description")}
                  </h4>
                  <p className="text-slate-700">{hypothesis.description}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{ t("hypotheses.hypothesis.problem")}</h4>
                  <p className="text-slate-700">{hypothesis.problem}</p>
                </div>
              </div>

              {/* Решение и ожидаемый эффект */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{ t("hypotheses.hypothesis.proposedSolution")}</h4>
                  <p className="text-slate-700">{hypothesis.solution}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{t("hypotheses.hypothesis.iceScore")}</h4>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-blue-600">{hypothesis.ice_score.impact}</div>
                      <div className="text-slate-600">{t("hypotheses.iceRating.impact")}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-green-600">{hypothesis.ice_score.confidence}</div>
                      <div className="text-slate-600">{t("hypotheses.iceRating.confidence")}</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-orange-600">{hypothesis.ice_score.effort}</div>
                      <div className="text-slate-600">{t("hypotheses.iceRating.effort")}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Story и UX Patterns для топ-3 */}
              {hypothesis.is_top_3 && (
                <div className="grid md:grid-cols-2 gap-4">
                  {hypothesis.user_story && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">{t("hypotheses.hypothesis.userStory")}</h4>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <p className="text-slate-700 italic">"{hypothesis.user_story}"</p>
                      </div>
                    </div>
                  )}
                  {hypothesis.ux_patterns && (
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">{ t("hypotheses.hypothesis.uxPatterns")}</h4>
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-slate-700">{hypothesis.ux_patterns}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* План валидации */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t("hypotheses.hypothesis.validationPlan")}
                </h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium text-slate-600">{t("hypotheses.hypothesis.method")}:</span>
                      <p className="text-slate-700">{hypothesis.validation_plan.method}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">{t("hypotheses.hypothesis.duration")}:</span>
                      <p className="text-slate-700">{hypothesis.validation_plan.duration}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">{t("hypotheses.hypothesis.sampleSize")}:</span>
                      <p className="text-slate-700">{hypothesis.validation_plan.sample_size}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-slate-600">{t("hypotheses.hypothesis.deltaMetrics")}:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {hypothesis.validation_plan.delta_metrics.map((metric, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Метрики */}
              {hypothesis.metrics && hypothesis.metrics.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">{ t("hypotheses.hypothesis.trackingMetrics")}</h4>
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
                  <h4 className="font-semibold text-slate-900 mb-3">{ t("hypotheses.hypothesis.assumptions")}</h4>
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
            <CardTitle>{ t("hypotheses.nextSteps.title")}</CardTitle>
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

