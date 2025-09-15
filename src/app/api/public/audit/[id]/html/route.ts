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
            
            ${resultData.audience ? `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">👥 Целевая аудитория</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <p class="text-gray-700"><strong>Основная боль:</strong> ${resultData.audience.mainPain || 'Не указано'}</p>
                    <p class="text-gray-700 mt-2"><strong>Целевая аудитория:</strong> ${resultData.audience.targetAudience || 'Не указано'}</p>
                    ${resultData.audience.fears ? `
                    <div class="mt-3">
                        <p class="text-gray-700 font-medium">Страхи пользователей:</p>
                        <ul class="list-disc list-inside text-gray-600 mt-1">
                            ${resultData.audience.fears.map((fear: string) => `<li>${fear}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${resultData.behavior ? `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">🎯 Поведение пользователей</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    ${resultData.behavior.userScenarios ? `
                    <div class="mb-3">
                        <p class="text-gray-700 font-medium">Идеальный путь:</p>
                        <p class="text-gray-600">${resultData.behavior.userScenarios.idealPath || 'Не указано'}</p>
                    </div>
                    <div class="mb-3">
                        <p class="text-gray-700 font-medium">Типичная ошибка:</p>
                        <p class="text-gray-600">${resultData.behavior.userScenarios.typicalError || 'Не указано'}</p>
                    </div>
                    ` : ''}
                    ${resultData.behavior.actionMotivation ? `
                    <div class="mb-3">
                        <p class="text-gray-700 font-medium">Мотивация действия:</p>
                        <p class="text-gray-600">${resultData.behavior.actionMotivation}</p>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

            ${resultData.problemsAndSolutions ? `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">🔧 Проблемы и решения</h3>
                <div class="space-y-4">
                    ${resultData.problemsAndSolutions.map((problem: any, index: number) => `
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-start justify-between mb-2">
                            <h4 class="font-medium text-gray-900">${problem.element || 'Элемент'}</h4>
                            <span class="px-2 py-1 text-xs font-medium ${
                                problem.priority === 'high' ? 'bg-red-100 text-red-800' : 
                                problem.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-green-100 text-green-800'
                            } rounded-full">
                                ${problem.priority === 'high' ? 'Высокий' : 
                                  problem.priority === 'medium' ? 'Средний' : 'Низкий'} приоритет
                            </span>
                        </div>
                        <p class="text-gray-700 mb-2"><strong>Проблема:</strong> ${problem.problem || 'Не указано'}</p>
                        <p class="text-gray-600 mb-2"><strong>Последствие:</strong> ${problem.consequence || 'Не указано'}</p>
                        <p class="text-gray-600"><strong>Рекомендация:</strong> ${problem.recommendation || 'Не указано'}</p>
                    </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${resultData.uxSurvey ? `
            <div class="mb-6">
                <h3 class="text-lg font-medium text-gray-900 mb-3">📊 UX Опрос</h3>
                <div class="bg-gray-50 rounded-lg p-4">
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">${resultData.uxSurvey.summary?.totalQuestions || 0}</div>
                            <div class="text-sm text-gray-600">Вопросов</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-red-600">${resultData.uxSurvey.summary?.criticalIssues || 0}</div>
                            <div class="text-sm text-gray-600">Критических проблем</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-green-600">${resultData.uxSurvey.summary?.averageConfidence || 0}%</div>
                            <div class="text-sm text-gray-600">Средняя уверенность</div>
                        </div>
                    </div>
                    ${resultData.uxSurvey.summary?.recommendations ? `
                    <div class="mt-4">
                        <p class="text-gray-700 font-medium mb-2">Рекомендации:</p>
                        <ul class="list-disc list-inside text-gray-600">
                            ${resultData.uxSurvey.summary.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                        </ul>
                    </div>
                    ` : ''}
                </div>
            </div>
            ` : ''}

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
}
