import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auditId = params.id
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const format = searchParams.get('format')

    if (!token) {
      return NextResponse.json({ error: 'Токен доступа не предоставлен' }, { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Получение публичного аудита:', auditId, 'с токеном:', token)

    // Получаем аудит по ID
    const { data: audit, error: auditError } = await supabaseClient
      .from('audits')
      .select(`
        id,
        name,
        type,
        status,
        input_data,
        result_data,
        annotations,
        confidence,
        public_enabled,
        public_token,
        created_at,
        updated_at,
        projects!inner(
          id,
          name,
          description
        )
      `)
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return NextResponse.json({ error: 'Аудит не найден' }, { status: 404 })
    }

    // Проверяем публичный доступ - сначала через отдельные поля, потом через input_data
    console.log('🔍 Проверяем публичный доступ:', {
      auditId,
      token,
      public_enabled: audit.public_enabled,
      public_token: audit.public_token,
      input_data_public_enabled: audit.input_data?.public_enabled,
      input_data_public_token: audit.input_data?.public_token
    })

    // Проверяем через отдельные поля (если существуют) или через input_data
    const isPublicEnabled = audit.public_enabled === true || audit.input_data?.public_enabled === true
    const isTokenValid = audit.public_token === token || audit.input_data?.public_token === token

    if (!isPublicEnabled || !isTokenValid) {
      console.error('❌ Публичный доступ отключен или неверный токен')
      console.error('🔍 Debug info:', {
        public_enabled: audit.public_enabled,
        public_token: audit.public_token,
        input_data_public_enabled: audit.input_data?.public_enabled,
        input_data_public_token: audit.input_data?.public_token,
        provided_token: token,
        isPublicEnabled,
        isTokenValid
      })
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    console.log('✅ Публичный аудит получен:', audit.name)
    console.log('🔍 Формат запроса:', format)

    // Если запрашивается HTML формат
    if (format === 'html') {
      const html = generateSimpleHTML(audit)
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
        },
      })
    }

    return NextResponse.json({
      success: true,
      audit: {
        id: audit.id,
        name: audit.name,
        type: audit.type,
        status: audit.status,
        input_data: audit.input_data,
        result_data: audit.result_data,
        annotations: audit.annotations,
        confidence: audit.confidence,
        created_at: audit.created_at,
        updated_at: audit.updated_at,
        project: audit.projects,
        // Добавляем данные для всех разделов
        ab_test_data: audit.result_data?.ab_tests || null,
        hypotheses_data: audit.result_data?.hypotheses || null,
        business_analytics_data: audit.result_data?.business_analytics ? 
          { result: audit.result_data.business_analytics } : null
      }
    })

  } catch (error) {
    console.error('❌ Ошибка получения публичного аудита:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function generateSimpleHTML(audit: any): string {
  const resultData = audit.result_data || {}
  const inputData = audit.input_data || {}
  
  return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UX Аудит: ${audit.name}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 20px; margin-bottom: 30px; }
        .title { color: #333; margin: 0 0 10px 0; }
        .subtitle { color: #666; margin: 0; }
        .section { margin-bottom: 30px; }
        .section-title { color: #333; font-size: 18px; margin-bottom: 15px; border-left: 4px solid #007bff; padding-left: 15px; }
        .info-box { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
        .screenshot { max-width: 100%; height: auto; border-radius: 5px; margin: 15px 0; }
        .json-data { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; font-family: monospace; font-size: 12px; }
        .footer { text-align: center; color: #666; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">${audit.name}</h1>
            <p class="subtitle">Проект: ${audit.projects.name} • ${new Date(audit.created_at).toLocaleDateString('ru-RU')}</p>
        </div>

        <div class="section">
            <h2 class="section-title">📋 Информация об аудите</h2>
            <div class="info-box">
                <p><strong>Тип:</strong> ${audit.type}</p>
                <p><strong>Статус:</strong> ${audit.status}</p>
                <p><strong>Дата создания:</strong> ${new Date(audit.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
        </div>

        ${inputData.screenshotUrl ? `
        <div class="section">
            <h2 class="section-title">📸 Анализируемый интерфейс</h2>
            <img src="${inputData.screenshotUrl}" alt="Скриншот интерфейса" class="screenshot" />
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">📊 Результаты анализа</h2>
            <div class="json-data">
                <pre>${JSON.stringify(resultData, null, 2)}</pre>
            </div>
        </div>

        <div class="footer">
            <p>Создано с помощью <a href="/" style="color: #007bff;">UX Audit Platform</a></p>
        </div>
    </div>
</body>
</html>
  `
}
