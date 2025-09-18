import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Исправляем публичный доступ...')

    // Получаем все аудиты
    const { data: audits, error: auditsError } = await supabaseClient
      .from('audits')
      .select('id, input_data')
      .not('input_data', 'is', null)

    if (auditsError) {
      console.error('❌ Ошибка получения аудитов:', auditsError)
      return NextResponse.json({ 
        error: 'Ошибка получения аудитов', 
        details: auditsError.message 
      }, { status: 500 })
    }

    console.log(`📊 Найдено ${audits.length} аудитов`)

    let updatedCount = 0
    let errorCount = 0

    // Обновляем каждый аудит
    for (const audit of audits) {
      try {
        const currentInputData = audit.input_data || {}
        
        // Если уже есть публичные поля, пропускаем
        if (currentInputData.public_enabled !== undefined) {
          continue
        }

        // Добавляем публичные поля
        const updatedInputData = {
          ...currentInputData,
          public_enabled: false,
          public_token: null
        }

        const { error: updateError } = await supabaseClient
          .from('audits')
          .update({ input_data: updatedInputData })
          .eq('id', audit.id)

        if (updateError) {
          console.error(`❌ Ошибка обновления аудита ${audit.id}:`, updateError)
          errorCount++
        } else {
          updatedCount++
          console.log(`✅ Аудит ${audit.id} обновлен`)
        }
      } catch (err) {
        console.error(`❌ Ошибка обработки аудита ${audit.id}:`, err)
        errorCount++
      }
    }

    console.log(`✅ Обработка завершена: ${updatedCount} обновлено, ${errorCount} ошибок`)

    return NextResponse.json({
      success: true,
      message: 'Публичный доступ исправлен',
      updatedCount,
      errorCount,
      totalAudits: audits.length
    })

  } catch (error) {
    console.error('❌ Ошибка в API fix-public-access:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
