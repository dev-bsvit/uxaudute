/**
 * Утилиты для работы с UX-опросами
 */

import { UXQuestion, UXSurvey } from './analysis-types'

/**
 * Категории вопросов с описаниями
 */
export const QUESTION_CATEGORIES = {
  clarity: {
    name: 'Ясность цели',
    description: 'Понятность основной цели страницы и сообщений',
    color: 'blue'
  },
  usability: {
    name: 'Удобство использования',
    description: 'Простота и интуитивность взаимодействия',
    color: 'green'
  },
  accessibility: {
    name: 'Доступность',
    description: 'Доступность для пользователей с ограниченными возможностями',
    color: 'purple'
  },
  conversion: {
    name: 'Конверсия',
    description: 'Мотивация к выполнению целевых действий',
    color: 'orange'
  },
  navigation: {
    name: 'Навигация',
    description: 'Поиск информации и ориентация на сайте',
    color: 'cyan'
  },
  content: {
    name: 'Контент',
    description: 'Визуальная иерархия и подача информации',
    color: 'pink'
  }
} as const

/**
 * Анализирует результаты опроса и выявляет проблемы
 */
export function analyzeSurveyResults(survey: UXSurvey): {
  criticalIssues: UXQuestion[]
  recommendations: string[]
  categoryScores: Record<string, number>
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
} {
  const criticalIssues: UXQuestion[] = []
  const categoryScores: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}

  // Анализируем каждый вопрос
  survey.questions.forEach(question => {
    const category = question.category
    const maxScore = Math.max(...question.scores)
    const avgScore = question.scores.reduce((a, b) => a + b, 0) / question.scores.length

    // Накапливаем оценки по категориям
    if (!categoryScores[category]) {
      categoryScores[category] = 0
      categoryCounts[category] = 0
    }
    categoryScores[category] += avgScore
    categoryCounts[category] += 1

    // Выявляем критические проблемы (низкие оценки)
    if (maxScore < 50 || avgScore < 30) {
      criticalIssues.push(question)
    }
  })

  // Вычисляем средние оценки по категориям
  Object.keys(categoryScores).forEach(category => {
    categoryScores[category] = categoryScores[category] / categoryCounts[category]
  })

  // Генерируем рекомендации
  const recommendations: string[] = []
  
  if (categoryScores.clarity < 60) {
    recommendations.push('Улучшить ясность основной цели страницы')
  }
  if (categoryScores.usability < 60) {
    recommendations.push('Упростить взаимодействие с интерфейсом')
  }
  if (categoryScores.accessibility < 60) {
    recommendations.push('Повысить доступность для всех пользователей')
  }
  if (categoryScores.conversion < 60) {
    recommendations.push('Усилить мотивацию к выполнению действий')
  }
  if (categoryScores.navigation < 60) {
    recommendations.push('Улучшить навигацию и поиск информации')
  }
  if (categoryScores.content < 60) {
    recommendations.push('Оптимизировать визуальную иерархию')
  }

  // Определяем общее состояние
  const avgScore = Object.values(categoryScores).reduce((a, b) => a + b, 0) / Object.keys(categoryScores).length
  let overallHealth: 'excellent' | 'good' | 'fair' | 'poor'
  
  if (avgScore >= 80) overallHealth = 'excellent'
  else if (avgScore >= 60) overallHealth = 'good'
  else if (avgScore >= 40) overallHealth = 'fair'
  else overallHealth = 'poor'

  return {
    criticalIssues,
    recommendations,
    categoryScores,
    overallHealth
  }
}

/**
 * Генерирует вопросы на основе контекста
 */
export function generateContextualQuestions(context?: string): Partial<UXQuestion>[] {
  if (!context) return []

  const questions: Partial<UXQuestion>[] = []

  // E-commerce вопросы
  if (context.toLowerCase().includes('магазин') || context.toLowerCase().includes('товар')) {
    questions.push({
      question: 'Насколько легко добавить товар в корзину?',
      options: ['A) Очень легко', 'B) Затруднительно', 'C) Невозможно'],
      category: 'conversion',
      principle: 'Принцип простоты действия (Action Simplicity)',
      explanation: 'Процесс покупки должен быть максимально простым'
    })
  }

  // SaaS вопросы
  if (context.toLowerCase().includes('saas') || context.toLowerCase().includes('подписка')) {
    questions.push({
      question: 'Насколько понятны преимущества подписки?',
      options: ['A) Очень понятны', 'B) Частично понятны', 'C) Непонятны'],
      category: 'clarity',
      principle: 'Принцип ценности предложения (Value Proposition)',
      explanation: 'Пользователь должен понимать, что получит за свои деньги'
    })
  }

  // Формы вопросы
  if (context.toLowerCase().includes('форма') || context.toLowerCase().includes('регистрация')) {
    questions.push({
      question: 'Насколько понятны требования к заполнению формы?',
      options: ['A) Очень понятны', 'B) Частично понятны', 'C) Непонятны'],
      category: 'usability',
      principle: 'Принцип ясности требований (Requirements Clarity)',
      explanation: 'Пользователь должен знать, какие данные и в каком формате вводить'
    })
  }

  return questions
}

/**
 * Валидирует структуру опроса
 */
export function validateSurvey(survey: UXSurvey): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Проверяем наличие вопросов
  if (!survey.questions || survey.questions.length === 0) {
    errors.push('Опрос должен содержать хотя бы один вопрос')
  }

  // Проверяем каждый вопрос
  survey.questions.forEach((question, index) => {
    if (!question.question) {
      errors.push(`Вопрос ${index + 1}: отсутствует текст вопроса`)
    }
    if (!question.options || question.options.length < 2) {
      errors.push(`Вопрос ${index + 1}: должно быть минимум 2 варианта ответа`)
    }
    if (!question.scores || question.scores.length !== question.options.length) {
      errors.push(`Вопрос ${index + 1}: количество оценок должно соответствовать количеству вариантов`)
    }
    if (question.scores) {
      const total = question.scores.reduce((a, b) => a + b, 0)
      if (Math.abs(total - 100) > 1) {
        errors.push(`Вопрос ${index + 1}: сумма оценок должна быть 100% (получено ${total}%)`)
      }
    }
    if (question.confidence < 0 || question.confidence > 100) {
      errors.push(`Вопрос ${index + 1}: уверенность должна быть от 0 до 100`)
    }
    if (!question.category) {
      errors.push(`Вопрос ${index + 1}: должна быть указана категория`)
    }
  })

  // Проверяем общую уверенность
  if (survey.overallConfidence < 0 || survey.overallConfidence > 100) {
    errors.push('Общая уверенность должна быть от 0 до 100')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
