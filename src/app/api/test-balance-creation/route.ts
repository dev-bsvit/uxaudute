import { NextRequest, NextResponse } from 'next/server'
import { ensureUserHasInitialBalance } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    console.log('🧪 Тестируем создание баланса для пользователя:', userId)

    try {
      await ensureUserHasInitialBalance(userId)
      return NextResponse.json({ 
        success: true, 
        message: 'Функция ensureUserHasInitialBalance выполнена успешно',
        userId
      })
    } catch (error) {
      console.error('❌ Ошибка в ensureUserHasInitialBalance:', error)
      return NextResponse.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        userId
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in POST /api/test-balance-creation:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
