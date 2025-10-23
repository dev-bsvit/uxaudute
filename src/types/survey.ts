import { QuestionType, SurveyQuestion } from '@/lib/survey-question-bank'

/**
 * Типы для системы опросов
 */

// Реэкспорт типов из survey-question-bank
export type { QuestionType, SurveyQuestion }

export interface SurveyQuestionInstance extends SurveyQuestion {
  // Уникальный ID для инстанса вопроса (используется для drag-and-drop)
  instance_id: string
  // Порядок в опросе
  order: number
  // Является ли вопрос обязательным
  required: boolean
  // Добавлен ли пользователем (не из банка)
  is_custom: boolean
  // В каком пуле находится вопрос
  pool: 'main' | 'additional'
}

export interface Survey {
  id: string
  project_id: string
  user_id: string
  name: string
  description?: string

  // Скриншот интерфейса для анализа
  screenshot_url?: string

  // Intro Screen (Шаг 1)
  intro_image_url?: string
  intro_title?: string
  intro_description?: string

  // Thank You Screen (Шаг 3)
  thank_you_text?: string
  thank_you_link?: string
  thank_you_promo_code?: string

  // Информация о проекте (если загружена)
  projects?: {
    id: string
    name: string
  }

  // Вопросы, сгенерированные AI (20 вопросов)
  ai_questions: SurveyQuestionInstance[]

  // Вопросы из банка, признанные релевантными
  selected_bank_questions: SurveyQuestionInstance[]

  // Основной пул - показывается сразу
  main_questions: SurveyQuestionInstance[]

  // Дополнительный пул - скрыт, можно добавить вручную
  additional_questions: SurveyQuestionInstance[]

  // Статус опроса
  status: 'draft' | 'published' | 'closed'

  // Настройки
  settings: SurveySettings

  // Метаданные
  created_at: string
  updated_at: string
  published_at?: string

  // Статистика
  responses_count: number
  avg_completion_time?: number
}

export interface SurveySettings {
  // Язык опроса
  language: 'ru' | 'en'

  // Показывать прогресс
  show_progress: boolean

  // Разрешить анонимные ответы
  allow_anonymous: boolean

  // Требовать email
  require_email: boolean

  // Показывать powered by
  show_branding: boolean

  // Автоматически закрыть после N ответов
  auto_close_after?: number

  // Сообщение после завершения
  completion_message?: {
    ru: string
    en: string
  }

  // Редирект после завершения
  redirect_url?: string
}

export interface SurveyResponse {
  id: string
  survey_id: string

  // Ответы на вопросы
  answers: SurveyAnswer[]

  // Информация о респонденте
  respondent_email?: string
  respondent_id?: string // если не анонимный

  // Метрики
  started_at: string
  completed_at: string
  completion_time_seconds: number

  // Метаданные
  user_agent?: string
  ip_address?: string
  country?: string
}

export interface SurveyAnswer {
  question_instance_id: string
  question_id: string // ID вопроса из банка
  question_text: string // Текст вопроса на момент ответа
  question_type: QuestionType

  // Различные типы ответов
  answer_yes_no?: boolean
  answer_text?: string
  answer_rating?: number // 1-5 или 1-10
  answer_scale?: number // для частоты использования и т.д.

  // Время ответа
  answered_at: string
  time_spent_seconds: number
}

export interface SurveyAnalytics {
  survey_id: string

  // Общая статистика
  total_responses: number
  completion_rate: number // % завершивших из начавших
  avg_completion_time: number

  // Статистика по вопросам
  question_stats: QuestionStat[]

  // Временные метрики
  responses_over_time: {
    date: string
    count: number
  }[]

  // Демография (если собирается)
  demographics?: {
    countries: { country: string; count: number }[]
  }
}

export interface QuestionStat {
  question_instance_id: string
  question_id: string
  question_text: string
  question_type: QuestionType

  // Количество ответов
  responses_count: number

  // Статистика для yes-no
  yes_count?: number
  no_count?: number
  yes_percentage?: number

  // Статистика для rating/scale
  avg_rating?: number
  rating_distribution?: { rating: number; count: number }[]

  // Текстовые ответы
  text_answers?: string[]

  // Среднее время ответа
  avg_time_seconds: number
}

// Фильтры для банка вопросов при отображении
export interface QuestionBankFilters {
  categories?: string[]
  tags?: string[]
  types?: QuestionType[]
  search?: string
}

// Действия с вопросами в редакторе
export type QuestionAction =
  | { type: 'ADD_TO_MAIN'; questionId: string }
  | { type: 'ADD_TO_ADDITIONAL'; questionId: string }
  | { type: 'REMOVE'; instanceId: string }
  | { type: 'MOVE_TO_MAIN'; instanceId: string }
  | { type: 'MOVE_TO_ADDITIONAL'; instanceId: string }
  | { type: 'REORDER'; instanceId: string; newOrder: number }
  | { type: 'UPDATE_TEXT'; instanceId: string; text: string }
  | { type: 'UPDATE_TYPE'; instanceId: string; questionType: QuestionType }
  | { type: 'TOGGLE_REQUIRED'; instanceId: string }
  | { type: 'ADD_CUSTOM'; text: string; questionType: QuestionType; pool: 'main' | 'additional' }
