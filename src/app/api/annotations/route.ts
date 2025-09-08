import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/annotations?auditId=xxx - Получить аннотации для аудита
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Получаем аудит с проверкой прав доступа
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        id,
        annotations,
        projects!inner(user_id)
      `)
      .eq('id', auditId)
      .eq('projects.user_id', user.id)
      .single()

    if (auditError) {
      console.error('Error fetching audit:', auditError)
      return NextResponse.json({ error: 'Audit not found or access denied' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      annotations: audit.annotations || null 
    })

  } catch (error) {
    console.error('Error in GET /api/annotations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/annotations - Сохранить аннотации для аудита
export async function POST(request: NextRequest) {
  try {
    const { auditId, annotations } = await request.json()
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа к аудиту
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', auditId)
      .eq('projects.user_id', user.id)
      .single()

    if (auditError) {
      console.error('Error checking audit access:', auditError)
      return NextResponse.json({ error: 'Audit not found or access denied' }, { status: 404 })
    }

    // Обновляем аннотации
    const { error: updateError } = await supabase
      .from('audits')
      .update({ 
        annotations: annotations || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Error updating annotations:', updateError)
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

    // Получаем текущего пользователя
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Проверяем права доступа к аудиту
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        id,
        projects!inner(user_id)
      `)
      .eq('id', auditId)
      .eq('projects.user_id', user.id)
      .single()

    if (auditError) {
      console.error('Error checking audit access:', auditError)
      return NextResponse.json({ error: 'Audit not found or access denied' }, { status: 404 })
    }

    // Удаляем аннотации
    const { error: updateError } = await supabase
      .from('audits')
      .update({ 
        annotations: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', auditId)

    if (updateError) {
      console.error('Error deleting annotations:', updateError)
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