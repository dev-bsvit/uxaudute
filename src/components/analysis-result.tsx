'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react'

interface AnalysisResultProps {
  result: string
  screenshot?: string | null
  url?: string | null
}

export function AnalysisResult({ result, screenshot, url }: AnalysisResultProps) {
  // Парсим результат анализа для структурирования
  const parseAnalysis = (text: string) => {
    const sections = text.split(/(?=##?\s)/g).filter(s => s.trim())
    
    let description = ''
    let survey = ''
    let problems = ''
    let selfCheck = ''
    
    sections.forEach(section => {
      const content = section.trim()
      if (content.includes('Описание интерфейса') || content.includes('Описание экрана')) {
        description = content
      } else if (content.includes('UX-опрос') || content.includes('опрос')) {
        survey = content
      } else if (content.includes('Проблемы и рекомендации') || content.includes('рекомендации')) {
        problems = content
      } else if (content.includes('Self-Check') || content.includes('Self-check') || content.includes('Confidence')) {
        selfCheck = content
      }
    })
    
    return { description, survey, problems, selfCheck }
  }
  
  const { description, survey, problems, selfCheck } = parseAnalysis(result)
  
  const formatText = (text: string) => {
    return text
      .replace(/\n/g, '<br>')
      .replace(/## (.*)/g, '<h3 class="text-xl font-bold text-slate-800 mt-6 mb-3">$1</h3>')
      .replace(/### (.*)/g, '<h4 class="text-lg font-semibold text-slate-700 mt-4 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800">$1</strong>')
      .replace(/- (.*)/g, '<div class="flex items-start mb-2"><span class="text-blue-500 mr-2">•</span><span>$1</span></div>')
  }

  return (
    <div className="space-y-6">
      {/* Анализируемый объект */}
      {(screenshot || url) && (
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-blue-600" />
              Анализируемый объект
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {screenshot ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Скриншот интерфейса</Badge>
                </div>
                <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
                  <img 
                    src={screenshot} 
                    alt="Анализируемый скриншот" 
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
              </div>
            ) : url ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">URL анализ</Badge>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 font-medium break-all"
                  >
                    {url}
                  </a>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      {/* Описание интерфейса */}
      {description && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-green-600" />
              Описание интерфейса
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(description) }}
            />
          </CardContent>
        </Card>
      )}

      {/* UX-опрос */}
      {survey && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
            <CardTitle className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-orange-600" />
              UX-опрос и оценки
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(survey) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Проблемы и рекомендации */}
      {problems && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50">
            <CardTitle className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              Проблемы и рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(problems) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Self-Check */}
      {selfCheck && (
        <Card>
          <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50">
            <CardTitle className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Самопроверка и уверенность
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(selfCheck) }}
            />
          </CardContent>
        </Card>
      )}

      {/* Полный результат как резерв */}
      {!description && !survey && !problems && !selfCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Результат анализа</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none"
              dangerouslySetInnerHTML={{ __html: formatText(result) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
