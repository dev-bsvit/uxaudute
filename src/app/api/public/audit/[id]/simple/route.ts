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

    if (!token) {
      return new NextResponse('Токен доступа не предоставлен', { status: 400 })
    }

    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('🔍 Получение публичного аудита для простой страницы:', auditId, 'с токеном:', token)

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
        created_at,
        projects!inner(
          id,
          name
        )
      `)
      .eq('id', auditId)
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return new NextResponse('Аудит не найден', { status: 404 })
    }

    // Проверяем публичный доступ через input_data
    if (!audit.input_data?.public_enabled || audit.input_data?.public_token !== token) {
      console.error('❌ Публичный доступ отключен или неверный токен')
      return new NextResponse('Доступ запрещен', { status: 403 })
    }

    console.log('✅ Публичный аудит получен для простой страницы:', audit.name)

    // Простая HTML страница
    const html = `
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
            <p class="subtitle">Проект: ${audit.project.name} • ${new Date(audit.created_at).toLocaleDateString('ru-RU')}</p>
        </div>

        <div class="section">
            <h2 class="section-title">📋 Информация об аудите</h2>
            <div class="info-box">
                <p><strong>Тип:</strong> ${audit.type}</p>
                <p><strong>Статус:</strong> ${audit.status}</p>
                <p><strong>Дата создания:</strong> ${new Date(audit.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
        </div>

        ${audit.input_data?.screenshotUrl ? `
        <div class="section">
            <h2 class="section-title">📸 Анализируемый интерфейс</h2>
            <img src="${audit.input_data.screenshotUrl}" alt="Скриншот интерфейса" class="screenshot" />
        </div>
        ` : ''}

        <div class="section">
            <h2 class="section-title">📊 Результаты анализа</h2>
            <div class="json-data">
                <pre>${JSON.stringify(audit.result_data, null, 2)}</pre>
            </div>
        </div>

        <div class="footer">
            <p>Создано с помощью <a href="/" style="color: #007bff;">UX Audit Platform</a></p>
        </div>
    </div>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('❌ Ошибка получения публичного аудита для простой страницы:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
