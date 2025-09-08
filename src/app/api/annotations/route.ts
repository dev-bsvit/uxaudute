import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/annotations?auditId=xxx - Получить аннотации для аудита
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    
    console.log('GET /api/annotations - auditId:', auditId)
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Проверяем переменные окружения
    console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')

    // Сначала проверяем, существует ли аудит
    const { data: audit, error: auditError } = await supabaseAdmin
      .from('audits')
      .select('id, annotations')
      .eq('id', auditId)
      .single()

    if (auditError) {
      console.error('Audit not found or access denied:', auditError)
      return NextResponse.json({ 
        error: 'Audit not found or access denied', 
        details: auditError.message 
      }, { status: 404 })
    }

    if (!audit) {
      return NextResponse.json({ 
        error: 'Audit not found' 
      }, { status: 404 })
    }
    
    console.log('Successfully fetched annotations:', audit?.annotations)
    
    // Если annotations - это объект с массивом, извлекаем массив
    let annotationsArray = null
    if (audit?.annotations) {
      if (Array.isArray(audit.annotations)) {
        annotationsArray = audit.annotations
      } else if (audit.annotations.annotations && Array.isArray(audit.annotations.annotations)) {
        annotationsArray = audit.annotations.annotations
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      annotations: annotationsArray 
    })

  } catch (error) {
    console.error('Error in GET /api/annotations:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST /api/annotations - Сохранить аннотации для аудита
export async function POST(request: NextRequest) {
  try {
    const { auditId, annotations } = await request.json()
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Прямой запрос к Supabase - RLS проверит права доступа
    // Сохраняем массив аннотаций напрямую
    const { error } = await supabaseAdmin
      .from('audits')
      .update({
        annotations: Array.isArray(annotations) ? annotations : null,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (error) {
      console.error('Error saving annotations:', error)
      return NextResponse.json({ error: 'Failed to save annotations' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Annotations saved successfully' 
    })

  } catch (error) {
    console.error('Error in POST /api/annotations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/annotations?auditId=xxx - Удалить аннотации для аудита
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Прямой запрос к Supabase - RLS проверит права доступа
    const { error } = await supabaseAdmin
      .from('audits')
      .update({
        annotations: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (error) {
      console.error('Error deleting annotations:', error)
      return NextResponse.json({ error: 'Failed to delete annotations' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Annotations deleted successfully' 
    })

  } catch (error) {
    console.error('Error in DELETE /api/annotations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}