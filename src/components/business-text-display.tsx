import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Target, BarChart3, Users, Zap, Share2, AlertTriangle, CheckCircle, Clock, Lightbulb, AlertCircle } from 'lucide-react'

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
  console.log('🎯 BusinessTextDisplay received data:', data)
  console.log('🎯 BusinessTextDisplay data type:', typeof data)
  console.log('🎯 BusinessTextDisplay data keys:', data ? Object.keys(data) : 'null')
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

  if (!data || (!data.result && !data.executive_summary && !data.business_metrics && !data.industry_analysis)) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Бизнес аналитика не сгенерирована</h3>
            <p className="text-gray-600 max-w-md">
              Получите детальный анализ влияния UX проблем на бизнес-метрики и рекомендации по улучшению
            </p>
            {onGenerate && (
              <Button onClick={onGenerate} className="w-full max-w-xs">
                <BarChart3 className="w-4 h-4 mr-2" />
                Получить бизнес аналитику
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Проверяем формат данных
  const isStructuredData = data && data.executive_summary && !data.result;
  const isOldStructuredData = data && data.business_metrics && !data.result && !data.executive_summary;
  const isCurrentFormat = data && (data.industry_analysis || data.business_metrics || data.business_risks) && !data.result && !data.executive_summary;
  
  console.log('🔍 Format check:', { 
    isStructuredData, 
    isOldStructuredData, 
    isCurrentFormat,
    hasBusinessMetrics: !!data?.business_metrics, 
    hasExecutiveSummary: !!data?.executive_summary,
    hasIndustryAnalysis: !!data?.industry_analysis,
    hasBusinessRisks: !!data?.business_risks,
    dataKeys: data ? Object.keys(data) : 'null'
  })
  
  // Если это структурированные данные (новый формат), используем новый компонент
  if (isStructuredData) {
    console.log('✅ Using StructuredBusinessAnalytics (new format)')
    return <StructuredBusinessAnalytics data={data} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  // Если это текущий формат (с industry_analysis, business_metrics и т.д.), используем новый компонент
  if (isCurrentFormat) {
    console.log('✅ Using StructuredBusinessAnalytics (current format)')
    return <StructuredBusinessAnalytics data={data} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }
  
  // Если это старый структурированный формат, конвертируем его
  if (isOldStructuredData) {
    console.log('✅ Using OldStructuredBusinessAnalytics (old format)')
    return <OldStructuredBusinessAnalytics data={data} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
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

  const sections = parseBusinessAnalytics(data.result);

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
                {data.result}
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
              Бизнес метрики
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
                    <p className="text-gray-700"><strong>Проблема:</strong> {rec.problem_statement}</p>
                    <p className="text-gray-700"><strong>Решение:</strong> {rec.proposed_solution}</p>
                    <p className="text-gray-700"><strong>Ожидаемый результат:</strong> {rec.expected_outcome}</p>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Метрики для отслеживания:</p>
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
                      Влияние на конверсию: {barrier.impact_percent}
                    </p>
                  )}
                  {barrier.solution && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 mb-1">Решение:</p>
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
