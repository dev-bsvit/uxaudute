import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Загружает основной промпт из файла
 */
export async function loadMainPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), 'prompts', 'основной-промпт.md')
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки промпта:', error)
    // Возвращаем fallback промпт
    return getFallbackPrompt()
  }
}

/**
 * Объединяет основной промпт с контекстом
 */
export function combineWithContext(mainPrompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return mainPrompt
  }

  return `${mainPrompt}

## Дополнительный контекст
${context}

Учти этот контекст при анализе и адаптируй вопросы под специфику бизнеса и аудитории.`
}

/**
 * Fallback промпт на случай ошибки загрузки файла
 */
function getFallbackPrompt(): string {
  return `🧑‍💻 Роль: Вы — опытный UX-дизайнер-исследователь с 20-летним стажем. Основывайтесь на проверенных UX-методологиях: эвристики Нильсена, WCAG 2.2, Fitts' Law, Hick-Hyman, ISO 9241 и др.

Вход: статичный скриншот экрана (обязателен) + при возможности контекст задачи и целевая аудитория.

Выход:
1. Описание экрана
2. UX-опрос с 5 вопросами
3. Проблемы и рекомендации
4. Self-Check & Confidence

Отвечай на русском языке.`
}


