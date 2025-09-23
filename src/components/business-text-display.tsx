import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Target, BarChart3, Users, Zap, Share2, AlertTriangle, CheckCircle, Clock, Lightbulb, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'

interface BusinessTextDisplayProps {
  data: { result: string } | any | null
  isLoading?: boolean
  onGenerate?: () => void
  onShare?: () => void
  publicUrl?: string | null
  publicUrlLoading?: boolean
}

export const BusinessTextDisplay: React.FC<BusinessTextDisplayProps> = ({ 
  data, 
  isLoading = false, 
  onGenerate,
  onShare,
  publicUrl,
  publicUrlLoading = false
}) => {
  const t = useTranslations('businessAnalytics')
  console.log('🎯 BusinessTextDisplay received data:', data)
  console.log('🎯 BusinessTextDisplay data type:', typeof data)
  console.log('🎯 BusinessTextDisplay data keys:', data ? Object.keys(data) : 'null')
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>{t('generatingBusinessAnalytics')}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Извлекаем данные из result если они там находятся
  const actualData = data?.result || data
  
  // Проверяем наличие данных в новом формате (data_classification, kpi_summary, etc.) или старом формате
  const hasNewFormat = actualData && (actualData.data_classification || actualData.kpi_summary || actualData.hypotheses || actualData.pain_points)
  const hasOldFormat = actualData && (actualData.result || actualData.executive_summary || actualData.business_metrics || actualData.industry_analysis)
  
  if (!actualData || (!hasNewFormat && !hasOldFormat)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t('businessAnalyticsNotGenerated')}</h3>
            <p className="text-gray-600 max-w-md">
              {t('getDetailedAnalysis')}
            </p>
            {onGenerate && (
              <Button onClick={onGenerate} className="w-full max-w-xs">
                <BarChart3 className="w-4 h-4 mr-2" />
{t('getBusinessAnalytics')}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Проверяем формат данных
  const isNewFormat = actualData && (actualData.data_classification || actualData.kpi_summary || actualData.hypotheses || actualData.pain_points);
  const isStructuredData = actualData && actualData.executive_summary && !actualData.result;
  const isOldStructuredData = actualData && actualData.business_metrics && !actualData.result && !actualData.executive_summary;
  const isCurrentFormat = actualData && (actualData.industry_analysis || actualData.business_metrics || actualData.business_risks) && !actualData.result && !actualData.executive_summary;
  
  console.log('🔍 Format check:', { 
    isNewFormat,
    isStructuredData, 
    isOldStructuredData, 
    isCurrentFormat,
    hasBusinessMetrics: !!actualData?.business_metrics, 
    hasExecutiveSummary: !!actualData?.executive_summary,
    hasIndustryAnalysis: !!actualData?.industry_analysis,
    hasBusinessRisks: !!actualData?.business_risks,
    dataKeys: actualData ? Object.keys(actualData) : 'null'
  })
  
  // Если это новый формат (data_classification, kpi_summary, etc.), используем новый компонент
  if (isNewFormat) {
    console.log('✅ Using NewFormatBusinessAnalytics (newest format)')
    return <NewFormatBusinessAnalytics data={actualData} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  // Если это структурированные данные (новый формат), используем новый компонент
  if (isStructuredData) {
    console.log('✅ Using StructuredBusinessAnalytics (new format)')
    return <StructuredBusinessAnalytics data={actualData} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  // Если это текущий формат (с industry_analysis, business_metrics и т.д.), используем новый компонент
  if (isCurrentFormat) {
    console.log('✅ Using StructuredBusinessAnalytics (current format)')
    return <StructuredBusinessAnalytics data={actualData} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  // Если это старый структурированный формат, конвертируем его
  if (isOldStructuredData) {
    console.log('✅ Using OldStructuredBusinessAnalytics (old format)')
    return <OldStructuredBusinessAnalytics data={actualData} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  console.log('❌ No structured data format detected, falling back to text parsing')

  // Парсим текст для структурированного отображения
  const parseBusinessAnalytics = (text: string) => {
    const sections = text.split(/\n(?=## )/);
    const parsedSections: Array<{
      title: string;
      icon: React.ReactNode;
      content: string[];
      type: 'metrics' | 'roi' | 'rice' | 'recommendations' | 'other';
    }> = [];

    sections.forEach(section => {
      const lines = section.trim().split('\n');
      const title = lines[0]?.replace(/^## /, '') || '';
      const content = lines.slice(1).filter(line => line.trim());
      
      let icon = <BarChart3 className="w-5 h-5" />;
      let type: 'metrics' | 'roi' | 'rice' | 'recommendations' | 'other' = 'other';
      
      if (title.toLowerCase().includes('влияние') || title.toLowerCase().includes('метрики')) {
        icon = <TrendingUp className="w-5 h-5" />;
        type = 'metrics';
      } else if (title.toLowerCase().includes('roi') || title.toLowerCase().includes('окупаемость')) {
        icon = <DollarSign className="w-5 h-5" />;
        type = 'roi';
      } else if (title.toLowerCase().includes('rice') || title.toLowerCase().includes('приоритизация')) {
        icon = <Target className="w-5 h-5" />;
        type = 'rice';
      } else if (title.toLowerCase().includes('рекомендации') || title.toLowerCase().includes('рост')) {
        icon = <Zap className="w-5 h-5" />;
        type = 'recommendations';
      }

      if (title && content.length > 0) {
        parsedSections.push({ title, icon, content, type });
      }
    });

    return parsedSections;
  };

  // Проверяем что actualData.result является строкой
  const resultText = typeof actualData?.result === 'string' ? actualData.result : JSON.stringify(actualData?.result || actualData, null, 2);
  const sections = parseBusinessAnalytics(resultText);

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Бизнес аналитика
        </h2>
        <p className="text-gray-600 mb-4">Анализ влияния UX проблем на бизнес-метрики</p>
        
        {/* Кнопки действий */}
        {onShare && (
          <div className="flex justify-center gap-2">
            {!publicUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShare}
                disabled={publicUrlLoading}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {publicUrlLoading ? 'Создание...' : 'Поделиться'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Копировать ссылку
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Секции */}
      {sections.map((section, index) => (
        <Card key={index} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              {section.icon}
              {section.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {section.content.map((line, lineIndex) => {
                // Обработка подзаголовков
                if (line.startsWith('### ')) {
                  return (
                    <h4 key={lineIndex} className="text-md font-semibold text-gray-900 mt-4 mb-2 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {line.replace('### ', '')}
                    </h4>
                  );
                }
                
                // Обработка списков
                if (line.startsWith('- ')) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-3 ml-4">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700 leading-relaxed">{line.replace('- ', '')}</span>
                    </div>
                  );
                }
                
                if (line.match(/^\d+\. /)) {
                  return (
                    <div key={lineIndex} className="flex items-start gap-3 ml-4">
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        {line.match(/^\d+\./)?.[0]}
                      </Badge>
                      <span className="text-gray-700 leading-relaxed">{line.replace(/^\d+\. /, '')}</span>
                    </div>
                  );
                }
                
                // Обычный текст
                if (line.trim()) {
                  return (
                    <p key={lineIndex} className="text-gray-700 leading-relaxed">
                      {line}
                    </p>
                  );
                }
                
                return null;
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Если не удалось распарсить, показываем как есть */}
      {sections.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5" />
              Бизнес аналитика
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-slate max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {actualData.result}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Компонент для отображения структурированных данных бизнес-аналитики
const StructuredBusinessAnalytics: React.FC<{
  data: any;
  onShare?: () => void;
  publicUrl?: string | null;
  publicUrlLoading?: boolean;
}> = ({ data, onShare, publicUrl, publicUrlLoading }) => {
  const t = useTranslations('businessAnalytics')
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };


  return (
    <div className="space-y-6">
      {/* Временный блок для отладки - ПОЛНЫЕ ДАННЫЕ */}
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔍 ПОЛНЫЕ ДАННЫЕ (для отладки):</h3>
        <pre className="text-xs text-gray-700 bg-white p-3 rounded border overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
      
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Бизнес аналитика
        </h2>
        <p className="text-gray-600 mb-4">Анализ влияния UX проблем на бизнес-метрики</p>
        
        {/* Кнопки действий */}
        {onShare && (
          <div className="flex justify-center gap-2">
            {!publicUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShare}
                disabled={publicUrlLoading}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {publicUrlLoading ? 'Создание...' : 'Поделиться'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Копировать ссылку
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Executive Summary */}
      {data.executive_summary && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Executive Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Основная находка</h4>
                <p className="text-gray-700">{data.executive_summary.main_finding}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Критический риск</h4>
                <p className="text-gray-700">{data.executive_summary.critical_risk}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Топ возможность</h4>
                <p className="text-gray-700">{data.executive_summary.top_opportunity}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Рекомендуемый фокус</h4>
                <p className="text-gray-700">{data.executive_summary.recommended_focus}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Metrics (Current Format) */}
      {data.business_metrics && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
{t('businessMetrics')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {typeof data.business_metrics === 'object' ? (
                Object.entries(data.business_metrics).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    {typeof value === 'object' && value !== null ? (
                      <div className="space-y-2">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {value.map((item, index) => (
                              <li key={index} className="text-gray-700">
                                {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey}>
                                <span className="font-medium text-gray-800">{subKey}:</span>
                                <span className="ml-2 text-gray-700">
                                  {typeof subValue === 'object' ? JSON.stringify(subValue, null, 2) : String(subValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700">{String(value)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-700">{String(data.business_metrics)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Industry Analysis */}
      {data.industry_analysis && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-green-600" />
              Industry Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {typeof data.industry_analysis === 'object' ? (
                Object.entries(data.industry_analysis).map(([key, value]) => (
                  <div key={key}>
                    <h4 className="font-semibold text-gray-900 mb-2 capitalize">
                      {key.replace(/_/g, ' ')}
                    </h4>
                    {typeof value === 'object' && value !== null ? (
                      <div className="space-y-2">
                        {Array.isArray(value) ? (
                          <ul className="list-disc list-inside space-y-1">
                            {value.map((item, index) => (
                              <li key={index} className="text-gray-700">
                                {typeof item === 'object' ? JSON.stringify(item, null, 2) : String(item)}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="space-y-2">
                            {Object.entries(value).map(([subKey, subValue]) => (
                              <div key={subKey}>
                                <span className="font-medium text-gray-800">{subKey}:</span>
                                <span className="ml-2 text-gray-700">
                                  {typeof subValue === 'object' ? JSON.stringify(subValue, null, 2) : String(subValue)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-700">{String(value)}</p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-700">{String(data.industry_analysis)}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AARRR Funnel */}
      {data.aarrr_funnel_analysis && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              AARRR Funnel Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.aarrr_funnel_analysis).map(([stage, stageData]: [string, any]) => (
                <div key={stage} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 capitalize">{stage}</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Проблемы:</p>
                      <p className="text-sm text-gray-600">{stageData.issues}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Рекомендации:</p>
                      <p className="text-sm text-gray-600">{stageData.recommendations}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Risks */}
      {data.business_risks && data.business_risks.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Business Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.business_risks.map((risk: any, index: number) => (
                <div key={index} className="border-l-4 border-red-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(risk.severity)}>
                      {risk.severity}
                    </Badge>
                    <span className="font-semibold text-gray-900">{risk.risk}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{risk.reasoning}</p>
                  <div className="text-sm text-gray-600">
                    <p><strong>Потенциальные потери:</strong> {risk.potential_loss_percent}</p>
                    <p><strong>Митигация:</strong> {risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed Opportunities */}
      {data.missed_opportunities && data.missed_opportunities.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Zap className="w-5 h-5 text-green-600" />
              Missed Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.missed_opportunities.map((opportunity: any, index: number) => (
                <div key={index} className="border-l-4 border-green-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(opportunity.priority)}>
                      {opportunity.priority}
                    </Badge>
                    <span className="font-semibold text-gray-900">{opportunity.opportunity}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{opportunity.reasoning}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Потенциальный рост:</strong> {opportunity.potential_gain_percent}</p>
                    {opportunity.impact_effort_matrix && (
                      <p><strong>Impact/Effort:</strong> {opportunity.impact_effort_matrix.impact}/{opportunity.impact_effort_matrix.effort}</p>
                    )}
                    <p><strong>Шаги реализации:</strong> {opportunity.implementation_steps}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strategic Recommendations */}
      {data.strategic_recommendations && data.strategic_recommendations.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-blue-600" />
              Strategic Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.strategic_recommendations
                .sort((a: any, b: any) => a.priority - b.priority)
                .map((rec: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      #{rec.priority}
                    </Badge>
                    <span className="font-semibold text-gray-900">{rec.title}</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-gray-700"><strong>{t('problem')}:</strong> {rec.problem_statement}</p>
                    <p className="text-gray-700"><strong>{t('solution')}:</strong> {rec.proposed_solution}</p>
                    <p className="text-gray-700"><strong>{t('expectedResult')}:</strong> {rec.expected_outcome}</p>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">{t('metricsForTracking')}:</p>
                      <div className="flex flex-wrap gap-1">
                        {rec.metrics_to_track.map((metric: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {metric}
                          </Badge>
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
  );
};

// Компонент для отображения старого формата структурированных данных бизнес-аналитики
const OldStructuredBusinessAnalytics: React.FC<{
  data: any;
  onShare?: () => void;
  publicUrl?: string | null;
  publicUrlLoading?: boolean;
}> = ({ data, onShare, publicUrl, publicUrlLoading }) => {
  const t = useTranslations('businessAnalytics')
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          Бизнес аналитика
        </h2>
        <p className="text-gray-600 mb-4">Анализ влияния UX проблем на бизнес-метрики</p>
        
        {/* Кнопки действий */}
        {onShare && (
          <div className="flex justify-center gap-2">
            {!publicUrl ? (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onShare}
                disabled={publicUrlLoading}
              >
                <Share2 className="w-4 h-4 mr-2" />
                {publicUrlLoading ? 'Создание...' : 'Поделиться'}
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigator.clipboard.writeText(publicUrl)}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Копировать ссылку
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Industry Analysis */}
      {data.industry_analysis && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-green-600" />
              Industry Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Определенная индустрия</h4>
                <p className="text-gray-700">{data.industry_analysis.industry}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Бизнес-модель</h4>
                <p className="text-gray-700">{data.industry_analysis.business_model}</p>
              </div>
              {data.industry_analysis.north_star_metric && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">North Star Metric</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">{data.industry_analysis.north_star_metric}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Metrics */}
      {data.business_metrics && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Business Metrics Impact
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.business_metrics).map(([metric, impact]: [string, any]) => (
                <div key={metric} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 capitalize">{metric}</h4>
                  <p className="text-gray-700">{impact}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Risks */}
      {data.business_risks && data.business_risks.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-rose-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Business Risks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.business_risks.map((risk: any, index: number) => (
                <div key={index} className="border-l-4 border-red-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(risk.severity || 'medium')}>
                      {risk.severity || 'medium'}
                    </Badge>
                    <span className="font-semibold text-gray-900">{risk.risk}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{risk.description}</p>
                  {risk.mitigation && (
                    <div className="text-sm text-gray-600">
                      <p><strong>Митигация:</strong> {risk.mitigation}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {data.next_steps && data.next_steps.length > 0 && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-blue-600" />
              Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.next_steps.map((step: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold text-gray-900">{step.title || step.action}</span>
                  </div>
                  <p className="text-gray-700">{step.description || step.details}</p>
                  {step.priority && (
                    <div className="mt-2">
                      <Badge className={getSeverityColor(step.priority)}>
                        {step.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Funnel */}
      {data.conversion_funnel && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Conversion Funnel
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Object.entries(data.conversion_funnel).map(([stage, stageData]: [string, any]) => (
                <div key={stage} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2 capitalize">{stage}</h4>
                  <p className="text-gray-700">{stageData}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key KPIs */}
      {data.key_kpis && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BarChart3 className="w-5 h-5 text-yellow-600" />
              Key KPIs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(data.key_kpis).map(([kpi, value]: [string, any]) => (
                <div key={kpi} className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{kpi}</h4>
                  <p className="text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Business Risks (Current Format) */}
      {data.business_risks && Array.isArray(data.business_risks) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Бизнес риски
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.business_risks.map((risk: any, index: number) => (
                <div key={index} className="border-l-4 border-red-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(risk.severity || risk.priority)}>
                      {risk.severity || risk.priority || 'medium'}
                    </Badge>
                    <span className="font-semibold text-gray-900">{risk.risk || risk.title}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{risk.reasoning || risk.description || risk.business_consequences}</p>
                  
                  {/* Потенциальные потери */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">Потенциальные потери:</p>
                    <p className="text-sm text-gray-600">
                      {risk.potential_loss_percent || risk.affected_users || risk.business_consequences || 'Не указано'}
                    </p>
                  </div>
                  
                  {/* Митигация */}
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-900 mb-1">Митигация:</p>
                    <p className="text-sm text-gray-600">
                      {risk.mitigation || 'Не указано'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missed Opportunities (Current Format) */}
      {data.missed_opportunities && Array.isArray(data.missed_opportunities) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Lightbulb className="w-5 h-5 text-green-600" />
              Упущенные возможности
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.missed_opportunities.map((opportunity: any, index: number) => {
                console.log('🔍 Missed opportunity data:', opportunity);
                return (
                  <div key={index} className="border-l-4 border-green-200 pl-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(opportunity.priority)}>
                        {opportunity.priority || 'medium'}
                      </Badge>
                      <span className="font-semibold text-gray-900">{opportunity.opportunity || opportunity.title}</span>
                    </div>
                    <p className="text-gray-700 mb-2">{opportunity.reasoning || opportunity.description}</p>
                    
                    {/* Потенциальный рост */}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 mb-1">Потенциальный рост:</p>
                      <p className="text-sm text-gray-600">
                        {opportunity.potential_gain_percent || opportunity.potential_growth || opportunity.growth_potential || opportunity.potential_impact || 'Не указано'}
                      </p>
                      {/* Отладка */}
                      <p className="text-xs text-gray-400 mt-1">
                        Debug: potential_impact = "{opportunity.potential_impact}"
                      </p>
                    </div>
                    
                    {/* Шаги реализации */}
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 mb-1">Шаги реализации:</p>
                      <p className="text-sm text-gray-600">
                        {opportunity.implementation_steps || opportunity.steps || opportunity.next_steps || opportunity.implementation || 'Не указано'}
                      </p>
                      {/* Отладка */}
                      <p className="text-xs text-gray-400 mt-1">
                        Debug: implementation = "{opportunity.implementation}"
                      </p>
                    </div>
                    
                    {/* Дополнительные поля для отладки */}
                    {process.env.NODE_ENV === 'development' && (
                      <details className="mt-2 text-xs text-gray-500">
                        <summary>Debug info</summary>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                          {JSON.stringify(opportunity, null, 2)}
                        </pre>
                      </details>
                    )}
                </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Behavior Insights (Current Format) */}
      {data.user_behavior_insights && Array.isArray(data.user_behavior_insights) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Users className="w-5 h-5 text-purple-600" />
              Инсайты поведения пользователей
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.user_behavior_insights.map((insight: any, index: number) => (
                <div key={index} className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">{insight.title || insight.insight}</h4>
                  <p className="text-gray-700">{insight.description || insight.details}</p>
                  {insight.impact && (
                    <p className="text-sm text-purple-600 font-medium mt-2">
                      Влияние: {insight.impact}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conversion Barriers (Current Format) */}
      {data.conversion_barriers && Array.isArray(data.conversion_barriers) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              Барьеры конверсии
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.conversion_barriers.map((barrier: any, index: number) => (
                <div key={index} className="border-l-4 border-orange-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getSeverityColor(barrier.severity || barrier.priority)}>
                      {barrier.severity || barrier.priority || 'medium'}
                    </Badge>
                    <span className="font-semibold text-gray-900">{barrier.barrier || barrier.title}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{barrier.description || barrier.details}</p>
                  {barrier.impact_percent && (
                    <p className="text-sm text-orange-600 font-medium">
{t('impactOnConversion')}: {barrier.impact_percent}
                    </p>
                  )}
                  {barrier.solution && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 mb-1">{t('solution')}:</p>
                      <p className="text-sm text-gray-600">{barrier.solution}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps (Current Format) */}
      {data.next_steps && Array.isArray(data.next_steps) && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              Следующие шаги
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.next_steps.map((step: any, index: number) => (
                <div key={index} className="border-l-4 border-blue-200 pl-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      #{index + 1}
                    </Badge>
                    <span className="font-semibold text-gray-900">{step.title || step.action || step.step}</span>
                  </div>
                  <p className="text-gray-700">{step.description || step.details || step.description}</p>
                  {step.priority && (
                    <div className="mt-2">
                      <Badge className={getSeverityColor(step.priority)}>
                        {step.priority}
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};


// Компонент для отображения нового формата бизнес-аналитики (data_classification, kpi_summary, etc.)
const NewFormatBusinessAnalytics: React.FC<{
  data: any;
  onShare?: () => void;
  publicUrl?: string | null;
  publicUrlLoading?: boolean;
}> = ({ data, onShare, publicUrl, publicUrlLoading }) => {
  const t = useTranslations('businessAnalytics')
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800 border-red-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">

      {/* Data Classification */}
      {data.data_classification && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
{t('dataClassification')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Quantitative Data */}
              {data.data_classification.quantitative_data && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
{t('quantitativeData')}
                  </h4>
                  <div className="space-y-2">
                    {data.data_classification.quantitative_data.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="font-medium text-green-800">{item.type}</div>
                        <div className="text-sm text-green-700">{item.value}</div>
                        <div className="text-xs text-green-600">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Qualitative Data */}
              {data.data_classification.qualitative_data && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
{t('qualitativeData')}
                  </h4>
                  <div className="space-y-2">
                    {data.data_classification.qualitative_data.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="font-medium text-blue-800">{item.type}</div>
                        <div className="text-sm text-blue-700">{item.description}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* UX Heuristics */}
              {data.data_classification.ux_heuristics && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
{t('uxHeuristics')}
                  </h4>
                  <div className="space-y-2">
                    {data.data_classification.ux_heuristics.map((item: any, index: number) => (
                      <div key={index} className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="font-medium text-orange-800">{item.principle}</div>
                        <div className="text-sm text-orange-700">{item.violation}</div>
                        <Badge className={getSeverityColor(item.severity)}>
                          {item.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Summary */}
      {data.kpi_summary && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Target className="w-5 h-5 text-green-600" />
{t('kpiSummary')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {data.kpi_summary.current_metrics && (
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">{t('currentMetrics')}</h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-200 px-4 py-2 text-left font-semibold">{t('metric')}</th>
                        <th className="border border-gray-200 px-4 py-2 text-left font-semibold">{t('currentValue')}</th>
                        <th className="border border-gray-200 px-4 py-2 text-left font-semibold">{t('benchmark')}</th>
                        <th className="border border-gray-200 px-4 py-2 text-left font-semibold">{t('trend')}</th>
                        <th className="border border-gray-200 px-4 py-2 text-left font-semibold">{t('impact')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.kpi_summary.current_metrics.map((metric: any, index: number) => (
                        <tr key={index}>
                          <td className="border border-gray-200 px-4 py-2">{metric.metric}</td>
                          <td className="border border-gray-200 px-4 py-2 font-medium">{metric.current_value}</td>
                          <td className="border border-gray-200 px-4 py-2">{metric.benchmark}</td>
                          <td className="border border-gray-200 px-4 py-2">
                            <Badge className={metric.trend === "declining" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                              {metric.trend}
                            </Badge>
                          </td>
                          <td className="border border-gray-200 px-4 py-2">
                            <Badge className={getSeverityColor(metric.impact_on_business)}>
                              {metric.impact_on_business}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {data.kpi_summary.key_insights && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">{t('keyInsights')}</h4>
                <ul className="space-y-2">
                  {data.kpi_summary.key_insights.map((insight: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Pain Points */}
      {data.pain_points && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
{t('painPoints')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.pain_points.map((painPoint: any, index: number) => (
                <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h4 className="font-semibold text-red-800 mb-3">{painPoint.pain_point}</h4>
                  
                  {painPoint.quantitative_impact && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">{t('quantitativeImpact')}:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                        {Object.entries(painPoint.quantitative_impact).map(([key, value]) => (
                          <div key={key} className="bg-white p-2 rounded border">
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {painPoint.qualitative_description && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">{t('qualitativeDescription')}:</h5>
                      <p className="text-gray-700">{painPoint.qualitative_description}</p>
                    </div>
                  )}

                  {painPoint.ux_heuristics_violated && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">{t('violatedUxPrinciples')}:</h5>
                      <div className="flex flex-wrap gap-2">
                        {painPoint.ux_heuristics_violated.map((heuristic: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {heuristic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {painPoint.business_impact && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">{t('businessImpact')}:</h5>
                      <p className="text-gray-700">{painPoint.business_impact}</p>
                    </div>
                  )}

                  {painPoint.consequence && (
                    <div className="mb-3">
                      <h5 className="font-medium text-gray-900 mb-2">{t('consequence')}:</h5>
                      <p className="text-gray-700">{painPoint.consequence}</p>
                    </div>
                  )}

                  {painPoint.expected_effect && (
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">{t('expectedEffect')}:</h5>
                      <p className="text-gray-700">{painPoint.expected_effect}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hypotheses */}
      {data.hypotheses && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Lightbulb className="w-5 h-5 text-purple-600" />
{t('hypotheses')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {data.hypotheses.map((hypothesis: any, index: number) => (
                <div key={index} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold text-purple-800">{hypothesis.title}</h4>
                    <div className="flex gap-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        ICE: {hypothesis.ice_score}
                      </Badge>
                      <Badge className={getPriorityColor(hypothesis.impact > 7 ? "high" : hypothesis.impact > 4 ? "medium" : "low")}>
                        Impact: {hypothesis.impact}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{t('problem')}:</h5>
                      <p className="text-gray-700">{hypothesis.problem}</p>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-1">{t('solution')}:</h5>
                      <p className="text-gray-700">{hypothesis.solution}</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-white p-2 rounded border">
                        <span className="font-medium">Impact:</span> {hypothesis.impact}/10
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <span className="font-medium">Confidence:</span> {hypothesis.confidence}/10
                      </div>
                      <div className="bg-white p-2 rounded border">
                        <span className="font-medium">Effort:</span> {hypothesis.effort}/10
                      </div>
                    </div>
                    
                    {hypothesis.expected_improvement && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">{t('expectedImprovement')}:</h5>
                        <p className="text-gray-700">{hypothesis.expected_improvement}</p>
                      </div>
                    )}
                    
                    {hypothesis.metrics_to_track && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-1">{t('metricsForTracking')}:</h5>
                        <div className="flex flex-wrap gap-2">
                          {hypothesis.metrics_to_track.map((metric: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-gray-50 text-gray-700">
                              {metric}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top 3 Detailed */}
      {data.top_3_detailed && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <Zap className="w-5 h-5 text-indigo-600" />
              Топ-3 детализированные гипотезы
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              {data.top_3_detailed.map((hypothesis: any, index: number) => (
                <div key={index} className="p-6 bg-indigo-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-semibold text-indigo-800 text-lg">Гипотеза {hypothesis.hypothesis_id}</h4>
                    <Badge className="bg-indigo-100 text-indigo-800">
                      #{index + 1} в приоритете
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">User Story:</h5>
                      <p className="text-gray-700 italic">"{hypothesis.user_story}"</p>
                    </div>
                    
                    {hypothesis.ux_patterns && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">UX Паттерны:</h5>
                        <div className="space-y-3">
                          {hypothesis.ux_patterns.map((pattern: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded border">
                              <div className="font-medium text-gray-900">{pattern.pattern}</div>
                              <div className="text-sm text-gray-600 mb-2">{pattern.description}</div>
                              {pattern.examples && (
                                <div className="text-sm text-blue-600">
                                  Примеры: {pattern.examples.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {hypothesis.test_plan && (
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">План тестирования:</h5>
                        <div className="bg-white p-4 rounded border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="font-medium">Метод:</span> {hypothesis.test_plan.method}
                            </div>
                            <div>
                              <span className="font-medium">Длительность:</span> {hypothesis.test_plan.duration}
                            </div>
                            <div>
                              <span className="font-medium">Размер выборки:</span> {hypothesis.test_plan.sample_size}
                            </div>
                            <div>
                              <span className="font-medium">Критерии успеха:</span> {hypothesis.test_plan.success_criteria}
                            </div>
                          </div>
                          
                          {hypothesis.test_plan.delta_metrics && (
                            <div>
                              <h6 className="font-medium text-gray-900 mb-2">Δ-метрики:</h6>
                              <div className="space-y-2">
                                {hypothesis.test_plan.delta_metrics.map((metric: any, idx: number) => (
                                  <div key={idx} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                                    <span className="font-medium">{metric.metric}</span>
                                    <div className="flex gap-4 text-sm">
                                      <span>Ожидаемое изменение: {metric.expected_change}</span>
                                      <span>Значимость: {metric.statistical_significance}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Final Summary Table */}
      {data.final_summary_table && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Итоговая сводка
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-emerald-600">{data.final_summary_table.total_hypotheses}</div>
                <div className="text-sm text-gray-600">Всего гипотез</div>
              </div>
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-red-600">{data.final_summary_table.high_priority}</div>
                <div className="text-sm text-gray-600">Высокий приоритет</div>
              </div>
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-yellow-600">{data.final_summary_table.medium_priority}</div>
                <div className="text-sm text-gray-600">Средний приоритет</div>
              </div>
              <div className="bg-white p-4 rounded-lg border text-center">
                <div className="text-2xl font-bold text-green-600">{data.final_summary_table.low_priority}</div>
                <div className="text-sm text-gray-600">Низкий приоритет</div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
                <h4 className="font-semibold text-emerald-800 mb-2">Ожидаемый общий эффект:</h4>
                <p className="text-emerald-700">{data.final_summary_table.estimated_total_impact}</p>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Рекомендуемый фокус:</h4>
                <p className="text-blue-700">{data.final_summary_table.recommended_focus}</p>
              </div>
              
              {data.final_summary_table.next_steps && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Следующие шаги:</h4>
                  <ul className="space-y-2">
                    {data.final_summary_table.next_steps.map((step: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Self Check */}
      {data.self_check && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
            <CardTitle className="flex items-center gap-3 text-lg">
              <CheckCircle className="w-5 h-5 text-gray-600" />
              Самопроверка
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className={`w-5 h-5 ${data.self_check.checklist_completed ? "text-green-600" : "text-red-600"}`} />
              <span className="font-semibold">
                {data.self_check.checklist_completed ? "Чек-лист пройден" : "Чек-лист не пройден"}
              </span>
            </div>
            
            {data.self_check.validation_notes && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Заметки валидации:</h4>
                <ul className="space-y-2">
                  {data.self_check.validation_notes.map((note: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
                      <span className="text-gray-700">{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
