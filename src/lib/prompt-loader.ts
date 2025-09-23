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

  // Очищаем контекст от потенциально проблемных фраз
  let cleanContext = context
    .replace(/для для/g, 'для') // Исправляем дублирование
    .replace(/мед фак/g, 'медицинский факт') // Исправляем сокращения
    .replace(/богатых/g, 'состоятельных') // Мягче формулировка
    .replace(/пенсионеров/g, 'пользователей старшего возраста') // Мягче формулировка
    .trim()

  console.log('🔍 ОРИГИНАЛЬНЫЙ КОНТЕКСТ:', context)
  console.log('🔍 ОЧИЩЕННЫЙ КОНТЕКСТ:', cleanContext)

  return `${mainPrompt}

## Дополнительный контекст
${cleanContext}

Учти этот контекст при анализе и адаптируй вопросы под специфику бизнеса и аудитории.`
}

/**
 * Загружает JSON-структурированный промпт v2
 */
export async function loadJSONPromptV2(locale: string = 'ru'): Promise<string> {
  console.log(`🔍 Попытка загрузки промпта для локали: ${locale}`)
  try {
    let fileName = 'json-structured-prompt-v2.md'
    if (locale === 'ua') fileName = 'json-structured-prompt-ua.md'
    else if (locale === 'en') fileName = 'json-structured-prompt-en.md'
    
    console.log(`📁 Ищем файл: ${fileName}`)
    const promptPath = join(process.cwd(), 'prompts', fileName)
    console.log(`📂 Полный путь: ${promptPath}`)
    
    const prompt = readFileSync(promptPath, 'utf-8')
    console.log(`✅ Загружен промпт для локали ${locale}: ${fileName}, размер: ${prompt.length} байт`)
    console.log(`📄 Первые 100 символов: ${prompt.substring(0, 100)}...`)
    return prompt
  } catch (error) {
    console.error(`❌ Ошибка загрузки JSON промпта v2 для локали ${locale}:`, error)
    console.log(`🔄 Используем fallback промпт для локали: ${locale}`)
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
      },
      {
        "id": 2,
        "question": "Второй вопрос",
        "options": ["A) Да", "B) Нет", "C) Не знаю"],
        "scores": [70, 20, 10],
        "confidence": 80,
        "category": "usability",
        "principle": "Простота",
        "explanation": "Объяснение"
      },
      {
        "id": 3,
        "question": "Третий вопрос",
        "options": ["A) Легко", "B) Сложно", "C) Очень сложно"],
        "scores": [50, 35, 15],
        "confidence": 75,
        "category": "accessibility",
        "principle": "Доступность",
        "explanation": "Объяснение"
      },
      {
        "id": 4,
        "question": "Четвертый вопрос",
        "options": ["A) Быстро", "B) Медленно", "C) Очень медленно"],
        "scores": [65, 25, 10],
        "confidence": 85,
        "category": "conversion",
        "principle": "Эффективность",
        "explanation": "Объяснение"
      },
      {
        "id": 5,
        "question": "Пятый вопрос",
        "options": ["A) Доверяю", "B) Не доверяю", "C) Сомневаюсь"],
        "scores": [60, 25, 15],
        "confidence": 80,
        "category": "trust",
        "principle": "Доверие",
        "explanation": "Объяснение"
      }
    ]
  },
  "audience": {
    "targetAudience": "Целевая аудитория - детальный портрет в 1-2 абзаца",
    "mainPain": "Основная боль пользователей в 1 абзаце",
    "fears": ["Страх 1", "Страх 2", "Страх 3", "Страх 4", "Страх 5"]
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
      "element": "Элемент 1",
      "problem": "Проблема 1",
      "principle": "Нарушенный принцип UX",
      "consequence": "Что произойдет, если проблему не решить",
      "recommendation": "Конкретная рекомендация",
      "expectedEffect": "Ожидаемый результат после внедрения рекомендации",
      "priority": "high"
    },
    {
      "element": "Элемент 2",
      "problem": "Проблема 2",
      "principle": "Нарушенный принцип UX",
      "consequence": "Что произойдет, если проблему не решить",
      "recommendation": "Конкретная рекомендация",
      "expectedEffect": "Ожидаемый результат после внедрения рекомендации",
      "priority": "medium"
    },
    {
      "element": "Элемент 3",
      "problem": "Проблема 3",
      "principle": "Нарушенный принцип UX",
      "consequence": "Что произойдет, если проблему не решить",
      "recommendation": "Конкретная рекомендация",
      "expectedEffect": "Ожидаемый результат после внедрения рекомендации",
      "priority": "low"
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







