import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ABTestResponse } from '@/lib/analysis-types'
import { Download, RefreshCw, Share2 } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

interface ABTestDisplayProps {
  data: ABTestResponse | null
  isLoading?: boolean
  onGenerate?: () => void
  onShare?: () => void
  publicUrl?: string | null
  publicUrlLoading?: boolean
}

export const ABTestDisplay: React.FC<ABTestDisplayProps> = ({
  data,
  isLoading = false,
  onGenerate,
  onShare,
  publicUrl,
  publicUrlLoading = false
}) => {
  const { t } = useTranslation()

  const categoryLabels = useMemo(
    () => ({
      design: t('analysis.abTest.tasks.design'),
      backend: t('analysis.abTest.tasks.backend'),
      frontend: t('analysis.abTest.tasks.frontend'),
      analytics: t('analysis.abTest.tasks.analytics')
    }),
    [t]
  )

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return t('analysis.abTest.scoreLabels.high')
    if (score >= 6) return t('analysis.abTest.scoreLabels.medium')
    return t('analysis.abTest.scoreLabels.low')
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span>{t('analysis.abTest.loading')}</span>
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
            <h3 className="text-lg font-semibold mb-2">{t('analysis.abTest.empty.title')}</h3>
            <p className="text-slate-600">
              {t('analysis.abTest.empty.description')}
            </p>
          </div>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('analysis.abTest.empty.action')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('analysis.abTest.title')}</h2>
          <p className="text-slate-600">
            {t('analysis.abTest.generatedCount', { count: (data.ab_tests?.length || 0).toString() })}
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
                {publicUrlLoading
                  ? t('analysis.abTest.actions.creatingLink')
                  : t('analysis.abTest.actions.share')}
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('analysis.abTest.actions.copyLink')}
              </Button>
            )
          )}

          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('analysis.abTest.actions.export')}
          </Button>

          {onGenerate && (
            <Button onClick={onGenerate} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('analysis.abTest.actions.refresh')}
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {data.ab_tests?.map((test, index) => {
          const categoryLabel = (category: string) =>
            categoryLabels[category as keyof typeof categoryLabels] || category

          return (
            <Card key={test.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">
                      {t('analysis.abTest.testTitle', { index: (index + 1).toString(), title: test.problem })}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge className={getScoreColor(test.impact_score)}>
                        {t('analysis.abTest.badges.impact', {
                          score: test.impact_score.toString(),
                          label: getScoreLabel(test.impact_score)
                        })}
                      </Badge>
                      <Badge className={getScoreColor(test.confidence_score)}>
                        {t('analysis.abTest.badges.confidence', {
                          score: test.confidence_score.toString(),
                          label: getScoreLabel(test.confidence_score)
                        })}
                      </Badge>
                      <Badge className={getScoreColor(test.ease_score)}>
                        {t('analysis.abTest.badges.ease', {
                          score: test.ease_score.toString(),
                          label: getScoreLabel(test.ease_score)
                        })}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {t('analysis.abTest.sections.hypothesis')}
                    </h4>
                    <p className="text-slate-700">{test.hypothesis}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {t('analysis.abTest.sections.solution')}
                    </h4>
                    <p className="text-slate-700">{test.solution}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {t('analysis.abTest.sections.targetMetrics')}
                  </h4>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <span className="text-sm text-slate-600">
                          {t('analysis.abTest.sections.primaryMetric')}
                        </span>
                        <p className="font-medium">{test.target_metrics.primary}</p>
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">
                          {t('analysis.abTest.sections.baseline')}
                        </span>
                        <p className="font-medium">{test.target_metrics.baseline}</p>
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">
                          {t('analysis.abTest.sections.expectedUplift')}
                        </span>
                        <p className="font-medium text-green-600">{test.target_metrics.expected_uplift}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 mb-3">
                    {t('analysis.abTest.sections.detailedTasks')}
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    {Object.entries(test.detailed_tasks).map(([category, tasks]) => (
                      <div key={category} className="bg-slate-50 p-4 rounded-lg">
                        <h5 className="font-medium text-slate-900 mb-2">
                          {categoryLabel(category)}
                        </h5>
                        <ul className="space-y-1">
                          {tasks.map((task: string, taskIndex: number) => (
                            <li key={taskIndex} className="text-sm text-slate-700 flex items-start">
                              <span className="w-2 h-2 bg-slate-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {t('analysis.abTest.sections.riskMitigation')}
                    </h4>
                    <p className="text-slate-700 text-sm">{test.risk_mitigation}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 mb-2">
                      {t('analysis.abTest.sections.statisticalPower')}
                    </h4>
                    <div className="bg-slate-50 p-3 rounded-lg space-y-1 text-sm">
                      <p>{t('analysis.abTest.stats.traffic', { traffic: test.statistical_power.required_traffic.toString() })}</p>
                      <p>{t('analysis.abTest.stats.duration', { days: test.statistical_power.duration_days.toString() })}</p>
                      <p>{t('analysis.abTest.stats.significance', { alpha: test.statistical_power.alpha.toString() })}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analysis.abTest.sections.nextSteps')}</CardTitle>
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

      {data.assumptions && data.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('analysis.abTest.sections.assumptions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.assumptions.map((assumption, index) => (
                <li key={index} className="flex items-start">
                  <span className="w-2 h-2 bg-orange-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span className="text-slate-700">{assumption}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
