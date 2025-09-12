import { NextRequest, NextResponse } from 'next/server'

// Простой тест OpenRouter без сложной логики
export async function POST(request: NextRequest) {
  try {
    const { model, message = 'Hello! Please respond.', screenshot } = await request.json()
    
    console.log('='.repeat(80))
    console.log(`🧪 ТЕСТ OPENROUTER API - ${new Date().toISOString()}`)
    console.log(`📝 Модель: ${model}`)
    console.log(`💬 Сообщение: ${message}`)
    console.log(`📷 Скриншот: ${screenshot ? 'ПРИСУТСТВУЕТ' : 'НЕТ'}`)
    console.log('='.repeat(80))
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    
    console.log(`🔑 API ключ: ${OPENROUTER_API_KEY ? 'НАЙДЕН' : 'НЕ НАЙДЕН'}`)
    console.log(`🌐 Base URL: ${OPENROUTER_BASE_URL}`)
    
    if (!OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY не настроен')
      return NextResponse.json({ 
        success: false,
        error: 'OPENROUTER_API_KEY не настроен' 
      }, { status: 500 })
    }
    
    // Подготовка запроса
    const messages: any[] = []
    
    if (screenshot) {
      // Если есть скриншот, создаем мультимодальное сообщение
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: message
          },
          {
            type: 'image_url',
            image_url: {
              url: screenshot,
              detail: 'high'
            }
          }
        ]
      })
    } else {
      // Обычное текстовое сообщение
      messages.push({
        role: 'user',
        content: message
      })
    }

    const requestBody = {
      model: model,
      messages: messages,
      max_tokens: 4000,
      temperature: 0.7
    }
    
    console.log('📤 ОТПРАВЛЯЕМ ЗАПРОС:')
    console.log(`🌐 URL: ${OPENROUTER_BASE_URL}/chat/completions`)
    console.log(`📋 Headers:`, {
      'Authorization': `Bearer ${OPENROUTER_API_KEY.substring(0, 20)}...`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://uxaudute.vercel.app',
      'X-Title': 'UX Audit Platform Test'
    })
    console.log(`📦 Body:`, JSON.stringify(requestBody, null, 2))
    
    // Запрос согласно официальной документации OpenRouter
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app', // Optional. Site URL for rankings on openrouter.ai
        'X-Title': 'UX Audit Platform Test' // Optional. Site title for rankings on openrouter.ai
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 ПОЛУЧЕН ОТВЕТ:')
    console.log(`📊 Статус: ${response.status} ${response.statusText}`)
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ОШИБКА HTTP:')
      console.error(`📊 Статус: ${response.status}`)
      console.error(`📝 Текст ошибки: ${errorText}`)
      return NextResponse.json({ 
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      })
    }

    const data = await response.json()
    console.log('✅ УСПЕШНЫЙ ОТВЕТ:')
    console.log(JSON.stringify(data, null, 2))
    
    let responseText = 'Нет ответа'
    let finishReason = 'unknown'
    let usage = null
    
    console.log('🔍 АНАЛИЗИРУЕМ ОТВЕТ:')
    console.log(`📊 Choices: ${data.choices ? data.choices.length : 'НЕТ'}`)
    
    if (data.choices && data.choices[0]) {
      responseText = data.choices[0].message.content || 'Пустой ответ'
      finishReason = data.choices[0].finish_reason || 'unknown'
      console.log(`💬 Ответ: "${responseText}"`)
      console.log(`🏁 Finish Reason: ${finishReason}`)
    } else {
      console.log('⚠️ Нет choices в ответе')
    }
    
    if (data.usage) {
      usage = data.usage
      console.log(`📊 Usage:`, usage)
    } else {
      console.log('⚠️ Нет usage в ответе')
    }

    const result = {
      success: true,
      model: model,
      response: responseText,
      finishReason: finishReason,
      usage: usage,
      fullResponse: data
    }
    
    console.log('🎯 ФИНАЛЬНЫЙ РЕЗУЛЬТАТ:')
    console.log(JSON.stringify(result, null, 2))
    console.log('='.repeat(80))
    
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ КРИТИЧЕСКАЯ ОШИБКА:')
    console.error(`📝 Тип ошибки: ${error instanceof Error ? error.constructor.name : typeof error}`)
    console.error(`📝 Сообщение: ${error instanceof Error ? error.message : String(error)}`)
    console.error(`📝 Stack:`, error instanceof Error ? error.stack : 'Нет stack trace')
    console.error('='.repeat(80))
    
    return NextResponse.json({ 
      success: false,
      error: `Ошибка: ${error instanceof Error ? error.message : String(error)}` 
    }, { status: 500 })
  }
}
