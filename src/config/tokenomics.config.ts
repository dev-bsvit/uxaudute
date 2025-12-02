/**
 * =====================================================
 * ЦЕНТРАЛИЗОВАННЫЙ КОНФИГ ТОКЕНОМИКИ
 * =====================================================
 * Версия: 2.0
 * Дата: 01.12.2025
 *
 * Этот файл содержит ВСЮ информацию о токеномике проекта.
 * Все изменения цен, стоимости аудитов и подписок делаются ЗДЕСЬ.
 */

// =====================================================
// 1. ТИПЫ АУДИТОВ И ИХ СТОИМОСТЬ
// =====================================================

export type AuditType = 'research' | 'ab_test' | 'business' | 'hypotheses' | 'survey' | 'all_audits'

export interface AuditCostConfig {
  type: AuditType
  credits: number
  name: string
  nameRu: string
  description: string
  descriptionRu: string
  isActive: boolean
}

export const AUDIT_COSTS: Record<AuditType, AuditCostConfig> = {
  research: {
    type: 'research',
    credits: 2,
    name: 'UX Research',
    nameRu: 'UX Исследование',
    description: 'Comprehensive UX research analysis',
    descriptionRu: 'Комплексный анализ UX исследования',
    isActive: true
  },
  ab_test: {
    type: 'ab_test',
    credits: 1,
    name: 'A/B Test Analysis',
    nameRu: 'Анализ A/B теста',
    description: 'A/B testing analysis and recommendations',
    descriptionRu: 'Анализ A/B тестирования и рекомендации',
    isActive: true
  },
  business: {
    type: 'business',
    credits: 1,
    name: 'Business Analysis',
    nameRu: 'Бизнес анализ',
    description: 'Business metrics and analytics',
    descriptionRu: 'Бизнес метрики и аналитика',
    isActive: true
  },
  hypotheses: {
    type: 'hypotheses',
    credits: 1,
    name: 'Hypotheses Generation',
    nameRu: 'Генерация гипотез',
    description: 'Generate and validate hypotheses',
    descriptionRu: 'Генерация и валидация гипотез',
    isActive: true
  },
  survey: {
    type: 'survey',
    credits: 1,
    name: 'Survey Analysis',
    nameRu: 'Анализ опроса',
    description: 'Survey creation and analysis',
    descriptionRu: 'Создание и анализ опросов',
    isActive: true
  },
  all_audits: {
    type: 'all_audits',
    credits: 4,
    name: 'All Audits Bundle',
    nameRu: 'Все типы аудитов',
    description: 'Run all 4 audit types at once (Research + AB Test + Business + Hypotheses)',
    descriptionRu: 'Запуск всех 4 типов аудитов одновременно (Research + AB Test + Business + Hypotheses)',
    isActive: true
  }
}

// =====================================================
// 2. ПАКЕТЫ КРЕДИТОВ ДЛЯ ПОКУПКИ
// =====================================================

export type PackageType = 'basic' | 'pro' | 'team'

export interface CreditPackage {
  id: PackageType
  credits: number
  priceUSD: number // Цена в долларах (LiqPay конвертирует в любую валюту)
  name: string
  nameRu: string
  isPopular: boolean
  savings?: string
  savingsRu?: string
  features: string[]
  featuresRu: string[]
}

export const CREDIT_PACKAGES: Record<PackageType, CreditPackage> = {
  basic: {
    id: 'basic',
    credits: 10,
    priceUSD: 1.99,
    name: 'Basic',
    nameRu: 'Базовий',
    isPopular: false,
    features: [
      '10 credits',
      '~5 research audits',
      '~10 quick audits',
      'Valid for 1 year'
    ],
    featuresRu: [
      '10 кредитів',
      '~5 досліджень',
      '~10 швидких аудитів',
      'Дійсний 1 рік'
    ]
  },
  pro: {
    id: 'pro',
    credits: 50,
    priceUSD: 8.99,
    name: 'Pro',
    nameRu: 'Про',
    isPopular: true,
    savings: 'Save 10%',
    savingsRu: 'Знижка 10%',
    features: [
      '50 credits',
      '~25 research audits',
      '~50 quick audits',
      'Valid for 1 year',
      'Priority support'
    ],
    featuresRu: [
      '50 кредитів',
      '~25 досліджень',
      '~50 швидких аудитів',
      'Дійсний 1 рік',
      'Пріоритетна підтримка'
    ]
  },
  team: {
    id: 'team',
    credits: 200,
    priceUSD: 29.99,
    name: 'Team',
    nameRu: 'Команда',
    isPopular: false,
    savings: 'Save 25%',
    savingsRu: 'Знижка 25%',
    features: [
      '200 credits',
      '~100 research audits',
      '~200 quick audits',
      'Valid for 1 year',
      'Priority support',
      'Team collaboration'
    ],
    featuresRu: [
      '200 кредитів',
      '~100 досліджень',
      '~200 швидких аудитів',
      'Дійсний 1 рік',
      'Пріоритетна підтримка',
      'Командна робота'
    ]
  }
}

// =====================================================
// 3. ПОДПИСКИ
// =====================================================

export type SubscriptionType = 'monthly_basic' | 'monthly_pro' | 'yearly_basic' | 'yearly_pro'

export interface SubscriptionPlan {
  id: SubscriptionType
  name: string
  nameRu: string
  priceUSD: number // Цена в долларах (LiqPay конвертирует в любую валюту)
  billingPeriod: 'monthly' | 'yearly'
  dailyLimit: number // Лимит запросов в день
  features: string[]
  featuresRu: string[]
  isActive: boolean
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionType, SubscriptionPlan> = {
  monthly_basic: {
    id: 'monthly_basic',
    name: 'Monthly Basic',
    nameRu: 'Місячна базова',
    priceUSD: 9.99,
    billingPeriod: 'monthly',
    dailyLimit: 10,
    features: [
      '10 requests per day',
      'No credits required',
      'All audit types available',
      'Email support'
    ],
    featuresRu: [
      '10 запитів на день',
      'Кредити не потрібні',
      'Всі типи аудитів доступні',
      'Email підтримка'
    ],
    isActive: true
  },
  monthly_pro: {
    id: 'monthly_pro',
    name: 'Monthly Pro',
    nameRu: 'Місячна про',
    priceUSD: 19.99,
    billingPeriod: 'monthly',
    dailyLimit: 25,
    features: [
      '25 requests per day',
      'No credits required',
      'All audit types available',
      'Priority support',
      'Advanced analytics'
    ],
    featuresRu: [
      '25 запитів на день',
      'Кредити не потрібні',
      'Всі типи аудитів доступні',
      'Пріоритетна підтримка',
      'Розширена аналітика'
    ],
    isActive: true
  },
  yearly_basic: {
    id: 'yearly_basic',
    name: 'Yearly Basic',
    nameRu: 'Річна базова',
    priceUSD: 99.99,
    billingPeriod: 'yearly',
    dailyLimit: 10,
    features: [
      '10 requests per day',
      'No credits required',
      'All audit types available',
      'Email support',
      'Save 17% vs monthly'
    ],
    featuresRu: [
      '10 запитів на день',
      'Кредити не потрібні',
      'Всі типи аудитів доступні',
      'Email підтримка',
      'Економія 17% vs місяць'
    ],
    isActive: true
  },
  yearly_pro: {
    id: 'yearly_pro',
    name: 'Yearly Pro',
    nameRu: 'Річна про',
    priceUSD: 199.99,
    billingPeriod: 'yearly',
    dailyLimit: 25,
    features: [
      '25 requests per day',
      'No credits required',
      'All audit types available',
      'Priority support',
      'Advanced analytics',
      'Save 17% vs monthly'
    ],
    featuresRu: [
      '25 запитів на день',
      'Кредити не потрібні',
      'Всі типи аудитів доступні',
      'Пріоритетна підтримка',
      'Розширена аналітика',
      'Економія 17% vs місяць'
    ],
    isActive: true
  }
}

// =====================================================
// 4. НАЧАЛЬНЫЕ БОНУСЫ
// =====================================================

export const WELCOME_BONUS = {
  credits: 5,
  source: 'welcome',
  description: 'Welcome bonus! Initial 5 credits',
  descriptionRu: 'Добро пожаловать! Начальный баланс 5 кредитов'
}

// =====================================================
// 5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// =====================================================

/**
 * Получить стоимость аудита по типу
 */
export function getAuditCost(auditType: AuditType): number {
  return AUDIT_COSTS[auditType]?.credits || 0
}

/**
 * Получить информацию о пакете по ID
 */
export function getPackageById(packageId: PackageType): CreditPackage | undefined {
  return CREDIT_PACKAGES[packageId]
}

/**
 * Получить информацию о подписке по ID
 */
export function getSubscriptionById(subscriptionId: SubscriptionType): SubscriptionPlan | undefined {
  return SUBSCRIPTION_PLANS[subscriptionId]
}

/**
 * Проверить, активен ли тип аудита
 */
export function isAuditTypeActive(auditType: AuditType): boolean {
  return AUDIT_COSTS[auditType]?.isActive || false
}

/**
 * Получить все активные типы аудитов
 */
export function getActiveAuditTypes(): AuditType[] {
  return Object.keys(AUDIT_COSTS).filter(type =>
    AUDIT_COSTS[type as AuditType].isActive
  ) as AuditType[]
}

/**
 * Получить все активные пакеты
 */
export function getActivePackages(): CreditPackage[] {
  return Object.values(CREDIT_PACKAGES)
}

/**
 * Получить все активные подписки
 */
export function getActiveSubscriptions(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS).filter(plan => plan.isActive)
}


/**
 * Получить цену за кредит для пакета (в долларах)
 */
export function getPricePerCredit(packageId: PackageType): number {
  const pkg = CREDIT_PACKAGES[packageId]
  if (!pkg) return 0

  return Number((pkg.priceUSD / pkg.credits).toFixed(2))
}

// =====================================================
// 6. ПЛАТЕЖНАЯ СИСТЕМА
// =====================================================

// Используем только LiqPay (поддерживает любую валюту через автоконвертацию)
export const PAYMENT_PROVIDER = 'liqpay' as const

export type PaymentProvider = typeof PAYMENT_PROVIDER

// =====================================================
// 7. ЭКСПОРТ ТИПОВ
// =====================================================

export type { CreditPackage, SubscriptionPlan, AuditCostConfig }
