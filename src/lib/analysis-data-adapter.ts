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
        overallConfidence: data.interface_analysis?.confidence || 0,
        summary: {
          totalQuestions: 0,
          averageConfidence: data.interface_analysis?.confidence || 0,
          criticalIssues: 0,
          recommendations: []
        }
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
          analysis: data.interface_analysis?.confidence || 0,
          survey: 0,
          recommendations: data.interface_analysis?.confidence || 0
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
        overallConfidence: 75,
        summary: {
          totalQuestions: 0,
          averageConfidence: 75,
          criticalIssues: 0,
          recommendations: []
        }
      },
      
      audience: {
        targetAudience: extractAudienceFromAnalysis(data.interfaceAnalysis, data.recommendations),
        mainPain: extractMainPainFromAnalysis(data.interfaceAnalysis, data.recommendations),
        fears: extractFearsFromAnalysis(data.interfaceAnalysis, data.recommendations)
      },
      
      behavior: {
        userScenarios: {
          idealPath: 'User successfully navigates through the interface with high usability scores',
          typicalError: 'User encounters difficulties in areas with low scores (< 7/10)',
          alternativeWorkaround: 'User may use alternative paths to complete tasks'
        },
        behavioralPatterns: extractBehavioralPatterns(data.interfaceAnalysis),
        frictionPoints: extractFrictionPoints(data.interfaceAnalysis, data.recommendations),
        actionMotivation: 'Users are motivated by clear navigation and good visual design'
      },
      
      problemsAndSolutions: convertInterfaceAnalysisToProblems(data.interfaceAnalysis, data.recommendations),
      
      selfCheck: {
        checklist: {
          coversAllElements: true,
          noContradictions: true,
          principlesJustified: true,
          actionClarity: true
        },
        confidence: {
          analysis: 75,
          survey: 0,
          recommendations: 75
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
function convertInterfaceAnalysisToProblems(interfaceAnalysis: any, recommendations?: any): any[] {
  const problems: any[] = []

  if (!interfaceAnalysis && !recommendations) return problems

  // Если есть recommendations, используем их для создания проблем
  if (recommendations && typeof recommendations === 'object') {
    Object.entries(recommendations).forEach(([category, categoryData]: [string, any]) => {
      if (categoryData && typeof categoryData === 'object') {
        Object.entries(categoryData).forEach(([subcategory, recommendation]: [string, any]) => {
          if (typeof recommendation === 'string') {
            // Получаем соответствующую оценку из interfaceAnalysis
            const score = interfaceAnalysis?.[category]?.[subcategory] || 5
            const priority = score < 6 ? 'high' : score < 8 ? 'medium' : 'low'
            
            problems.push({
              element: `${category} - ${subcategory}`,
              problem: `Score: ${score}/10 - Needs improvement`,
              principle: 'UX Analysis Principle',
              consequence: 'May negatively impact user experience and conversion',
              recommendation: recommendation,
              expectedEffect: 'Improved user experience and higher conversion rates',
              priority: priority
            })
          }
        })
      }
    })
  }

  // Если есть interfaceAnalysis с низкими оценками, добавляем их как проблемы
  if (interfaceAnalysis && typeof interfaceAnalysis === 'object') {
    Object.entries(interfaceAnalysis).forEach(([category, categoryData]: [string, any]) => {
      if (categoryData && typeof categoryData === 'object') {
        Object.entries(categoryData).forEach(([subcategory, score]: [string, any]) => {
          if (typeof score === 'number' && score < 7) {
            // Проверяем, не добавили ли мы уже эту проблему из recommendations
            const existingProblem = problems.find(p => 
              p.element === `${category} - ${subcategory}`
            )
            
            if (!existingProblem) {
              const priority = score < 5 ? 'high' : score < 7 ? 'medium' : 'low'
              
              problems.push({
                element: `${category} - ${subcategory}`,
                problem: `Low score: ${score}/10`,
                principle: 'UX Evaluation Principle',
                consequence: 'Suboptimal user experience',
                recommendation: `Improve ${subcategory} in ${category} category`,
                expectedEffect: 'Better user satisfaction and engagement',
                priority: priority
              })
            }
          }
        })
      }
    })
  }

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
 * Извлекает информацию о целевой аудитории из анализа
 */
function extractAudienceFromAnalysis(interfaceAnalysis: any, recommendations: any): string {
  const usabilityScore = interfaceAnalysis?.usability ? 
    (Object.values(interfaceAnalysis.usability) as any[]).reduce((a: number, b: any) => 
      a + (typeof b === 'number' ? b : 0), 0
    ) / Object.keys(interfaceAnalysis.usability).length : 5
  
  if (usabilityScore > 7) {
    return 'Tech-savvy users who appreciate well-designed interfaces and efficient workflows'
  } else if (usabilityScore > 5) {
    return 'General users who need clear guidance and intuitive navigation'
  } else {
    return 'Users who require significant assistance and simplified interfaces'
  }
}

/**
 * Извлекает основную боль пользователей из анализа
 */
function extractMainPainFromAnalysis(interfaceAnalysis: any, recommendations: any): string {
  const lowScoreAreas: string[] = []
  
  if (interfaceAnalysis) {
    Object.entries(interfaceAnalysis).forEach(([category, categoryData]: [string, any]) => {
      if (categoryData && typeof categoryData === 'object') {
        Object.entries(categoryData).forEach(([subcategory, score]: [string, any]) => {
          if (typeof score === 'number' && score < 6) {
            lowScoreAreas.push(`${category} ${subcategory}`)
          }
        })
      }
    })
  }
  
  if (lowScoreAreas.length > 0) {
    return `Users struggle with ${lowScoreAreas.join(', ')} which creates friction in their workflow`
  }
  
  return 'Users need better interface design and improved usability to achieve their goals efficiently'
}

/**
 * Извлекает страхи пользователей из анализа
 */
function extractFearsFromAnalysis(interfaceAnalysis: any, recommendations: any): string[] {
  const fears: string[] = []
  
  if (interfaceAnalysis?.accessibility && (Object.values(interfaceAnalysis.accessibility) as any[]).some((score: any) => score < 7)) {
    fears.push('Interface may not be accessible to all users')
  }
  
  if (interfaceAnalysis?.functionality?.performance && interfaceAnalysis.functionality.performance < 7) {
    fears.push('Slow performance may cause frustration')
  }
  
  if (interfaceAnalysis?.usability && (Object.values(interfaceAnalysis.usability) as any[]).some((score: any) => score < 6)) {
    fears.push('Complex interface may be difficult to use')
  }
  
  if (fears.length === 0) {
    fears.push('Users may abandon tasks if interface is confusing')
  }
  
  return fears
}

/**
 * Извлекает поведенческие паттерны из анализа
 */
function extractBehavioralPatterns(interfaceAnalysis: any): string {
  if (!interfaceAnalysis) return 'Users follow standard interaction patterns'
  
  const avgScore = calculateAverageScore(interfaceAnalysis)
  
  if (avgScore > 7) {
    return 'Users demonstrate confident navigation and efficient task completion with minimal hesitation'
  } else if (avgScore > 5) {
    return 'Users show mixed behavior - some areas work well while others cause confusion and slower task completion'
  } else {
    return 'Users exhibit hesitant behavior, frequent backtracking, and may abandon tasks due to interface complexity'
  }
}

/**
 * Извлекает точки трения из анализа
 */
function extractFrictionPoints(interfaceAnalysis: any, recommendations: any): any[] {
  const frictionPoints: any[] = []
  
  if (interfaceAnalysis) {
    Object.entries(interfaceAnalysis).forEach(([category, categoryData]: [string, any]) => {
      if (categoryData && typeof categoryData === 'object') {
        Object.entries(categoryData).forEach(([subcategory, score]: [string, any]) => {
          if (typeof score === 'number' && score < 6) {
            frictionPoints.push({
              point: `${category} - ${subcategory}: Score ${score}/10`,
              impact: score < 4 ? 'major' : 'minor'
            })
          }
        })
      }
    })
  }
  
  return frictionPoints
}

/**
 * Вычисляет средний балл по всем категориям
 */
function calculateAverageScore(interfaceAnalysis: any): number {
  let totalScore = 0
  let scoreCount = 0
  
  (Object.values(interfaceAnalysis) as any[]).forEach((categoryData: any) => {
    if (categoryData && typeof categoryData === 'object') {
      (Object.values(categoryData) as any[]).forEach((score: any) => {
        if (typeof score === 'number') {
          totalScore += score
          scoreCount++
        }
      })
    }
  })
  
  return scoreCount > 0 ? totalScore / scoreCount : 5
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