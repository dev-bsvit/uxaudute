import { NextRequest, NextResponse } from 'next/server'
import { getAnnotations } from '@/lib/database'

// GET /api/annotations?auditId=xxx - Получить аннотации для аудита
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Используем функцию из database.ts, которая уже имеет проверку прав
    const annotations = await getAnnotations(auditId)
    
    return NextResponse.json({ 
      success: true, 
      annotations: annotations || null 
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

    // Используем функцию из database.ts
    const { saveAnnotations } = await import('@/lib/database')
    await saveAnnotations(auditId, annotations || {})

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

    // Используем функцию из database.ts
    const { deleteAnnotations } = await import('@/lib/database')
    await deleteAnnotations(auditId)

    return NextResponse.json({ 
      success: true, 
      message: 'Annotations deleted successfully' 
    })

  } catch (error) {
    console.error('Error in DELETE /api/annotations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}