import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Action types for UX analysis
export type ActionType = 'research' | 'collect' | 'analytics' | 'ab-test' | 'hypotheses'

// Available actions for UX analysis
export const ACTIONS = [
  {
    id: 'research' as ActionType,
    label: 'Исследование',
    description: 'Основной UX анализ интерфейса'
  },
  {
    id: 'collect' as ActionType,
    label: 'Собрать данные',
    description: 'Сбор требований и дополнительной информации'
  },
  {
    id: 'analytics' as ActionType,
    label: 'Аналитика',
    description: 'Бизнес-анализ и метрики'
  },
  {
    id: 'ab-test' as ActionType,
    label: 'A/B тест',
    description: 'Предложения для тестирования'
  },
  {
    id: 'hypotheses' as ActionType,
    label: 'Гипотезы',
    description: 'Генерация гипотез для улучшения'
  }
]
