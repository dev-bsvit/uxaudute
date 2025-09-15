import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    success: true, 
    message: 'API работает!',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    return NextResponse.json({ 
      success: true, 
      message: 'POST API работает!',
      receivedData: body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Ошибка парсинга JSON',
      timestamp: new Date().toISOString()
    }, { status: 400 })
  }
}
