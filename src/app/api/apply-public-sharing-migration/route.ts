import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔧 Применяем миграцию для публичного доступа к аудитам...')

    // Добавляем поля для публичного доступа
    const { error: alterError } = await supabaseClient.rpc('exec', {
      sql: `
        ALTER TABLE public.audits 
        ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
        ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN DEFAULT FALSE;
      `
    })

    if (alterError) {
      console.error('❌ Ошибка добавления полей:', alterError)
      return NextResponse.json({ error: 'Не удалось добавить поля', details: alterError.message }, { status: 500 })
    }

    // Создаем индекс для быстрого поиска по публичному токену
    const { error: indexError } = await supabaseClient.rpc('exec', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_audits_public_token ON public.audits(public_token) WHERE public_enabled = TRUE;
      `
    })

    if (indexError) {
      console.error('❌ Ошибка создания индекса:', indexError)
      return NextResponse.json({ error: 'Не удалось создать индекс', details: indexError.message }, { status: 500 })
    }

    console.log('✅ Миграция применена успешно')

    return NextResponse.json({
      success: true,
      message: 'Миграция для публичного доступа применена успешно'
    })

  } catch (error) {
    console.error('❌ Ошибка применения миграции:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
