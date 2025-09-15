import { NextRequest, NextResponse } from 'next/server'

// POST /api/test-ux-audit - Тестирование UX аудита с списанием кредитов
export async function POST(request: NextRequest) {
  try {
    const { url, screenshot, context } = await request.json()

    // Вызываем основной API research с тестовым пользователем
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url || 'https://example.com',
        context: context || 'Тестовый контекст',
        userId: 'cc37dfed-4dad-4e7e-bff5-1b38645e3c7d' // Тестовый пользователь
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return NextResponse.json({
        success: false,
        error: result.error,
        status: response.status,
        details: result
      }, { status: response.status })
    }

    return NextResponse.json({
      success: true,
      message: 'UX аудит выполнен успешно',
      credits_deducted: 2,
      result: result.result
    })

  } catch (error) {
    console.error('Error in test UX audit:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
