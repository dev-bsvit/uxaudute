import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// GET /api/models - Получить список доступных моделей OpenAI
export async function GET(request: NextRequest) {
  try {
    // Проверяем наличие API ключа
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'OpenAI API key not configured' 
        },
        { status: 500 }
      )
    }

    // Создаем клиент OpenAI
    const client = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    })

    console.log('🔍 Запрашиваем список моделей OpenAI...')

    // Получаем список моделей
    const models = await client.models.list()

    console.log(`✅ Получено ${models.data.length} моделей`)

    // Фильтруем и группируем модели
    const modelList = models.data.map(model => ({
      id: model.id,
      object: model.object,
      created: model.created,
      owned_by: model.owned_by,
      // Определяем тип модели по названию
      type: getModelType(model.id),
      // Определяем возможности модели
      capabilities: getModelCapabilities(model.id)
    }))

    // Группируем модели по типам
    const groupedModels = {
      gpt4: modelList.filter(m => m.type === 'gpt4'),
      gpt3_5: modelList.filter(m => m.type === 'gpt3.5'),
      dall_e: modelList.filter(m => m.type === 'dall-e'),
      tts: modelList.filter(m => m.type === 'tts'),
      whisper: modelList.filter(m => m.type === 'whisper'),
      other: modelList.filter(m => m.type === 'other')
    }

    // Рекомендуемые модели для UX анализа
    const recommendedForUX = modelList.filter(model => 
      model.id.includes('gpt-4') && 
      (model.id.includes('o') || model.id.includes('turbo'))
    )

    return NextResponse.json({
      success: true,
      total: models.data.length,
      recommended_for_ux: recommendedForUX,
      models_by_type: groupedModels,
      all_models: modelList,
      current_model: process.env.OPENAI_MODEL || 'gpt-4o',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Ошибка получения моделей:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch models',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Функция для определения типа модели
function getModelType(modelId: string): string {
  if (modelId.includes('gpt-4')) {
    return 'gpt4'
  } else if (modelId.includes('gpt-3.5')) {
    return 'gpt3.5'
  } else if (modelId.includes('dall-e')) {
    return 'dall-e'
  } else if (modelId.includes('tts')) {
    return 'tts'
  } else if (modelId.includes('whisper')) {
    return 'whisper'
  } else {
    return 'other'
  }
}

// Функция для определения возможностей модели
function getModelCapabilities(modelId: string): string[] {
  const capabilities: string[] = []
  
  if (modelId.includes('gpt-4')) {
    capabilities.push('text-generation', 'json-mode', 'function-calling')
    if (modelId.includes('o')) {
      capabilities.push('vision', 'image-analysis')
    }
    if (modelId.includes('turbo')) {
      capabilities.push('fast-response')
    }
  } else if (modelId.includes('gpt-3.5')) {
    capabilities.push('text-generation', 'json-mode', 'function-calling')
  } else if (modelId.includes('dall-e')) {
    capabilities.push('image-generation')
  } else if (modelId.includes('tts')) {
    capabilities.push('text-to-speech')
  } else if (modelId.includes('whisper')) {
    capabilities.push('speech-to-text')
  }
  
  return capabilities
}
