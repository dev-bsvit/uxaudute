import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Target, BarChart3, Users, Zap, Share2, AlertTriangle, CheckCircle, Clock } from 'lucide-react'

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

  if (!data || (!data.result && !data.executive_summary)) {
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
  
  // Если это структурированные данные, используем новый компонент
  if (isStructuredData) {
    return <StructuredBusinessAnalytics data={data} onShare={onShare} publicUrl={publicUrl} publicUrlLoading={publicUrlLoading} />
  }

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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
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
                <p className="text-gray-700">{data.industry_analysis.identified_industry}</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Бизнес-модель</h4>
                <p className="text-gray-700">{data.industry_analysis.identified_business_model}</p>
              </div>
              {data.industry_analysis.north_star_metric && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">North Star Metric</h4>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="font-medium text-blue-900">{data.industry_analysis.north_star_metric.metric}</p>
                    <p className="text-blue-700 text-sm mt-1">{data.industry_analysis.north_star_metric.justification}</p>
                  </div>
                </div>
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
                    <Badge className={getPriorityColor(opportunity.priority)}>
                      {opportunity.priority}
                    </Badge>
                    <span className="font-semibold text-gray-900">{opportunity.opportunity}</span>
                  </div>
                  <p className="text-gray-700 mb-2">{opportunity.reasoning}</p>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p><strong>Потенциальный рост:</strong> {opportunity.potential_gain_percent}</p>
                    <p><strong>Impact/Effort:</strong> {opportunity.impact_effort_matrix.impact}/{opportunity.impact_effort_matrix.effort}</p>
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
