import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const TEXTS = {
  success: "Задача выполнена успешно",
  error: "Не удалось выполнить действие. Проверьте входные данные или попробуйте позже",
  validation: "Пожалуйста, добавьте ссылку или скриншот, прежде чем начинать исследование",
  emptyState: "У вас пока нет проектов. Создайте первый, чтобы начать аудит",
  hint: "Каждый шаг завершается кнопками для следующего действия"
}

export const ACTIONS = [
  { id: 'research', label: 'Начать исследование' },
  { id: 'collect', label: 'Собрать в один' },
  { id: 'business', label: 'Бизнес-аналитика' },
  { id: 'ab_test', label: 'Подготовить A/B тест' },
  { id: 'hypotheses', label: 'Создать гипотезы' }
] as const

export type ActionType = typeof ACTIONS[number]['id']
