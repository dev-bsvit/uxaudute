import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Тестируем Sonoma Sky Alpha с простым запросом...')
    
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
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 секунд таймаут
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app',
        'X-Title': 'UX Audit Platform'
      },
      body: JSON.stringify({
        model: 'openrouter/sonoma-sky-alpha',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant. Always respond with text.'
          },
          {
            role: 'user',
            content: 'Hello! How are you? Please respond briefly.'
          }
        ],
        max_tokens: 150,
        temperature: 0.8,
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
    console.log('✅ Полный ответ от Sonoma Sky Alpha:')
    console.log(JSON.stringify(data, null, 2))
    
    let sonomaResponse = 'Нет ответа'
    if (data.choices && data.choices[0]) {
      sonomaResponse = data.choices[0].message.content
      console.log('💬 Ответ Sonoma:', sonomaResponse)
    } else {
      console.log('⚠️ Нет ответа в choices')
    }

    return NextResponse.json({
      success: true,
      message: 'Тест Sonoma Sky Alpha завершен',
      sonomaResponse: sonomaResponse,
      fullResponse: data,
      status: response.status
    })

  } catch (error) {
    console.error('❌ Ошибка запроса:', error)
    
    if (error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Таймаут - Sonoma Sky Alpha не отвечает в течение 10 секунд',
        timeout: true
      }, { status: 408 })
    }
    
    return NextResponse.json({ 
      error: `Ошибка: ${error}` 
    }, { status: 500 })
  }
}
