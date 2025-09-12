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
 * Загружает промпт для Sonoma Sky Alpha
 */
export async function loadSonomaStructuredPrompt(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), 'prompts', 'sonoma-structured-prompt.md')
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки промпта Sonoma:', error)
    // Возвращаем fallback промпт для Sonoma
    return getSonomaFallbackPrompt()
  }
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

/**
 * Fallback промпт для Sonoma Sky Alpha
 */
function getSonomaFallbackPrompt(): string {
  return `Вы — опытный UX-дизайнер-исследователь с 20-летним стажем. Основывайтесь на проверенных UX-методологиях: эвристики Нильсена, WCAG 2.2, Fitts' Law, Hick-Hyman, ISO 9241 и др.

Вход: статичный скриншот экрана (обязателен) + при возможности контекст задачи и целевая аудитория.

Выход: Отвечай ТОЛЬКО в формате JSON на русском языке.

{
  "screenDescription": {
    "screenType": "тип экрана",
    "userGoal": "цель пользователя",
    "keyElements": ["список элементов"],
    "confidence": 85,
    "confidenceReason": "обоснование"
  },
  "uxSurvey": {
    "questions": [
      {
        "id": 1,
        "question": "вопрос",
        "options": ["A) вариант", "B) вариант", "C) вариант"],
        "scores": [60, 30, 10],
        "confidence": 85,
        "category": "clarity",
        "principle": "принцип UX",
        "explanation": "объяснение"
      }
    ]
  },
  "problemsAndSolutions": [
    {
      "element": "элемент",
      "problem": "проблема",
      "principle": "принцип",
      "recommendation": "рекомендация",
      "priority": "high/medium/low"
    }
  ]
}

Отвечай ТОЛЬКО в формате JSON на русском языке.`
}







