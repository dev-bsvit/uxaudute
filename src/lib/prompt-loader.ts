import { readFileSync } from 'fs'
import { join } from 'path'
import { promptService, PromptType, FALLBACK_LANGUAGE } from '@/lib/i18n'

/**
 * Загружает основной промпт из файла с поддержкой языков
 */
export async function loadMainPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.MAIN, language)
  } catch (error) {
    console.error('Ошибка загрузки промпта:', error)
    // Возвращаем fallback промпт
    return getFallbackPrompt()
  }
}

/**
 * Загружает основной промпт из файла (legacy функция для обратной совместимости)
 */
export async function loadMainPromptLegacy(): Promise<string> {
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
 * Объединяет основной промпт с контекстом с поддержкой языков
 */
export function combineWithContext(mainPrompt: string, context?: string, language: string = FALLBACK_LANGUAGE): string {
  return promptService.combineWithContext(mainPrompt, context, language)
}

/**
 * Объединяет основной промпт с контекстом (legacy функция для обратной совместимости)
 */
export function combineWithContextLegacy(mainPrompt: string, context?: string): string {
  if (!context || context.trim() === '') {
    return mainPrompt
  }

  return `${mainPrompt}

## Дополнительный контекст
${context}

Учти этот контекст при анализе и адаптируй вопросы под специфику бизнеса и аудитории.`
}

/**
 * Загружает JSON-структурированный промпт с поддержкой языков
 */
export async function loadJSONPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.JSON_STRUCTURED, language)
  } catch (error) {
    console.error('Ошибка загрузки JSON промпта:', error)
    // Возвращаем fallback промпт
    return getJSONFallbackPrompt()
  }
}

/**
 * Загружает JSON-структурированный промпт v2 (legacy функция для обратной совместимости)
 */
export async function loadJSONPromptV2(): Promise<string> {
  try {
    const promptPath = join(process.cwd(), 'prompts', 'json-structured-prompt-v2.md')
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки JSON промпта v2:', error)
    // Возвращаем fallback промпт
    return getJSONFallbackPrompt()
  }
}

/**
 * Загружает промпт для Sonoma Sky Alpha с поддержкой языков
 */
export async function loadSonomaStructuredPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.SONOMA_STRUCTURED, language)
  } catch (error) {
    console.error('Ошибка загрузки промпта Sonoma:', error)
    // Возвращаем fallback промпт для Sonoma
    return getSonomaFallbackPrompt()
  }
}

/**
 * Загружает промпт для Sonoma Sky Alpha (legacy функция для обратной совместимости)
 */
export async function loadSonomaStructuredPromptLegacy(): Promise<string> {
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
 * Загружает промпт для AB тестирования с поддержкой языков
 */
export async function loadABTestPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.AB_TEST, language)
  } catch (error) {
    console.error('Ошибка загрузки AB test промпта:', error)
    return getABTestFallbackPrompt()
  }
}

/**
 * Загружает промпт для бизнес-аналитики с поддержкой языков
 */
export async function loadBusinessAnalyticsPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.BUSINESS_ANALYTICS, language)
  } catch (error) {
    console.error('Ошибка загрузки business analytics промпта:', error)
    return getBusinessAnalyticsFallbackPrompt()
  }
}

/**
 * Загружает промпт для гипотез с поддержкой языков
 */
export async function loadHypothesesPrompt(language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(PromptType.HYPOTHESES, language)
  } catch (error) {
    console.error('Ошибка загрузки hypotheses промпта:', error)
    return getHypothesesFallbackPrompt()
  }
}

/**
 * Универсальная функция для загрузки любого типа промпта
 */
export async function loadPromptByType(promptType: PromptType, language: string = FALLBACK_LANGUAGE): Promise<string> {
  try {
    return await promptService.loadPrompt(promptType, language)
  } catch (error) {
    console.error(`Ошибка загрузки промпта ${promptType}:`, error)
    return getGenericFallbackPrompt(promptType)
  }
}

/**
 * Fallback промпт для JSON v2
 */
function getJSONFallbackPrompt(): string {
  return `# JSON-структурированный промпт для UX-анализа

Вы — опытный UX-дизайнер-исследователь. Проанализируйте интерфейс и верните результат в формате JSON.

**КРИТИЧЕСКИ ВАЖНО: 
1. Отвечай ТОЛЬКО в формате JSON
2. НЕ добавляй никакого текста до или после JSON
3. НЕ оборачивай JSON в markdown блоки
4. НЕ добавляй объяснения или комментарии
5. Начинай ответ сразу с символа { и заканчивай символом }
6. Убедись, что JSON валидный и полный**

{
  "screenDescription": {
    "screenType": "Тип экрана",
    "userGoal": "Цель пользователя",
    "keyElements": ["Элемент 1", "Элемент 2"],
    "confidence": 85,
    "confidenceReason": "Обоснование уверенности"
  },
  "uxSurvey": {
    "questions": [
      {
        "id": 1,
        "question": "Вопрос для пользователя",
        "options": ["A) Вариант 1", "B) Вариант 2", "C) Вариант 3"],
        "scores": [60, 30, 10],
        "confidence": 85,
        "category": "clarity",
        "principle": "Принцип UX",
        "explanation": "Объяснение релевантности"
      }
    ]
  },
  "problemsAndSolutions": [
    {
      "element": "Название элемента",
      "problem": "Описание проблемы",
      "principle": "Нарушенный принцип UX",
      "recommendation": "Конкретная рекомендация",
      "priority": "high/medium/low"
    }
  ]
}

**Отвечай ТОЛЬКО в формате JSON на русском языке.**`
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

/**
 * Fallback промпт для AB тестирования
 */
function getABTestFallbackPrompt(): string {
  return `You are a Senior UI/UX & CRO consultant with 10+ years of experience. Generate A/B test recommendations based on UX audit data.

Focus on:
- High-impact changes that can improve conversion rates
- Specific, implementable solutions
- Clear success metrics
- Detailed implementation tasks

Respond with actionable A/B test recommendations.`
}

/**
 * Fallback промпт для бизнес-аналитики
 */
function getBusinessAnalyticsFallbackPrompt(): string {
  return `You are a business analyst with 10+ years of experience. Analyze the interface from a business perspective.

Focus on:
- Business metrics and KPIs
- Revenue impact assessment
- Risk analysis
- Conversion optimization opportunities

Provide practical business insights and recommendations.`
}

/**
 * Fallback промпт для гипотез
 */
function getHypothesesFallbackPrompt(): string {
  return `You are a product designer and UX researcher. Generate testable hypotheses for UX improvements.

Focus on:
- Specific, measurable hypotheses
- ICE scoring (Impact, Confidence, Effort)
- Clear validation methods
- User-centered improvements

Generate up to 10 prioritized hypotheses based on the analysis.`
}

/**
 * Универсальный fallback промпт
 */
function getGenericFallbackPrompt(promptType: PromptType): string {
  const prompts: Record<PromptType, string> = {
    [PromptType.MAIN]: getFallbackPrompt(),
    [PromptType.JSON_STRUCTURED]: getJSONFallbackPrompt(),
    [PromptType.SONOMA_STRUCTURED]: getSonomaFallbackPrompt(),
    [PromptType.AB_TEST]: getABTestFallbackPrompt(),
    [PromptType.BUSINESS_ANALYTICS]: getBusinessAnalyticsFallbackPrompt(),
    [PromptType.HYPOTHESES]: getHypothesesFallbackPrompt()
  }

  return prompts[promptType] || getFallbackPrompt()
}







