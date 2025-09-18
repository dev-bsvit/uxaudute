import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, TrendingUp, DollarSign, Target, BarChart3, Users, Zap, Share2 } from 'lucide-react'

interface BusinessTextDisplayProps {
  data: { result: string } | null
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

  if (!data || !data.result) {
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
