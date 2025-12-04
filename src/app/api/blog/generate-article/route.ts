import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

// Генерация промпта для создания SEO статьи из аудита
function generateArticlePrompt(auditData: any, language: string = 'ru'): string {
  const isRussian = language === 'ru' || language === 'ua'

  return `Ты — опытный UX-копирайтер и SEO-специалист. Твоя задача — создать информативную, SEO-оптимизированную статью для блога на основе результатов UX аудита.

${isRussian ? '## ВАЖНО: Всё должно быть анонимизировано!' : '## IMPORTANT: Everything must be anonymized!'}
${isRussian
  ? '- НЕ упоминай конкретное название сайта или продукта\n- НЕ используй реальные имена компаний\n- Говори обобщённо: "e-commerce сайт", "мобильное приложение для доставки еды", "SaaS платформа" и т.д.'
  : '- DO NOT mention specific site or product names\n- DO NOT use real company names\n- Speak generally: "e-commerce site", "food delivery mobile app", "SaaS platform", etc.'}

${isRussian ? '## Данные аудита:' : '## Audit data:'}
${JSON.stringify(auditData, null, 2)}

${isRussian ? '## Структура статьи:' : '## Article structure:'}

${isRussian ? '### 1. Заголовок (title)' : '### 1. Title'}
${isRussian
  ? '- Привлекательный и кликабельный\n- 50-60 символов\n- Содержит ключевые слова\n- Обещает ценность\nПример: "5 критических UX-ошибок в дизайне корзины: кейс e-commerce"'
  : '- Engaging and clickable\n- 50-60 characters\n- Contains keywords\n- Promises value\nExample: "5 Critical UX Mistakes in Cart Design: E-commerce Case Study"'}

${isRussian ? '### 2. Краткое описание (excerpt)' : '### 2. Brief description (excerpt)'}
${isRussian
  ? '- 150-200 символов\n- Интригующее резюме статьи\n- Побуждает прочитать полностью'
  : '- 150-200 characters\n- Intriguing article summary\n- Encourages full read'}

${isRussian ? '### 3. Основной контент (content)' : '### 3. Main content'}
${isRussian
  ? '**Структура:**\n\n#### Введение (2-3 абзаца)\n- Контекст и проблематика\n- Почему это важно\n- Что читатель узнает\n\n#### Основные находки (4-6 блоков)\nДля каждой находки:\n- Заголовок проблемы\n- Описание того, что было обнаружено\n- Почему это проблема (влияние на пользователя)\n- Рекомендация по улучшению\n- Пример хорошей практики (опционально)\n\n#### Заключение (2-3 абзаца)\n- Суммирование ключевых выводов\n- Призыв к действию\n- Приглашение к дискуссии'
  : '**Structure:**\n\n#### Introduction (2-3 paragraphs)\n- Context and problem\n- Why it matters\n- What reader will learn\n\n#### Main findings (4-6 blocks)\nFor each finding:\n- Problem headline\n- Description of what was found\n- Why it\'s a problem (user impact)\n- Improvement recommendation\n- Good practice example (optional)\n\n#### Conclusion (2-3 paragraphs)\n- Summary of key takeaways\n- Call to action\n- Invitation to discussion'}

${isRussian ? '### 4. Meta данные' : '### 4. Meta data'}
${isRussian
  ? '- **meta_title**: SEO заголовок (55-60 символов)\n- **meta_description**: SEO описание (150-160 символов)\n- **keywords**: 5-7 ключевых слов (массив строк)'
  : '- **meta_title**: SEO title (55-60 characters)\n- **meta_description**: SEO description (150-160 characters)\n- **keywords**: 5-7 keywords (string array)'}

${isRussian ? '### 5. Slug' : '### 5. Slug'}
${isRussian
  ? '- URL-friendly версия заголовка\n- Латинскими буквами, через дефис\n- Без спецсимволов\nПример: "5-kriticheskikh-ux-oshibok-korziny-ecommerce"'
  : '- URL-friendly version of title\n- Latin letters, hyphen-separated\n- No special characters\nExample: "5-critical-ux-mistakes-cart-design-ecommerce"'}

${isRussian ? '## Требования к стилю:' : '## Style requirements:'}
${isRussian
  ? '- Экспертный, но доступный тон\n- Используй маркированные списки для улучшения читаемости\n- Добавляй подзаголовки H2, H3\n- Пиши конкретно и по делу\n- Избегай воды и общих фраз\n- Используй примеры и кейсы\n- Длина: 1500-2500 слов'
  : '- Expert but accessible tone\n- Use bullet points for better readability\n- Add H2, H3 subheadings\n- Be specific and to the point\n- Avoid fluff and general phrases\n- Use examples and cases\n- Length: 1500-2500 words'}

${isRussian ? '## Формат ответа (JSON):' : '## Response format (JSON):'}
\`\`\`json
{
  "title": "Заголовок статьи",
  "slug": "url-friendly-slug",
  "excerpt": "Краткое описание 150-200 символов",
  "content": "Полный текст статьи в формате Markdown",
  "meta_title": "SEO заголовок 55-60 символов",
  "meta_description": "SEO описание 150-160 символов",
  "keywords": ["ключевое1", "ключевое2", "ключевое3", "ключевое4", "ключевое5"]
}
\`\`\`

${isRussian
  ? 'Верни ТОЛЬКО валидный JSON без дополнительных комментариев или объяснений.'
  : 'Return ONLY valid JSON without additional comments or explanations.'}`
}

export async function POST(request: NextRequest) {
  try {
    const { auditId } = await request.json()

    if (!auditId) {
      return NextResponse.json(
        { success: false, error: 'Audit ID is required' },
        { status: 400 }
      )
    }

    console.log('📝 Генерация статьи для аудита:', auditId)

    // Получаем аудит с полными данными
    const { data: audit, error: auditError } = await supabase
      .from('audits')
      .select(`
        *,
        project:projects!inner(name, context, target_audience)
      `)
      .eq('id', auditId)
      .eq('allow_blog_publication', true)
      .eq('status', 'completed')
      .single()

    if (auditError || !audit) {
      console.error('❌ Аудит не найден:', auditError)
      return NextResponse.json(
        { success: false, error: 'Audit not found or not eligible for publication' },
        { status: 404 }
      )
    }

    // Проверяем, нет ли уже статьи для этого аудита
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('audit_id', auditId)
      .single()

    if (existingPost) {
      return NextResponse.json(
        { success: false, error: 'Article already exists for this audit' },
        { status: 400 }
      )
    }

    // Формируем данные для промпта
    const auditData = {
      screenDescription: audit.result_data?.screenDescription,
      problemsAndSolutions: audit.result_data?.problemsAndSolutions,
      uxSurvey: audit.result_data?.uxSurvey,
      behavior: audit.result_data?.behavior,
      audience: audit.result_data?.audience,
      abTests: audit.result_data?.ab_tests,
      hypotheses: audit.result_data?.hypotheses,
      businessAnalytics: audit.result_data?.business_analytics,
      projectContext: audit.project?.context,
      targetAudience: audit.project?.target_audience
    }

    console.log('🤖 Вызываем GPT-4 для генерации статьи...')

    // Вызываем GPT-4 для генерации статьи
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Ты опытный UX-копирайтер и SEO-специалист. Создаёшь качественные образовательные статьи на основе UX-аудитов.'
        },
        {
          role: 'user',
          content: generateArticlePrompt(auditData, audit.language || 'ru')
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })

    const generatedContent = completion.choices[0].message.content
    if (!generatedContent) {
      throw new Error('GPT-4 не вернул контент')
    }

    console.log('✅ Статья сгенерирована, парсим JSON...')

    const article = JSON.parse(generatedContent)

    // Определяем категорию на основе содержимого
    const { data: categories } = await supabase
      .from('blog_categories')
      .select('id, slug')

    let categoryId = categories?.find(c => c.slug === 'ux-audit')?.id

    // Сохраняем статью в базу данных
    console.log('💾 Сохраняем статью в БД...')

    const { data: blogPost, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        audit_id: auditId,
        user_id: audit.user_id,
        category_id: categoryId,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        meta_title: article.meta_title,
        meta_description: article.meta_description,
        keywords: article.keywords,
        featured_image_url: audit.input_data?.screenshotUrl || audit.result_data?.screenshot_url,
        status: 'draft',
        language: audit.language || 'ru'
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Ошибка сохранения статьи:', insertError)
      throw insertError
    }

    console.log('✅ Статья успешно создана:', blogPost.id)

    return NextResponse.json({
      success: true,
      data: {
        postId: blogPost.id,
        title: article.title,
        slug: article.slug
      }
    })

  } catch (error) {
    console.error('❌ Ошибка генерации статьи:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
