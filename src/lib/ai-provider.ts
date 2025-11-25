/**
 * AI Provider Selection with Fallback System
 * Система выбора AI провайдера с автоматическим fallback
 * 
 * Поддерживаемые провайдеры:
 * - OpenAI (основной)
 * - OpenRouter (альтернативный)
 * 
 * Принцип работы:
 * 1. Пытается использовать приоритетный провайдер
 * 2. При ошибке автоматически переключается на следующий
 * 3. Всегда есть fallback на OpenAI
 */

import { openai } from './openai'
import { createOpenRouterClient, getOpenRouterModel, isOpenRouterAvailable } from './openrouter'

// Типы для провайдеров
export type AIProvider = 'openai' | 'openrouter'
export type OpenRouterModel = 'claude' | 'sonoma' | 'gpt4' | 'deepseek' | 'default'

export interface AIProviderConfig {
  provider: AIProvider
  model: string
  client: any
}

export interface AIRequestOptions {
  temperature?: number
  max_tokens?: number
  stream?: boolean
  provider?: AIProvider
  openrouterModel?: OpenRouterModel
  top_p?: number
  frequency_penalty?: number
  presence_penalty?: number
}

export interface AIResponse {
  success: boolean
  content: string
  provider: AIProvider
  model: string
  error?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

// Получение приоритета провайдеров из переменных окружения
const getProviderPriority = (): AIProvider[] => {
  const priority = process.env.AI_PROVIDER_PRIORITY || 'openai,openrouter'
  return priority.split(',').map(p => p.trim()) as AIProvider[]
}

// Создание конфигурации провайдера
const createProviderConfig = (provider: AIProvider, openrouterModel: OpenRouterModel = 'default'): AIProviderConfig | null => {
  switch (provider) {
    case 'openai':
      return {
        provider: 'openai',
        model: 'gpt-4o-2024-08-06', // Последняя версия GPT-4o
        client: openai
      }

    case 'openrouter':
      if (!isOpenRouterAvailable()) {
        console.log('OpenRouter недоступен, пропускаем')
        return null
      }
      const openrouterClient = createOpenRouterClient()
      if (!openrouterClient) {
        console.log('Не удалось создать OpenRouter клиент')
        return null
      }
      return {
        provider: 'openrouter',
        model: getOpenRouterModel(openrouterModel),
        client: openrouterClient
      }

    default:
      console.warn(`Неизвестный провайдер: ${provider}`)
      return null
  }
}

// Основная функция для выполнения запроса с fallback
export const executeAIRequest = async (
  messages: Array<{ role: string; content: string | any[] }>,
  options: AIRequestOptions = {}
): Promise<AIResponse> => {
  const {
    temperature = 0.3,
    max_tokens = 16384, // Увеличиваем для полных ответов (GPT-4o поддерживает до 16k)
    stream = false,
    provider,
    openrouterModel = 'default',
    top_p = 0.9,
    frequency_penalty = 0.1,
    presence_penalty = 0.1
  } = options

  // Если указан конкретный провайдер, используем его
  if (provider) {
    console.log(`🎯 Создаем конфигурацию для провайдера: ${provider}, модель: ${openrouterModel}`)
    const config = createProviderConfig(provider, openrouterModel)

    console.log(`📋 Конфигурация создана:`, config)

    if (!config) {
      console.error(`❌ Провайдер ${provider} недоступен`)
      return {
        success: false,
        content: '',
        provider: provider,
        model: 'unknown',
        error: `Провайдер ${provider} недоступен`
      }
    }

    try {
      console.log(`Используем указанный провайдер: ${provider} (модель: ${config.model})`)
      console.log(`📤 Отправляем сообщения:`, JSON.stringify(messages, null, 2))

      // Специальные параметры для Sonoma Sky Alpha
      const isSonoma = config.model.includes('sonoma-sky-alpha')
      console.log(`🎯 Это Sonoma Sky Alpha: ${isSonoma}`)

      const requestParams = {
        model: config.model,
        messages: messages as any,
        temperature: isSonoma ? 0.8 : 0.7, // Как в stable версии
        max_tokens: Math.max(max_tokens, 16384),
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream,
        response_format: { type: "json_object" }
      }

      console.log(`📋 Параметры запроса:`, JSON.stringify(requestParams, null, 2))

      const completion = await config.client.chat.completions.create(requestParams)

      console.log(`✅ Получен ответ от ${provider}`)
      console.log(`📊 Usage:`, completion.usage)
      console.log(`📝 Choices length:`, completion.choices?.length)
      console.log(`📝 First choice:`, JSON.stringify(completion.choices[0], null, 2))

      const messageContent = completion.choices[0]?.message?.content
      console.log(`📝 Message content type:`, typeof messageContent)
      console.log(`📝 Message content length:`, messageContent?.length)
      console.log(`📝 Content preview:`, messageContent?.substring(0, 200))

      // Проверяем на ошибки в ответе
      if (completion.error) {
        console.error(`❌ Ошибка от ${provider}:`, completion.error)
        return {
          success: false,
          content: '',
          provider: config.provider,
          model: config.model,
          error: `Ошибка API: ${completion.error.message || 'Неизвестная ошибка'}`
        }
      }

      if (!messageContent) {
        console.error(`❌ ${provider} вернул пустой content!`)
        console.error(`Полный ответ:`, JSON.stringify(completion, null, 2))
        console.error(`Finish reason:`, completion.choices[0]?.finish_reason)

        return {
          success: false,
          content: '',
          provider: config.provider,
          model: config.model,
          error: `${provider} returned empty response. Finish reason: ${completion.choices[0]?.finish_reason || 'unknown'}`,
          usage: completion.usage
        }
      }

      console.log(`✅ Успешно использован провайдер: ${provider}`)

      return {
        success: true,
        content: messageContent,
        provider: config.provider,
        model: config.model,
        usage: completion.usage
      }

    } catch (error) {
      console.error(`❌ Ошибка указанного провайдера ${provider}:`, error)
      return {
        success: false,
        content: '',
        provider: config.provider,
        model: config.model,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Иначе используем fallback систему
  const providers = getProviderPriority()

  // Пробуем каждый провайдер по порядку приоритета
  for (const providerName of providers) {
    const config = createProviderConfig(providerName, openrouterModel)

    if (!config) {
      console.log(`Пропускаем провайдер ${providerName}: конфигурация недоступна`)
      continue
    }

    try {
      console.log(`Пробуем провайдер: ${providerName} (модель: ${config.model})`)

      // Специальные параметры для Sonoma Sky Alpha
      const isSonoma = config.model.includes('sonoma-sky-alpha')

      const completion = await config.client.chat.completions.create({
        model: config.model,
        messages: messages as any,
        temperature: isSonoma ? 0.8 : 0.7, // Как в stable версии
        max_tokens: Math.max(max_tokens, 16384),
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
        stream,
        response_format: { type: "json_object" }
      })

      const content = completion.choices[0]?.message?.content || 'Нет ответа'

      console.log(`✅ Успешно использован провайдер: ${providerName}`)

      return {
        success: true,
        content,
        provider: config.provider,
        model: config.model,
        usage: completion.usage
      }

    } catch (error) {
      console.error(`❌ Ошибка провайдера ${providerName}:`, error)

      // Если это последний провайдер, возвращаем ошибку
      if (providerName === providers[providers.length - 1]) {
        return {
          success: false,
          content: '',
          provider: config.provider,
          model: config.model,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      // Иначе пробуем следующий провайдер
      console.log(`Переключаемся на следующий провайдер...`)
    }
  }

  // Если все провайдеры недоступны, возвращаем ошибку
  return {
    success: false,
    content: '',
    provider: 'openai',
    model: 'gpt-4o',
    error: 'Все AI провайдеры недоступны'
  }
}

// Тест всех доступных провайдеров
export const testAllProviders = async (): Promise<{
  [key in AIProvider]: {
    available: boolean
    working: boolean
    message: string
    model?: string
  }
}> => {
  const results = {
    openai: {
      available: true,
      working: false,
      message: 'Тестирование...',
      model: 'gpt-4o'
    },
    openrouter: {
      available: isOpenRouterAvailable(),
      working: false,
      message: 'Тестирование...',
      model: getOpenRouterModel()
    }
  }

  // Тест OpenAI
  try {
    const openaiTest = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: 'Тест OpenAI' }],
      max_tokens: 10
    })
    results.openai.working = true
    results.openai.message = 'OpenAI работает'
  } catch (error) {
    results.openai.working = false
    results.openai.message = `OpenAI ошибка: ${error instanceof Error ? error.message : 'Unknown'}`
  }

  // Тест OpenRouter
  if (results.openrouter.available) {
    try {
      const openrouterClient = createOpenRouterClient()
      if (openrouterClient) {
        const openrouterTest = await openrouterClient.chat.completions.create({
          model: getOpenRouterModel(),
          messages: [{ role: 'user', content: 'Тест OpenRouter' }],
          max_tokens: 10
        })
        results.openrouter.working = true
        results.openrouter.message = 'OpenRouter работает'
      } else {
        results.openrouter.message = 'Не удалось создать клиент'
      }
    } catch (error) {
      results.openrouter.working = false
      results.openrouter.message = `OpenRouter ошибка: ${error instanceof Error ? error.message : 'Unknown'}`
    }
  } else {
    results.openrouter.message = 'OpenRouter не настроен'
  }

  return results
}

// Получение информации о доступных провайдерах
export const getProvidersInfo = () => {
  return {
    priority: getProviderPriority(),
    openai: {
      available: true,
      model: 'gpt-4o'
    },
    openrouter: {
      available: isOpenRouterAvailable(),
      model: getOpenRouterModel()
    }
  }
}
