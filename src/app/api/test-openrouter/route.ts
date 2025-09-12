import { NextRequest, NextResponse } from 'next/server'
import { testOpenRouterConnection, getOpenRouterInfo } from '@/lib/openrouter'
import { testAllProviders, getProvidersInfo } from '@/lib/ai-provider'

export async function GET(request: NextRequest) {
  try {
    console.log('=== TEST OPENROUTER API вызван ===')
    
    // Получаем информацию о конфигурации
    const openrouterInfo = getOpenRouterInfo()
    const providersInfo = getProvidersInfo()
    
    return NextResponse.json({
      success: true,
      message: 'OpenRouter тест endpoint',
      openrouter: openrouterInfo,
      providers: providersInfo,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Ошибка в test-openrouter API:', error)
    return NextResponse.json({
      success: false,
      error: 'Ошибка получения информации',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST OPENROUTER CONNECTION вызван ===')
    
    // Тестируем подключение к OpenRouter
    const openrouterTest = await testOpenRouterConnection()
    
    // Тестируем все провайдеры
    const allProvidersTest = await testAllProviders()
    
    return NextResponse.json({
      success: true,
      message: 'Тестирование провайдеров завершено',
      openrouter: openrouterTest,
      allProviders: allProvidersTest,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Ошибка в test-openrouter connection:', error)
    return NextResponse.json({
      success: false,
      error: 'Ошибка тестирования OpenRouter',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
