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
  category: 'clarity' | 'usability' | 'accessibility' | 'conversion' | 'navigation' | 'content' | 'trust' | 'value'
  principle?: string // UX принцип, который тестируется
  explanation?: string // Объяснение вопроса
}

export interface UXSurvey {
  dynamicQuestionsAdded?: boolean // v2: были ли добавлены контекстные вопросы
  screenType?: string // v2: тип экрана для адаптации вопросов
  questions: UXQuestion[]
  overallConfidence: number
  summary: {
    totalQuestions: number
    averageConfidence: number
    criticalIssues: number // Количество критических проблем
    recommendations: string[] // Краткие рекомендации
  }
}

// Блок "Аудитория"
export interface Audience {
  targetAudience: string // Целевая аудитория - 1-2 абзаца
  mainPain: string // Основная боль - 1 абзац
  fears: string[] // Страхи - от 2 до 10 коротких предложений
}

// Блок "Поведение"
export interface UserScenarios {
  idealPath: string // Идеальный путь пользователя
  typicalError: string // Типичная ошибка пользователей
  alternativeWorkaround: string // Альтернативный обход проблем
}

export interface FrictionPoint {
  point: string // Описание точки трения
  impact: 'minor' | 'major' // Уровень влияния
}

export interface Behavior {
  userScenarios: UserScenarios // v2: объект вместо строки
  behavioralPatterns: string // Поведенческие паттерны - 1 абзац
  frictionPoints: FrictionPoint[] // v2: массив объектов вместо строк
  actionMotivation: string // Мотивация к действию - 1 абзац
}

// Блок "Проблемы и решения"
export interface BusinessImpact {
  metric: string // Метрика, на которую влияет проблема
  impactLevel: 'high' | 'medium' | 'low' // Уровень влияния
  description: string // Описание влияния на бизнес
}

export interface ProblemSolution {
  element: string
  problem: string
  principle: string
  consequence: string
  businessImpact?: BusinessImpact // v2: влияние на бизнес-метрики
  recommendation: string
  expectedEffect: string
  priority: 'high' | 'medium' | 'low'
  confidence?: number // v2: уверенность в рекомендации
  confidenceSource?: string // v2: источник уверенности
}

// Блок "Self-Check & Confidence"
export interface VarietyCheck {
  passed: boolean // Проверка на разнообразие рекомендаций
  description: string // Описание проверки
  principleVariety: string[] // Разнообразие принципов
  issueTypes: string[] // Типы проблем
}

export interface ConfidenceVariation {
  min: number // Минимальная уверенность
  max: number // Максимальная уверенность
  average: number // Средняя уверенность
  explanation: string // Объяснение вариации
}

export interface SelfCheck {
  checklist: {
    coversAllElements: boolean
    noContradictions: boolean
    principlesJustified: boolean
    actionClarity: boolean
  }
  varietyCheck?: VarietyCheck // v2: проверка на шаблонность
  confidence: {
    analysis: number
    survey: number
    recommendations: number
  }
  confidenceVariation?: ConfidenceVariation // v2: анализ вариации уверенности
}

// Полная структура ответа
export interface StructuredAnalysisResponse {
  screenDescription: ScreenDescription
  uxSurvey: UXSurvey
  audience?: Audience // Опционально для обратной совместимости
  behavior?: Behavior // Опционально для обратной совместимости
  problemsAndSolutions: ProblemSolution[]
  selfCheck: SelfCheck
  metadata: {
    timestamp: string
    version: string
    model: string
  }
  annotations?: string // Данные аннотаций изображения
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

// AB Test Types
export interface ABTestDetailedTasks {
  frontend: string[]
  backend: string[]
  analytics: string[]
  design: string[]
}

export interface ABTestTargetMetrics {
  primary: string
  baseline: string
  expected_uplift: string
}

export interface ABTestStatisticalPower {
  required_traffic: string
  duration_days: number
  alpha: number
}

export interface ABTest {
  id: string
  problem: string
  hypothesis: string
  solution: string
  detailed_tasks: ABTestDetailedTasks
  target_metrics: ABTestTargetMetrics
  confidence_score: number
  impact_score: number
  ease_score: number
  risk_mitigation: string
  statistical_power: ABTestStatisticalPower
}

export interface ABTestResponse {
  ab_tests: ABTest[]
  next_steps: string[]
  assumptions: string[]
  metadata: {
    timestamp: string
    version: string
    model: string
  }
}

// Утилита для проверки AB тестов
export function isABTestResponse(response: AllAnalysisResponse): response is ABTestResponse {
  return 'ab_tests' in response
}

// Hypotheses Types
export interface KPIMetric {
  metric: string
  current_value: string
  target_value: string
  industry_benchmark: string
}

export interface PainPoint {
  type: 'quantitative' | 'qualitative' | 'ux_heuristic'
  description: string
  impact: string
  frequency: string
}

export interface KPIAnalysis {
  current_metrics: KPIMetric[]
  pain_points: PainPoint[]
}

export interface ICEScore {
  impact: number
  confidence: number
  effort: number
  ice_total: number
}

export interface ValidationPlan {
  method: string
  duration: string
  sample_size: string
  delta_metrics: string[]
}

export interface Hypothesis {
  id: string
  title: string
  description: string
  problem: string
  solution: string
  user_story?: string
  ux_patterns?: string
  ice_score: ICEScore
  validation_plan: ValidationPlan
  priority: 'high' | 'medium' | 'low'
  effort_days: number
  confidence_score: number
  metrics: string[]
  assumptions: string[]
  is_top_3: boolean
}

export interface ICERanking {
  rank: number
  hypothesis_id: string
  ice_score: number
  impact: number
  confidence: number
  effort: number
}

export interface HypothesisResponse {
  kpi_analysis: KPIAnalysis
  hypotheses: Hypothesis[]
  ice_ranking: ICERanking[]
  next_steps: string[]
  metadata: {
    timestamp: string
    version: string
    model: string
  }
}

// Утилита для проверки гипотез
export function isHypothesisResponse(response: AllAnalysisResponse): response is HypothesisResponse {
  return 'hypotheses' in response
}

// Business Analytics Types
export interface ConversionFunnel {
  awareness: string
  interest: string
  consideration: string
  purchase: string
  retention: string
}

export interface KPI {
  metric: string
  current_value: string
  benchmark: string
  impact: string
  potential_improvement: string
}

export interface RevenueImpact {
  current_monthly_revenue: string
  potential_increase: string
  cost_of_issues: string
}

export interface UserBehaviorInsight {
  pattern: string
  description: string
  business_impact: string
  recommendation: string
}

export interface ConversionBarrier {
  barrier: string
  impact_level: 'high' | 'medium' | 'low'
  affected_users: string
  business_cost: string
  solution: string
}

export interface OptimizationOpportunity {
  opportunity: string
  potential_impact: string
  effort_required: 'high' | 'medium' | 'low'
  priority: 'high' | 'medium' | 'low'
  expected_roi: string
}

export interface BusinessAnalyticsResponse {
  industry_analysis: {
    identified_industry: string
    industry_standards: string
    market_context: string
  }
  business_metrics: {
    conversion_funnel: ConversionFunnel
    key_kpis: KPI[]
    revenue_impact: RevenueImpact
  }
  business_risks: BusinessRisk[]
  missed_opportunities: MissedOpportunity[]
  user_behavior_insights: UserBehaviorInsight[]
  conversion_barriers: ConversionBarrier[]
  next_steps: string[]
  metadata: {
    timestamp: string
    version: string
    model: string
  }
}

export interface BusinessRisk {
  risk: string
  severity: 'high' | 'medium' | 'low'
  affected_users: string
  business_consequences: string
  mitigation: string
}

export interface MissedOpportunity {
  opportunity: string
  potential_impact: string
  effort_required: 'high' | 'medium' | 'low'
  priority: 'high' | 'medium' | 'low'
  implementation: string
}

// Union тип для всех возможных ответов
export type AllAnalysisResponse = AnalysisResponse | ABTestResponse | HypothesisResponse | BusinessAnalyticsResponse

// Утилита для проверки бизнес аналитики
export function isBusinessAnalyticsResponse(response: AllAnalysisResponse): response is BusinessAnalyticsResponse {
  return 'business_metrics' in response
}
