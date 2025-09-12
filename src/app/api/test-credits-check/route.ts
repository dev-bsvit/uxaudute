import { NextRequest, NextResponse } from 'next/server'
import { checkCreditsForAudit } from '@/lib/credits'

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST CREDITS CHECK API вызван ===')
    
    const { auditType = 'research' } = await request.json()

    // Получаем пользователя из заголовков
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.log('Проверяем кредиты для пользователя:', user.id, 'тип аудита:', auditType)

    // Проверяем кредиты
    const creditsCheck = await checkCreditsForAudit(user.id, auditType as any)
    
    console.log('Результат проверки кредитов:', creditsCheck)

    return NextResponse.json({
      success: true,
      user_id: user.id,
      audit_type: auditType,
      credits_check: creditsCheck,
      message: creditsCheck.canProceed ? 'Credits available' : 'Insufficient credits'
    })

  } catch (error) {
    console.error('Ошибка в test-credits-check API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
