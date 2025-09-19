import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ABTestResponse, ABTest } from '@/lib/analysis-types'
import { Download, RefreshCw, Share2 } from 'lucide-react'

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
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            <span>Генерируем AB тесты...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <h3 className="text-lg font-semibold mb-4">AB тесты не сгенерированы</h3>
          <p className="text-slate-600 mb-6">
            Нажмите кнопку ниже, чтобы сгенерировать AB тесты на основе результатов UX анализа
          </p>
          {onGenerate && (
            <Button onClick={onGenerate} className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Получить AB тесты
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
    if (score >= 8) return 'Высокий'
    if (score >= 6) return 'Средний'
    return 'Низкий'
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">AB тесты</h2>
          <p className="text-slate-600">
            Сгенерировано {data.ab_tests.length} тестов
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
            )
          )}
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

      {/* Список AB тестов */}
      <div className="space-y-4">
        {data.ab_tests.map((test, index) => (
          <Card key={test.id} className="overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">
                    Тест #{index + 1}: {test.problem}
                  </CardTitle>
                  <div className="flex gap-2 mb-3">
                    <Badge className={getScoreColor(test.impact_score)}>
                      Impact: {test.impact_score}/10 ({getScoreLabel(test.impact_score)})
                    </Badge>
                    <Badge className={getScoreColor(test.confidence_score)}>
                      Confidence: {test.confidence_score}/10 ({getScoreLabel(test.confidence_score)})
                    </Badge>
                    <Badge className={getScoreColor(test.ease_score)}>
                      Ease: {test.ease_score}/10 ({getScoreLabel(test.ease_score)})
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Гипотеза и решение */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Гипотеза</h4>
                  <p className="text-slate-700">{test.hypothesis}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Решение</h4>
                  <p className="text-slate-700">{test.solution}</p>
                </div>
              </div>

              {/* Метрики */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Целевые метрики</h4>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-slate-600">Основная метрика:</span>
                      <p className="font-medium">{test.target_metrics.primary}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Текущее значение:</span>
                      <p className="font-medium">{test.target_metrics.baseline}</p>
                    </div>
                    <div>
                      <span className="text-sm text-slate-600">Ожидаемый рост:</span>
                      <p className="font-medium text-green-600">{test.target_metrics.expected_uplift}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Детальные задачи */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3">Детальные задачи</h4>
                <div className="grid md:grid-cols-2 gap-4">
                  {Object.entries(test.detailed_tasks || {}).map(([category, tasks]) => (
                    <div key={category} className="bg-slate-50 p-4 rounded-lg">
                      <h5 className="font-medium text-slate-900 mb-2 capitalize">
                        {category === 'frontend' ? 'Frontend' : 
                         category === 'backend' ? 'Backend' :
                         category === 'analytics' ? 'Аналитика' : 'Дизайн'}
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
                  <h4 className="font-semibold text-slate-900 mb-2">Риски и митигация</h4>
                  <p className="text-slate-700 text-sm">{test.risk_mitigation}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-2">Статистическая мощность</h4>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm space-y-1">
                      <p><span className="text-slate-600">Трафик:</span> {test.statistical_power.required_traffic}</p>
                      <p><span className="text-slate-600">Длительность:</span> {test.statistical_power.duration_days} дней</p>
                      <p><span className="text-slate-600">Уровень значимости:</span> {test.statistical_power.alpha}</p>
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

      {/* Предположения */}
      {data.assumptions && data.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Предположения</CardTitle>
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
