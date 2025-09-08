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

    // Прямой запрос к Supabase - RLS проверит права доступа
    const { data, error } = await supabaseAdmin
      .from('audits')
      .select('annotations')
      .eq('id', auditId)
      .single()

    if (error) {
      console.error('Supabase error fetching annotations:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch annotations', 
        details: error.message 
      }, { status: 500 })
    }
    
    console.log('Successfully fetched annotations:', data?.annotations)
    
    return NextResponse.json({ 
      success: true, 
      annotations: data?.annotations || null 
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
    const { error } = await supabaseAdmin
      .from('audits')
      .update({
        annotations: annotations || null,
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