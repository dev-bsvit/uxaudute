import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('=== CLEAR CACHED RESULTS API вызван ===')
    
    const { auditIds } = await request.json()
    
    if (!auditIds || !Array.isArray(auditIds)) {
      return NextResponse.json(
        { error: 'auditIds должен быть массивом' },
        { status: 400 }
      )
    }

    console.log('Очищаем кэшированные результаты для аудитов:', auditIds)

    // Очищаем result_data для указанных аудитов
    const { data, error } = await supabase
      .from('audits')
      .update({
        result_data: {},
        status: 'in_progress',
        updated_at: new Date().toISOString()
      })
      .in('id', auditIds)

    if (error) {
      console.error('Ошибка очистки результатов:', error)
      return NextResponse.json(
        { error: 'Ошибка очистки результатов', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Кэшированные результаты очищены для аудитов:', auditIds)

    return NextResponse.json({
      success: true,
      clearedAudits: auditIds,
      message: `Очищено ${auditIds.length} аудитов`
    })

  } catch (error) {
    console.error('Ошибка в clear-cached-results API:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
