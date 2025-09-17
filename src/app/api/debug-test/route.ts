import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    console.log('=== DEBUG TEST API вызван ===')
    
    // Тест 1: Проверяем получение данных
    const body = await request.json()
    console.log('Получены данные:', { 
      hasUrl: !!body.url, 
      hasScreenshot: !!body.screenshot, 
      hasContext: !!body.context,
      hasAuditId: !!body.auditId 
    })
    
    // Тест 2: Проверяем загрузку промпта
    try {
      const promptPath = join(process.cwd(), 'prompts', 'json-structured-prompt.md')
      console.log('Пробуем загрузить промпт из:', promptPath)
      
      const prompt = readFileSync(promptPath, 'utf-8')
      console.log('Промпт загружен успешно, длина:', prompt.length)
      
      return NextResponse.json({
        success: true,
        message: 'Все тесты прошли успешно',
        promptLength: prompt.length,
        receivedData: {
          hasUrl: !!body.url,
          hasScreenshot: !!body.screenshot,
          hasContext: !!body.context,
          hasAuditId: !!body.auditId
        }
      })
    } catch (promptError) {
      console.error('Ошибка загрузки промпта:', promptError)
      return NextResponse.json({
        success: false,
        error: 'Ошибка загрузки промпта',
        details: promptError instanceof Error ? promptError.message : 'Unknown error'
      }, { status: 500 })
    }
    
  } catch (error) {
    console.error('Ошибка в debug-test API:', error)
    return NextResponse.json({
      success: false,
      error: 'Внутренняя ошибка сервера',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}




