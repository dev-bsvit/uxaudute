import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/check-audits - Проверить существующие аудиты и их аннотации
export async function GET(request: NextRequest) {
  try {
    // Получаем все аудиты с аннотациями
    const { data: audits, error } = await supabase
      .from('audits')
      .select(`
        id,
        name,
        type,
        status,
        annotations,
        created_at,
        projects!inner(name, user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message 
      })
    }

    // Подсчитываем статистику
    const totalAudits = audits?.length || 0
    const auditsWithAnnotations = audits?.filter(audit => audit.annotations !== null) || []
    const annotationsCount = auditsWithAnnotations.length

    return NextResponse.json({ 
      success: true,
      totalAudits,
      auditsWithAnnotations: annotationsCount,
      audits: audits?.map(audit => ({
        id: audit.id,
        name: audit.name,
        type: audit.type,
        status: audit.status,
        hasAnnotations: audit.annotations !== null,
        annotationsCount: audit.annotations ? Object.keys(audit.annotations).length : 0,
        createdAt: audit.created_at,
        projectName: (audit.projects as any)?.name || 'Unknown Project'
      })) || []
    })

  } catch (error) {
    console.error('Error checking audits:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    })
  }
}
