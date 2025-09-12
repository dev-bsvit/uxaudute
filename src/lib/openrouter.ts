/**
 * OpenRouter API Configuration
 * Альтернативный AI провайдер для UX Audit Platform
 * 
 * Использование:
 * - Если OPENROUTER_API_KEY не задан, функции возвращают null
 * - Все функции имеют fallback на OpenAI
 * - Поддерживает различные модели через OpenRouter
 */

import OpenAI from 'openai'

// Конфигурация OpenRouter
const openrouterConfig = {
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
  models: {
    claude: process.env.OPENROUTER_MODEL_CLAUDE || 'anthropic/claude-3.5-sonnet',
    sonoma: process.env.OPENROUTER_MODEL_SONOMA || 'openrouter/sonoma-sky-alpha',
    gpt4: process.env.OPENROUTER_MODEL_GPT4 || 'openai/gpt-4o',
    deepseek: process.env.OPENROUTER_MODEL_DEEPSEEK || 'deepseek/deepseek-chat-v3.1:free',
    default: process.env.OPENROUTER_DEFAULT_MODEL || 'anthropic/claude-3.5-sonnet'
  }
}

// Проверка доступности OpenRouter
export const isOpenRouterAvailable = (): boolean => {
  return !!openrouterConfig.apiKey
}

// Создание OpenRouter клиента (только если API ключ доступен)
export const createOpenRouterClient = (): OpenAI | null => {
  if (!isOpenRouterAvailable()) {
    console.log('OpenRouter: API ключ не настроен, пропускаем')
    return null
  }

  try {
    const client = new OpenAI({
      apiKey: openrouterConfig.apiKey,
      baseURL: openrouterConfig.baseURL,
    })
    
    console.log('OpenRouter: Клиент создан успешно')
    return client
  } catch (error) {
    console.error('OpenRouter: Ошибка создания клиента:', error)
    return null
  }
}

// Получение модели для использования
export const getOpenRouterModel = (modelType: 'claude' | 'sonoma' | 'gpt4' | 'deepseek' | 'default' = 'default'): string => {
  return openrouterConfig.models[modelType]
}

// Получение всех доступных моделей
export const getAvailableModels = () => {
  return {
    claude: openrouterConfig.models.claude,
    sonoma: openrouterConfig.models.sonoma,
    gpt4: openrouterConfig.models.gpt4,
    default: openrouterConfig.models.default
  }
}

// Тест подключения к OpenRouter с конкретной моделью
export const testOpenRouterConnection = async (modelType: 'claude' | 'sonoma' | 'gpt4' | 'deepseek' | 'default' = 'default'): Promise<{
  success: boolean
  message: string
  response?: string
  model?: string
}> => {
  const client = createOpenRouterClient()
  
  if (!client) {
    return {
      success: false,
      message: 'OpenRouter не настроен (отсутствует API ключ)'
    }
  }

  const model = getOpenRouterModel(modelType)

  try {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [{ 
        role: "user", 
        content: `Привет! Это тест OpenRouter с моделью ${model}. Ответь просто 'OpenRouter работает с ${model}'."` 
      }],
      temperature: 0.7,
      max_tokens: 100
    })

    const response = completion.choices[0]?.message?.content || 'Нет ответа'
    
    return {
      success: true,
      message: `OpenRouter API работает с ${model}`,
      response,
      model
    }
  } catch (error) {
    console.error(`OpenRouter: Ошибка тестирования модели ${model}:`, error)
    return {
      success: false,
      message: `Ошибка OpenRouter API с моделью ${model}`,
      response: error instanceof Error ? error.message : 'Unknown error',
      model
    }
  }
}

// Получение информации о конфигурации
export const getOpenRouterInfo = () => {
  return {
    available: isOpenRouterAvailable(),
    baseURL: openrouterConfig.baseURL,
    models: openrouterConfig.models,
    hasApiKey: !!openrouterConfig.apiKey
  }
}
