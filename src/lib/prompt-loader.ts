import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Загружает основной промпт из файла
 */
export async function loadMainPrompt(locale: string = 'ru'): Promise<string> {
  try {
    let fileName = 'основной-промпт.md'
    if (locale === 'ua') fileName = 'основной-промпт-ua.md'
    else if (locale === 'en') fileName = 'main-prompt-en.md'
    
    const promptPath = join(process.cwd(), 'prompts', fileName)
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки промпта:', error)
    // Возвращаем fallback промпт
    return getFallbackPrompt(locale)
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
 * Загружает JSON-структурированный промпт v2
 */
export async function loadJSONPromptV2(locale: string = 'ru'): Promise<string> {
  try {
    let fileName = 'json-structured-prompt-v2.md'
    if (locale === 'ua') fileName = 'json-structured-prompt-ua.md'
    else if (locale === 'en') fileName = 'json-structured-prompt-en.md'
    
    const promptPath = join(process.cwd(), 'prompts', fileName)
    const prompt = readFileSync(promptPath, 'utf-8')
    return prompt
  } catch (error) {
    console.error('Ошибка загрузки JSON промпта v2:', error)
    // Возвращаем fallback промпт
    return getJSONFallbackPrompt(locale)
  }
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
 * Fallback промпт для JSON v2
 */
function getJSONFallbackPrompt(locale: string = 'ru'): string {
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
  "audience": {
    "targetAudience": "Целевая аудитория - детальный портрет в 1-2 абзаца",
    "mainPain": "Основная боль пользователей в 1 абзаце",
    "fears": ["Страх 1", "Страх 2", "Страх 3"]
  },
  "behavior": {
    "userScenarios": {
      "idealPath": "Идеальный путь пользователя в 1 абзаце",
      "typicalMistake": "Типичная ошибка в 1 абзаце",
      "alternativeWorkaround": "Альтернативный обход в 1 абзаце"
    },
    "behavioralPatterns": ["Паттерн 1", "Паттерн 2", "Паттерн 3"],
    "frictionPoints": [
      {"point": "Точка трения 1", "impact": "major"},
      {"point": "Точка трения 2", "impact": "minor"}
    ],
    "actionMotivation": "Мотивация к действию в 1 абзаце"
  },
  "problemsAndSolutions": [
    {
      "element": "Название элемента",
      "problem": "Описание проблемы",
      "principle": "Нарушенный принцип UX",
      "recommendation": "Конкретная рекомендация",
      "priority": "high/medium/low"
    }
  ],
  "selfCheck": {
    "checklist": {
      "coversAllElements": true,
      "noContradictions": true,
      "principlesJustified": true,
      "actionClarity": true
    },
    "confidence": {
      "analysis": 85,
      "survey": 82,
      "recommendations": 88
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T12:00:00Z",
    "version": "1.0",
    "locale": "${locale === 'ua' ? 'ua' : locale === 'en' ? 'en' : 'ru'}",
    "analysisType": "screenshot"
  }
}

**Отвечай ТОЛЬКО в формате JSON на ${locale === 'ua' ? 'украинском' : locale === 'en' ? 'английском' : 'русском'} языке.**`
}

/**
 * Fallback промпт на случай ошибки загрузки файла
 */
function getFallbackPrompt(locale: string = 'ru'): string {
  return `🧑‍💻 Роль: Вы — опытный UX-дизайнер-исследователь с 20-летним стажем. Основывайтесь на проверенных UX-методологиях: эвристики Нильсена, WCAG 2.2, Fitts' Law, Hick-Hyman, ISO 9241 и др.

Вход: статичный скриншот экрана (обязателен) + при возможности контекст задачи и целевая аудитория.

Выход:
1. Описание экрана
2. UX-опрос с 5 вопросами
3. Проблемы и рекомендации
4. Self-Check & Confidence

Отвечай на ${locale === 'ua' ? 'украинском' : locale === 'en' ? 'английском' : 'русском'} языке.`
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







