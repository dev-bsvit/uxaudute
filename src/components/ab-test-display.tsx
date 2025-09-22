import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ABTestResponse, ABTest } from '@/lib/analysis-types'
import { Download, RefreshCw, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'

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
  const t = useTranslations('abTest')
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>{t('generating')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">{t('notGenerated')}</h3>
          <p className="text-slate-600 mb-6">
            {t('notGeneratedDescription')}
          </p>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('getTests')}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-800'
    if (score >= 6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 8) return t('high')
    if (score >= 6) return t('medium')
    return t('low')
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">{t('title')}</h2>
          <p className="text-slate-600">
            {t('generated', { count: data.ab_tests.length })}
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
                {publicUrlLoading ? t('creating') : t('share')}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {t('copyLink')}
              </Button>
            )
          )}
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            {t('export')}
          </Button>
          {onGenerate && (
            <Button onClick={onGenerate} size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t('update')}
            </Button>
          )}
        </div>
      </div>

      {/* Список AB тестов */}
      <div className="space-y-4">
        {data.ab_tests.map((test, index) => (
          <Card key={test.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    {t('test', { number: index + 1 })}: {test.problem}
                  </CardTitle>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getScoreColor(test.impact_score)}>
                      {t('impact')}: {test.impact_score}/10 ({getScoreLabel(test.impact_score)})
                    </Badge>
                    <Badge className={getScoreColor(test.confidence_score)}>
                      {t('confidence')}: {test.confidence_score}/10 ({getScoreLabel(test.confidence_score)})
                    </Badge>
                    <Badge className={getScoreColor(test.ease_score)}>
                      {t('ease')}: {test.ease_score}/10 ({getScoreLabel(test.ease_score)})
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Гипотеза и решение */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{t('hypothesis')}</h4>
                  <p className="text-slate-700">{test.hypothesis}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{t('solution')}</h4>
                  <p className="text-slate-700">{test.solution}</p>
                </div>
              </div>

              {/* Метрики */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">{t('targetMetrics')}</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-slate-600">{t('primaryMetric')}:</span>
                      <p className="font-medium">{test.target_metrics.primary}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">{t('currentValue')}:</span>
                      <p className="font-medium">{test.target_metrics.baseline}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">{t('expectedGrowth')}:</span>
                      <p className="font-medium text-green-600">{test.target_metrics.expected_uplift}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Детальные задачи */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">{t('detailedTasks')}</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(test.detailed_tasks || {}).map(([category, tasks]) => (
                    <div key={category} className="bg-slate-50 p-4 rounded-lg">
                      <h5 className="font-medium text-slate-900 mb-2 capitalize">
                        {category === 'frontend' ? t('frontend') : 
                         category === 'backend' ? t('backend') :
                         category === 'analytics' ? t('analytics') : t('design')}
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

              {/* Риски и статистика */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{t('risksMitigation')}</h4>
                  <p className="text-slate-700 text-sm">{test.risk_mitigation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">{t('statisticalPower')}</h4>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p><span className="text-slate-600">{t('traffic')}:</span> {test.statistical_power.required_traffic}</p>
                      <p><span className="text-slate-600">{t('duration')}:</span> {test.statistical_power.duration_days} {t('days')}</p>
                      <p><span className="text-slate-600">{t('significanceLevel')}:</span> {test.statistical_power.alpha}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Следующие шаги */}
      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('nextSteps')}</CardTitle>
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

      {/* Предположения */}
      {data.assumptions && data.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t('assumptions')}</CardTitle>
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
