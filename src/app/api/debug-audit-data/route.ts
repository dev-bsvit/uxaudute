import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('id')
    
    if (!auditId) {
      return NextResponse.json({ error: 'Audit ID is required' }, { status: 400 })
    }

    // Получаем данные аудита из базы
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    // Анализируем структуру данных
    const analysis = {
      auditId: audit.id,
      status: audit.status,
      hasResultData: !!audit.result_data,
      resultDataType: typeof audit.result_data,
      resultDataKeys: audit.result_data ? Object.keys(audit.result_data) : [] as string[],
      
      // Если result_data это объект с content
      hasContent: audit.result_data && typeof audit.result_data === 'object' && 'content' in audit.result_data,
      contentType: audit.result_data?.content ? typeof audit.result_data.content : null,
      contentLength: audit.result_data?.content ? audit.result_data.content.length : 0,
      contentPreview: audit.result_data?.content ? audit.result_data.content.substring(0, 500) : null,
      
      // Пробуем парсить content как JSON
      contentParseable: false,
      parsedContentKeys: [] as string[],
      parseError: null as string | null,
      
      // Сырые данные для отладки
      rawResultData: audit.result_data
    }

    // Пытаемся распарсить content
    if (audit.result_data?.content) {
      try {
        const parsed = JSON.parse(audit.result_data.content)
        analysis.contentParseable = true
        analysis.parsedContentKeys = Object.keys(parsed)
      } catch (error) {
        analysis.parseError = error instanceof Error ? error.message : 'Unknown parse error'
      }
    }

    return NextResponse.json({
      success: true,
      analysis,
      recommendations: [
        analysis.hasContent && !analysis.contentParseable ? 'Content exists but is not valid JSON' : null,
        !analysis.hasResultData ? 'No result_data found' : null,
        analysis.resultDataType !== 'object' ? 'result_data is not an object' : null
      ].filter(Boolean)
    })

  } catch (error) {
    console.error('Debug audit data error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}