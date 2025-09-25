/**
 * Адаптер для преобразования данных анализа между различными форматами
 */

import { StructuredAnalysisResponse } from './analysis-types'

/**
 * Преобразует данные анализа в старом формате в новый формат StructuredAnalysisResponse
 */
export function adaptLegacyAnalysisData(data: any): StructuredAnalysisResponse | null {
  if (!data || typeof data !== 'object') {
    return null
  }

  console.log('🔄 Adapting legacy analysis data:', Object.keys(data))

  // Проверяем, есть ли данные в старом формате
  if (data.target_audience || data.interface_analysis) {
    console.log('📊 Converting legacy format to StructuredAnalysisResponse')
    
    return {
      screenDescription: {
        screenType: data.interface_analysis?.screen_type || 'Unknown',
        userGoal: data.interface_analysis?.user_goal || 'Not specified',
        keyElements: data.interface_analysis?.key_elements || [],
        confidence: data.interface_analysis?.confidence || 0,
        confidenceReason: data.interface_analysis?.confidence_reason || 'Not provided'
      },
      
      uxSurvey: {
        questions: [], // Старый формат не содержит опросов
        overallConfidence: data.interface_analysis?.confidence || 0
      },
      
      audience: {
        targetAudience: data.target_audience?.demographics ? 
          `${data.target_audience.demographics.gender || ''} ${data.target_audience.demographics.age || ''} from ${data.target_audience.demographics.location || ''}`.trim() :
          'Not specified',
        mainPain: data.target_audience?.preferences?.description || 'Not specified',
        fears: data.target_audience?.preferences?.issues || []
      },
      
      behavior: {
        userScenarios: {
          idealPath: 'Not specified in legacy format',
          typicalError: 'Not specified in legacy format',
          alternativeWorkaround: 'Not specified in legacy format'
        },
        behavioralPatterns: 'Not specified in legacy format',
        frictionPoints: [],
        actionMotivation: 'Not specified in legacy format'
      },
      
      problemsAndSolutions: convertLegacyProblems(data.interface_analysis),
      
      selfCheck: {
        checklist: {
          coversAllElements: true,
          noContradictions: true,
          principlesJustified: true,
          actionClarity: true
        },
        confidence: {
          analysis: data.interface_analysis?.confidence || 0
        }
      },
      
      annotations: '',
      
      metadata: {
        version: '1.0-legacy',
        model: 'Legacy format',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Проверяем, есть ли данные в другом старом формате (interfaceAnalysis)
  if (data.interfaceAnalysis) {
    console.log('📊 Converting interfaceAnalysis format to StructuredAnalysisResponse')
    
    return {
      screenDescription: {
        screenType: 'Interface Analysis',
        userGoal: 'Not specified',
        keyElements: [],
        confidence: 75,
        confidenceReason: 'Converted from interface analysis'
      },
      
      uxSurvey: {
        questions: [],
        overallConfidence: 75
      },
      
      audience: {
        targetAudience: 'Not specified in this format',
        mainPain: 'Not specified in this format',
        fears: []
      },
      
      behavior: {
        userScenarios: {
          idealPath: 'Not specified',
          typicalError: 'Not specified',
          alternativeWorkaround: 'Not specified'
        },
        behavioralPatterns: 'Not specified',
        frictionPoints: [],
        actionMotivation: 'Not specified'
      },
      
      problemsAndSolutions: convertInterfaceAnalysisToProblems(data.interfaceAnalysis),
      
      selfCheck: {
        checklist: {
          coversAllElements: true,
          noContradictions: true,
          principlesJustified: true,
          actionClarity: true
        },
        confidence: {
          analysis: 75
        }
      },
      
      annotations: '',
      
      metadata: {
        version: '1.0-interface-analysis',
        model: 'Interface Analysis format',
        timestamp: new Date().toISOString()
      }
    }
  }

  // Если данные уже в правильном формате, возвращаем как есть
  if (data.screenDescription || data.uxSurvey || data.audience) {
    console.log('✅ Data is already in StructuredAnalysisResponse format')
    return data as StructuredAnalysisResponse
  }

  console.log('❌ Unknown data format, cannot adapt')
  return null
}

/**
 * Преобразует проблемы из старого формата interface_analysis
 */
function convertLegacyProblems(interfaceAnalysis: any): any[] {
  if (!interfaceAnalysis) return []

  const problems: any[] = []

  // Обрабатываем различные категории проблем
  const categories = ['content', 'usability', 'performance', 'visual_design']
  
  categories.forEach(category => {
    const categoryData = interfaceAnalysis[category]
    if (categoryData && typeof categoryData === 'object') {
      Object.entries(categoryData).forEach(([subcategory, data]: [string, any]) => {
        if (data && data.issues && Array.isArray(data.issues)) {
          data.issues.forEach((issue: string) => {
            problems.push({
              element: `${category} - ${subcategory}`,
              problem: issue,
              principle: 'Legacy analysis principle',
              consequence: 'May impact user experience',
              recommendation: data.recommendations?.[0] || 'Review and improve',
              expectedEffect: 'Improved user experience',
              priority: 'medium'
            })
          })
        }
      })
    }
  })

  return problems
}

/**
 * Преобразует данные interfaceAnalysis в проблемы и решения
 */
function convertInterfaceAnalysisToProblems(interfaceAnalysis: any): any[] {
  if (!interfaceAnalysis) return []

  const problems: any[] = []

  // Обрабатываем различные категории
  Object.entries(interfaceAnalysis).forEach(([category, categoryData]: [string, any]) => {
    if (categoryData && typeof categoryData === 'object') {
      Object.entries(categoryData).forEach(([subcategory, data]: [string, any]) => {
        if (data && data.issues && Array.isArray(data.issues)) {
          data.issues.forEach((issue: string, index: number) => {
            problems.push({
              element: `${category} - ${subcategory}`,
              problem: issue,
              principle: 'Interface analysis principle',
              consequence: data.description || 'May impact user experience',
              recommendation: data.recommendations?.[index] || data.recommendations?.[0] || 'Review and improve',
              expectedEffect: 'Improved user experience',
              priority: data.issues.length > 2 ? 'high' : 'medium'
            })
          })
        }
      })
    }
  })

  return problems
}

/**
 * Проверяет, нужно ли адаптировать данные
 */
export function needsDataAdaptation(data: any): boolean {
  if (!data || typeof data !== 'object') return false
  
  // Проверяем наличие старых форматов
  return !!(data.target_audience || data.interface_analysis || data.interfaceAnalysis) &&
         !(data.screenDescription || data.uxSurvey)
}

/**
 * Безопасно адаптирует данные анализа
 */
export function safeAdaptAnalysisData(data: any): StructuredAnalysisResponse | null {
  try {
    if (needsDataAdaptation(data)) {
      return adaptLegacyAnalysisData(data)
    }
    
    // Если данные уже в правильном формате
    if (data && (data.screenDescription || data.uxSurvey || data.audience)) {
      return data as StructuredAnalysisResponse
    }
    
    return null
  } catch (error) {
    console.error('Error adapting analysis data:', error)
    return null
  }
}