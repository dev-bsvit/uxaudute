/**
 * TypeScript типы для структурированного JSON ответа UX анализа
 */

// Блок "Описание экрана"
export interface ScreenDescription {
  screenType: string
  userGoal: string
  keyElements: string[]
  confidence: number
  confidenceReason: string
}

// Блок "UX-опрос"
export interface UXQuestion {
  id: number
  question: string
  options: string[]
  scores: number[]
  confidence: number
}

export interface UXSurvey {
  questions: UXQuestion[]
  overallConfidence: number
}

// Блок "Проблемы и решения"
export interface ProblemSolution {
  element: string
  problem: string
  principle: string
  consequence: string
  recommendation: string
  expectedEffect: string
  priority: 'high' | 'medium' | 'low'
}

// Блок "Self-Check & Confidence"
export interface SelfCheck {
  checklist: {
    coversAllElements: boolean
    noContradictions: boolean
    principlesJustified: boolean
    actionClarity: boolean
  }
  confidence: {
    analysis: number
    survey: number
    recommendations: number
  }
}

// Полная структура ответа
export interface StructuredAnalysisResponse {
  screenDescription: ScreenDescription
  uxSurvey: UXSurvey
  problemsAndSolutions: ProblemSolution[]
  selfCheck: SelfCheck
  metadata: {
    timestamp: string
    version: string
    model: string
  }
}

// Тип для обратной совместимости (текущий текстовый формат)
export interface LegacyAnalysisResponse {
  result: string
}

// Union тип для API ответа
export type AnalysisResponse = StructuredAnalysisResponse | LegacyAnalysisResponse

// Утилиты для проверки типа ответа
export function isStructuredResponse(response: AnalysisResponse): response is StructuredAnalysisResponse {
  return 'screenDescription' in response
}

export function isLegacyResponse(response: AnalysisResponse): response is LegacyAnalysisResponse {
  return 'result' in response
}
