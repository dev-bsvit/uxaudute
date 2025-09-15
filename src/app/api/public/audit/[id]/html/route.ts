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

    console.log('🔍 Получение публичного аудита для HTML:', auditId, 'с токеном:', token)

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
      return new NextResponse('Аудит не найден', { status: 404 })
    }

    // Проверяем публичный доступ через input_data
    if (!audit.input_data?.public_enabled || audit.input_data?.public_token !== token) {
      console.error('❌ Публичный доступ отключен или неверный токен')
      return new NextResponse('Доступ запрещен', { status: 403 })
    }

    console.log('✅ Публичный аудит получен для HTML:', audit.name)

    // Генерируем HTML страницу
    const html = generateAuditHTML(audit)

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

  } catch (error) {
    console.error('❌ Ошибка получения публичного аудита для HTML:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

function generateAuditHTML(audit: any): string {
  try {
    const resultData = audit.result_data || {}
    const inputData = audit.input_data || {}
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UX Аудит: ${audit.name}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        .gradient-bg { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .card-shadow { box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); }
    </style>
</head>
<body class="bg-gray-50">
    <!-- Заголовок -->
    <div class="bg-white border-b border-gray-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div class="flex items-center justify-between">
                <div>
                    <div class="flex items-center gap-3 mb-2">
                        <h1 class="text-2xl font-bold text-gray-900">${audit.name}</h1>
                        <span class="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">${audit.type}</span>
                        ${audit.confidence ? `<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Уверенность: ${audit.confidence}%</span>` : ''}
                    </div>
                    <p class="text-gray-600">
                        Проект: ${audit.project.name} • ${new Date(audit.created_at).toLocaleDateString('ru-RU')}
                    </p>
                </div>
            </div>
        </div>
    </div>

    <!-- Контент -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="bg-white rounded-lg card-shadow p-6">
            <h2 class="text-xl font-semibold text-gray-900 mb-4">Результаты UX Анализа</h2>
            
            <!-- Основная информация -->
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">📋 Общая информация</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-gray-700"><strong>Название аудита:</strong> ${audit.name}</p>
                    <p class="text-gray-700 mt-2"><strong>Тип:</strong> ${audit.type}</p>
                    <p class="text-gray-700 mt-2"><strong>Статус:</strong> ${audit.status}</p>
                    <p class="text-gray-700 mt-2"><strong>Дата создания:</strong> ${new Date(audit.created_at).toLocaleDateString('ru-RU')}</p>
                    ${audit.confidence ? `<p class="text-gray-700 mt-2"><strong>Уверенность анализа:</strong> ${audit.confidence}%</p>` : ''}
                </div>
            </div>

            <!-- Результаты анализа -->
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">📊 Результаты анализа</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <pre class="whitespace-pre-wrap text-sm text-gray-700 overflow-auto">${JSON.stringify(resultData, null, 2)}</pre>
                </div>
            </div>

            <!-- Скриншот если есть -->
            ${inputData.screenshotUrl ? `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">📸 Анализируемый интерфейс</h3>
                <div class="text-center">
                    <img src="${inputData.screenshotUrl}" alt="Скриншот интерфейса" class="max-w-full h-auto rounded-lg border border-gray-200" />
                </div>
            </div>
            ` : ''}
        </div>

        <!-- Футер -->
        <div class="mt-8 text-center text-sm text-gray-500">
            <p>
                Создано с помощью <a href="/" class="text-blue-600 hover:text-blue-700 font-medium">UX Audit Platform</a>
            </p>
        </div>
    </div>
</body>
</html>
  `
  } catch (error) {
    console.error('❌ Ошибка генерации HTML:', error)
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ошибка загрузки аудита</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div class="min-h-screen flex items-center justify-center">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">Ошибка загрузки аудита</h1>
            <p class="text-gray-600">Произошла ошибка при генерации страницы аудита.</p>
        </div>
    </div>
</body>
</html>
    `
  }
}
