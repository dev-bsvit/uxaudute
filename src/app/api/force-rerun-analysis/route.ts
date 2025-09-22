import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== FORCE RERUN ANALYSIS API вызван ===')
    
    const { auditId, locale } = await request.json()
    
    if (!auditId) {
      return NextResponse.json(
        { error: 'auditId обязателен' },
        { status: 400 }
      )
    }

    console.log('Принудительно перезапускаем анализ для аудита:', auditId, 'локаль:', locale)

    // Очищаем result_data и устанавливаем статус для перезапуска
    const { data, error } = await supabase
      .from('audits')
      .update({
        result_data: {},
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (error) {
      console.error('Ошибка очистки аудита:', error)
      return NextResponse.json(
        { error: 'Ошибка очистки аудита', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Аудит очищен, готов к перезапуску:', auditId)

    return NextResponse.json({
      success: true,
      auditId: auditId,
      locale: locale,
      message: 'Аудит очищен и готов к перезапуску анализа'
    })

  } catch (error) {
    console.error('Ошибка в force-rerun-analysis API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
