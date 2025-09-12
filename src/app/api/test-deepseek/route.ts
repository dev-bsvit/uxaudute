import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Тестируем DeepSeek Chat v3.1:free...')
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    
    if (!OPENROUTER_API_KEY) {
      console.error('❌ OPENROUTER_API_KEY не найден')
      return NextResponse.json({ 
        error: 'OPENROUTER_API_KEY не настроен' 
      }, { status: 500 })
    }
    
    console.log('🔑 API ключ найден, длина:', OPENROUTER_API_KEY.length)
    
    // Создаем AbortController для таймаута
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 секунд таймаут
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app',
        'X-Title': 'UX Audit Platform'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages: [
          {
            role: 'user',
            content: 'Hello! Please say something about UX design.'
          }
        ],
        max_tokens: 200,
        temperature: 0.7,
        stream: false
      }),
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)

    console.log('📡 Статус ответа:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Ошибка HTTP:', response.status, errorText)
      return NextResponse.json({ 
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      })
    }

    const data = await response.json()
    console.log('✅ Полный ответ от DeepSeek:')
    console.log(JSON.stringify(data, null, 2))
    
    let deepseekResponse = 'Нет ответа'
    if (data.choices && data.choices[0]) {
      deepseekResponse = data.choices[0].message.content
      console.log('💬 Ответ DeepSeek:', deepseekResponse)
    } else {
      console.log('⚠️ Нет ответа в choices')
    }

    return NextResponse.json({
      success: true,
      message: 'Тест DeepSeek Chat v3.1:free завершен',
      deepseekResponse: deepseekResponse,
      fullResponse: data,
      status: response.status,
      usage: data.usage
    })

  } catch (error) {
    console.error('❌ Ошибка запроса:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Таймаут - DeepSeek не отвечает в течение 15 секунд',
        timeout: true
      }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: `Ошибка: ${error}` 
    }, { status: 500 })
  }
}
