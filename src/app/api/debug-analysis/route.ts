import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { adaptLegacyAnalysisData, needsDataAdaptation } from '@/lib/analysis-data-adapter'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const auditId = searchParams.get('auditId')

    if (!auditId) {
      return NextResponse.json({ error: 'auditId required' }, { status: 400 })
    }

    // Получаем данные аудита
    const { data: audit, error } = await supabase
      .from('audits')
      .select('*')
      .eq('id', auditId)
      .single()

    if (error || !audit) {
      return NextResponse.json({ error: 'Audit not found' }, { status: 404 })
    }

    const resultData = audit.result_data

    console.log('🔍 DEBUG: Original result_data type:', typeof resultData)
    console.log('🔍 DEBUG: Original result_data keys:', Object.keys(resultData || {}))
    console.log('🔍 DEBUG: Original result_data structure:', JSON.stringify(resultData, null, 2))

    // Проверяем нужна ли адаптация
    const needsAdaptation = needsDataAdaptation(resultData)
    console.log('🔍 DEBUG: Needs adaptation:', needsAdaptation)

    // Пытаемся адаптировать
    let adaptedData = null
    if (needsAdaptation) {
      adaptedData = adaptLegacyAnalysisData(resultData)
      console.log('🔍 DEBUG: Adapted data keys:', Object.keys(adaptedData || {}))
    } else {
      adaptedData = resultData
      console.log('🔍 DEBUG: Using original data')
    }

    return NextResponse.json({
      success: true,
      debug: {
        auditId,
        originalDataType: typeof resultData,
        originalKeys: Object.keys(resultData || {}),
        needsAdaptation,
        adaptedKeys: Object.keys(adaptedData || {}),
        hasScreenDescription: !!(adaptedData?.screenDescription),
        hasUxSurvey: !!(adaptedData?.uxSurvey),
        hasAudience: !!(adaptedData?.audience),
        hasBehavior: !!(adaptedData?.behavior),
        hasProblemsAndSolutions: !!(adaptedData?.problemsAndSolutions),
        hasSelfCheck: !!(adaptedData?.selfCheck),
        hasMetadata: !!(adaptedData?.metadata)
      },
      originalData: resultData,
      adaptedData: adaptedData
    })

  } catch (error) {
    console.error('Debug analysis error:', error)
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}