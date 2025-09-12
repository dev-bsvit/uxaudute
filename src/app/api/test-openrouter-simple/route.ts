import { NextRequest, NextResponse } from 'next/server'

// Простой тест OpenRouter без сложной логики
export async function POST(request: NextRequest) {
  try {
    const { model, message = 'Hello! Please respond.' } = await request.json()
    
    console.log(`🧪 Тестируем модель: ${model}`)
    console.log(`📝 Сообщение: ${message}`)
    
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
    
    if (!OPENROUTER_API_KEY) {
      return NextResponse.json({ 
        success: false,
        error: 'OPENROUTER_API_KEY не настроен' 
      }, { status: 500 })
    }
    
    // Запрос согласно официальной документации OpenRouter
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://uxaudute.vercel.app', // Optional. Site URL for rankings on openrouter.ai
        'X-Title': 'UX Audit Platform Test' // Optional. Site title for rankings on openrouter.ai
      },
      body: JSON.stringify({
        model: model, // Модель из списка OpenRouter
        messages: [
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      })
    })

    console.log(`📡 Статус ответа: ${response.status}`)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ Ошибка HTTP: ${response.status}`, errorText)
      return NextResponse.json({ 
        success: false,
        error: `HTTP ${response.status}: ${errorText}`,
        status: response.status
      })
    }

    const data = await response.json()
    console.log('✅ Полный ответ:', JSON.stringify(data, null, 2))
    
    let responseText = 'Нет ответа'
    let finishReason = 'unknown'
    let usage = null
    
    if (data.choices && data.choices[0]) {
      responseText = data.choices[0].message.content || 'Пустой ответ'
      finishReason = data.choices[0].finish_reason || 'unknown'
    }
    
    if (data.usage) {
      usage = data.usage
    }

    return NextResponse.json({
      success: true,
      model: model,
      response: responseText,
      finishReason: finishReason,
      usage: usage,
      fullResponse: data
    })

  } catch (error) {
    console.error('❌ Ошибка запроса:', error)
    return NextResponse.json({ 
      success: false,
      error: `Ошибка: ${error}` 
    }, { status: 500 })
  }
}
