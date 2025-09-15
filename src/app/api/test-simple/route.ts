import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { screenshot, provider = 'openai' } = await request.json()
    
    console.log('=== TEST SIMPLE API вызван ===')
    console.log('Provider:', provider)
    console.log('Screenshot:', !!screenshot)
    
    if (!screenshot) {
      return NextResponse.json(
        { error: 'Screenshot обязателен' },
        { status: 400 }
      )
    }
    
    // Простой тест - возвращаем успешный ответ
    return NextResponse.json({
      success: true,
      message: 'API работает!',
      provider,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Ошибка в test-simple API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}


