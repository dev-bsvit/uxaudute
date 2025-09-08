import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/check-annotations - Проверить структуру таблицы audits
export async function GET(request: NextRequest) {
  try {
    // Проверяем, есть ли поле annotations в таблице audits
    const { data, error } = await supabase
      .from('audits')
      .select('id, annotations')
      .limit(1)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        hasAnnotationsField: false 
      })
    }

    return NextResponse.json({ 
      success: true, 
      hasAnnotationsField: true,
      sampleData: data,
      message: 'Поле annotations существует в таблице audits'
    })

  } catch (error) {
    console.error('Error checking annotations field:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      hasAnnotationsField: false 
    })
  }
}
