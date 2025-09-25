'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, CheckCircle, AlertCircle, TrendingUp, Monitor, Link2, BarChart3, Target, Lightbulb, Users } from 'lucide-react'
import { AnalysisResultDisplay } from './analysis-result-display'
import { StructuredAnalysisResponse, isStructuredResponse } from '@/lib/analysis-types'
import { safeParseJSON, validateAnalysisResponse } from '@/lib/json-parser'
import { DebugAnalysisData } from './debug-analysis-data'

interface AnalysisResultProps {
  result: string | StructuredAnalysisResponse
  screenshot?: string | null
  url?: string | null
  auditId?: string // ID аудита для сохранения аннотаций
}

export function AnalysisResult({ result, screenshot, url, auditId }: AnalysisResultProps) {
  console.log('AnalysisResult received:', { result, screenshot, url, auditId })
  console.log('Result type:', typeof result)

  return (
    <div className="w-full">
      <DebugAnalysisData result={result} title="Analysis Result Debug" />
      {renderAnalysisContent()}
    </div>
  )

  function renderAnalysisContent() {
    // Пытаемся получить структурированный результат
    let structuredResult: StructuredAnalysisResponse | null = null
  
  if (typeof result === 'object' && isStructuredResponse(result)) {
    // Уже структурированный объект
    structuredResult = result as StructuredAnalysisResponse
    console.log('✅ Using existing structured result')
  } else if (typeof result === 'string') {
    // Пытаемся распарсить JSON строку
    console.log('🔄 Attempting to parse JSON string...')
    structuredResult = safeParseJSON(result)
  } else if (typeof result === 'object' && result && 'content' in result) {
    // Результат содержит поле content с JSON
    console.log('🔄 Extracting content from result object...')
    const content = (result as any).content
    if (typeof content === 'string') {
      structuredResult = safeParseJSON(content)
    }
  }

  // Если удалось получить структурированный результат, используем новый компонент
  if (structuredResult && validateAnalysisResponse(structuredResult)) {
    console.log('✅ Using AnalysisResultDisplay with structured data')
    return (
      <div className="w-full">
        <AnalysisResultDisplay 
          analysis={structuredResult}
          screenshot={screenshot}
          url={url}
          auditId={auditId}
        />
      </div>
    )
  }

  console.log('⚠️ Falling back to legacy text display')
  
  // Fallback на старый текстовый формат

  // Для текстовых результатов используем старый формат
  const parseAnalysis = (text: string | StructuredAnalysisResponse) => {
    // Если это объект с analysis_result, извлекаем строку
    let textToParse = ''
    if (typeof text === 'string') {
      textToParse = text
    } else if (typeof text === 'object' && text && 'analysis_result' in text) {
      textToParse = (text as any).analysis_result || ''
    } else {
      textToParse = ''
    }
    
    const sections = textToParse.split(/(?=##?\s)/g).filter(s => s.trim())
    
    let description = ''
    let survey = ''
    let problems = ''
    let selfCheck = ''
    
    sections.forEach(section => {
      const content = section.trim()
      if (content.includes('Описание интерфейса') || content.includes('Описание экрана') || 
          content.includes('Interface Description') || content.includes('Screen Description')) {
        description = content
      } else if (content.includes('UX-опрос') || content.includes('опрос') || 
                 content.includes('UX Survey') || content.includes('survey')) {
        survey = content
      } else if (content.includes('Проблемы и рекомендации') || content.includes('рекомендации') ||
                 content.includes('Problems and Solutions') || content.includes('recommendations')) {
        problems = content
      } else if (content.includes('Self-Check') || content.includes('Self-check') || content.includes('Confidence')) {
        selfCheck = content
      }
    })
    
    return { description, survey, problems, selfCheck }
  }
  
  const { description, survey, problems, selfCheck } = parseAnalysis(result)
  
  const formatText = (text: string | undefined | null) => {
    if (!text || typeof text !== 'string') return ''
    return text
      .replace(/\n/g, '<br>')
      .replace(/## (.*)/g, '<h3 class="text-xl font-bold text-slate-900 mt-6 mb-3">$1</h3>')
      .replace(/### (.*)/g, '<h4 class="text-lg font-semibold text-slate-800 mt-4 mb-2">$1</h4>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-900">$1</strong>')
      .replace(/- (.*)/g, '<div class="flex items-start mb-2 text-slate-700"><span class="text-blue-500 mr-2 flex-shrink-0">•</span><span class="text-slate-700">$1</span></div>')
      .replace(/^\d+\.\s(.*)/gm, '<div class="flex items-start mb-2 text-slate-700"><span class="text-blue-500 mr-2 flex-shrink-0">•</span><span class="text-slate-700">$1</span></div>')
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header с анализируемым объектом */}
      <div className="mb-8 bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                {screenshot ? <Monitor className="w-5 h-5 text-white" /> : <Link2 className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Результат UX анализа</h2>
                <p className="text-sm text-slate-600">
                  {screenshot ? 'Анализ интерфейса по скриншоту' : 'Анализ сайта по URL'}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
              Анализ завершен
            </Badge>
          </div>
        </div>
        
        {/* Анализируемый объект */}
        <div className="p-6">
          {screenshot ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Анализируемый интерфейс</span>
              </div>
              <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
                <img 
                  src={screenshot} 
                  alt="Анализируемый скриншот" 
                  className="w-full h-auto max-h-80 object-contain bg-white"
                  onError={(e) => {
                    console.error('Error loading screenshot:', screenshot)
                    console.error('Image error:', e)
                  }}
                  onLoad={() => {
                    console.log('Screenshot loaded successfully:', screenshot)
                  }}
                />
              </div>
            </div>
          ) : url ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">Анализируемый URL</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 font-medium break-all flex items-center gap-2"
                >
                  <Link2 className="w-4 h-4" />
                  {url}
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Grid Layout для секций */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Описание интерфейса */}
        {description && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Описание интерфейса</h3>
                    <p className="text-sm text-slate-600">Детальный анализ визуальных элементов</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(description) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* UX-опрос */}
        {survey && (
          <div>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden h-full">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">UX-опрос</h3>
                    <p className="text-sm text-slate-600">Пользовательские сценарии</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(survey) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Проблемы и рекомендации */}
        {problems && (
          <div>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden h-full">
              <div className="bg-gradient-to-r from-red-50 to-rose-50 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Проблемы и решения</h3>
                    <p className="text-sm text-slate-600">Рекомендации по улучшению</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(problems) }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Self-Check */}
        {selfCheck && (
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-violet-50 to-purple-50 px-6 py-4 border-b">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Оценка качества анализа</h3>
                    <p className="text-sm text-slate-600">Метрики уверенности и ограничения</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatText(selfCheck) }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Полный результат как резерв */}
      {!description && !survey && !problems && !selfCheck && (
        <Card>
          <CardHeader>
            <CardTitle>Результат анализа</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatText(typeof result === 'string' ? result : JSON.stringify(result, null, 2)) }}
            />
          </CardContent>
        </Card>
      )}
    </div>
    )
  }
}
