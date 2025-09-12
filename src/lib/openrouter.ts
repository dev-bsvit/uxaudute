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
  model: process.env.OPENROUTER_MODEL || 'anthropic/claude-3.5-sonnet',
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
export const getOpenRouterModel = (): string => {
  return openrouterConfig.model
}

// Тест подключения к OpenRouter
export const testOpenRouterConnection = async (): Promise<{
  success: boolean
  message: string
  response?: string
}> => {
  const client = createOpenRouterClient()
  
  if (!client) {
    return {
      success: false,
      message: 'OpenRouter не настроен (отсутствует API ключ)'
    }
  }

  try {
    const completion = await client.chat.completions.create({
      model: openrouterConfig.model,
      messages: [{ 
        role: "user", 
        content: "Привет! Это тест OpenRouter. Ответь просто 'OpenRouter работает'." 
      }],
      temperature: 0.7,
      max_tokens: 100
    })

    const response = completion.choices[0]?.message?.content || 'Нет ответа'
    
    return {
      success: true,
      message: 'OpenRouter API работает',
      response
    }
  } catch (error) {
    console.error('OpenRouter: Ошибка тестирования:', error)
    return {
      success: false,
      message: 'Ошибка OpenRouter API',
      response: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Получение информации о конфигурации
export const getOpenRouterInfo = () => {
  return {
    available: isOpenRouterAvailable(),
    baseURL: openrouterConfig.baseURL,
    model: openrouterConfig.model,
    hasApiKey: !!openrouterConfig.apiKey
  }
}
