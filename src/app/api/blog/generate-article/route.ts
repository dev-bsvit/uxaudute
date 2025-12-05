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

// Генерация промпта для создания глубокой экспертной статьи
function generateArticlePrompt(auditData: any, language: string = 'ru'): string {
  const isRussian = language === 'ru' || language === 'ua'

  return `Ты — ведущий UX-эксперт и профессиональный автор статей в стиле Medium. Твоя задача — создать ГЛУБОКУЮ, ЭКСПЕРТНУЮ и ЧИТАЕМУЮ статью на основе UX-аудита.

${isRussian ? '## ВАЖНО: Анонимность!' : '## IMPORTANT: Anonymity!'}
${isRussian
  ? '- НЕ упоминай конкретные названия\n- Используй обобщения: "e-commerce платформа", "мобильное приложение", "SaaS сервис"'
  : '- DO NOT mention specific names\n- Use generalizations: "e-commerce platform", "mobile app", "SaaS service"'}

${isRussian ? '## Данные аудита:' : '## Audit data:'}
${JSON.stringify(auditData, null, 2)}

${isRussian ? '## СТРУКТУРА СТАТЬИ (2500-3500 слов):' : '## ARTICLE STRUCTURE (2500-3500 words):'}

${isRussian ? '### ВВЕДЕНИЕ (300-400 слов)' : '### INTRODUCTION (300-400 words)'}
${isRussian
  ? '- Зацепляющее начало с вопросом или фактом\n- Контекст проблемы с примером\n- Почему это критично для бизнеса\n- Что узнает читатель (preview)'
  : '- Hook with question or fact\n- Problem context with example\n- Why it\'s critical for business\n- What reader will learn (preview)'}

${isRussian ? '### ОСНОВНАЯ ЧАСТЬ (1800-2500 слов)' : '### MAIN BODY (1800-2500 words)'}

${isRussian ? '#### Для каждой проблемы (5-8 блоков):' : '#### For each problem (5-8 blocks):'}

${isRussian ? '**1. Заголовок H2 (эмоциональный и конкретный)**' : '**1. H2 Headline (emotional and specific)**'}
${isRussian
  ? 'Пример: "Почему пользователи бросают корзину: проблема с доверием"'
  : 'Example: "Why Users Abandon Cart: The Trust Problem"'}

${isRussian ? '**2. Контекст (2-3 абзаца)**' : '**2. Context (2-3 paragraphs)**'}
${isRussian
  ? '- Что мы обнаружили\n- Как это проявляется\n- Реальный пример из практики'
  : '- What we discovered\n- How it manifests\n- Real-world example'}

${isRussian ? '**3. Влияние на пользователя и бизнес (H3)**' : '**3. Impact on user and business (H3)**'}
${isRussian
  ? '- Что чувствует пользователь\n- Конкретные метрики (процент оттока, конверсия)\n- Финансовое влияние (если возможно)'
  : '- What user feels\n- Specific metrics (churn rate, conversion)\n- Financial impact (if possible)'}

${isRussian ? '**4. Глубокий анализ причин (H3)**' : '**4. Deep analysis of causes (H3)**'}
${isRussian
  ? '- Психология пользователя\n- UX-принципы, которые нарушены\n- Отраслевой контекст'
  : '- User psychology\n- UX principles violated\n- Industry context'}

${isRussian ? '**5. Решение с деталями (H3)**' : '**5. Solution with details (H3)**'}
${isRussian
  ? '- Конкретные шаги реализации\n- Best practices из индустрии\n- Что это даст (измеримые результаты)'
  : '- Concrete implementation steps\n- Industry best practices\n- Expected results (measurable)'}

${isRussian ? '**6. Цитата или выноска (blockquote)**' : '**6. Quote or callout (blockquote)**'}
${isRussian
  ? 'Ключевой инсайт или статистика для акцента'
  : 'Key insight or statistic for emphasis'}

${isRussian ? '### ЗАКЛЮЧЕНИЕ (400-600 слов)' : '### CONCLUSION (400-600 words)'}

${isRussian ? '**Итоговые выводы (H2)**' : '**Key Takeaways (H2)**'}
${isRussian
  ? '- Суммируй 3-5 главных инсайтов\n- Нумерованный список с развёрнутыми пояснениями\n- Каждый пункт — 2-3 предложения'
  : '- Summarize 3-5 main insights\n- Numbered list with detailed explanations\n- Each point — 2-3 sentences'}

${isRussian ? '**Практические рекомендации (H2)**' : '**Practical Recommendations (H2)**'}
${isRussian
  ? '- Что делать прямо сейчас\n- Инструменты и методы\n- С чего начать'
  : '- What to do right now\n- Tools and methods\n- Where to start'}

${isRussian ? '**Призыв к действию**' : '**Call to action**'}
${isRussian
  ? '- Вопрос читателю\n- Приглашение поделиться опытом\n- Что попробовать'
  : '- Question to reader\n- Invitation to share experience\n- What to try'}

${isRussian ? '## ТРЕБОВАНИЯ К ФОРМАТИРОВАНИЮ (HTML):' : '## FORMATTING REQUIREMENTS (HTML):'}

${isRussian ? '**Используй:**' : '**Use:**'}
- <h2> ${isRussian ? 'для основных разделов' : 'for main sections'}
- <h3> ${isRussian ? 'для подразделов' : 'for subsections'}
- <p> ${isRussian ? 'для абзацев (3-5 предложений)' : 'for paragraphs (3-5 sentences)'}
- <strong> ${isRussian ? 'для акцентов' : 'for emphasis'}
- <em> ${isRussian ? 'для курсива' : 'for italics'}
- <ul><li> ${isRussian ? 'для списков' : 'for lists'}
- <blockquote> ${isRussian ? 'для цитат и важных выносок' : 'for quotes and callouts'}
- <code> ${isRussian ? 'для терминов' : 'for terms'}

${isRussian ? '**НЕ используй:**' : '**DO NOT use:**'}
- ${isRussian ? 'Markdown синтаксис (###, **, --)' : 'Markdown syntax (###, **, --)'}
- ${isRussian ? 'Эмодзи и спецсимволы (✓, →, •)' : 'Emojis and special symbols (✓, →, •)'}
- ${isRussian ? 'Плохое форматирование' : 'Poor formatting'}

${isRussian ? '## СТИЛЬ ПИСЬМА:' : '## WRITING STYLE:'}
${isRussian
  ? '✅ ДЕЛАЙ:\n- Пиши как человек, не как робот\n- Используй примеры из жизни\n- Добавляй метафоры и аналогии\n- Варьируй длину предложений\n- Задавай риторические вопросы\n- Используй storytelling\n- Добавляй конкретные цифры\n- Делай акценты через blockquote\n\n❌ НЕ ДЕЛАЙ:\n- Общие фразы ("важно помнить", "не стоит забывать")\n- Роботический язык\n- Списки без контекста\n- Сухие перечисления\n- Банальности'
  : '✅ DO:\n- Write as human, not robot\n- Use real-life examples\n- Add metaphors and analogies\n- Vary sentence length\n- Ask rhetorical questions\n- Use storytelling\n- Add specific numbers\n- Make accents via blockquote\n\n❌ DON\'T:\n- Generic phrases\n- Robotic language\n- Lists without context\n- Dry enumerations\n- Banalities'}

${isRussian ? '## JSON ОТВЕТ:' : '## JSON RESPONSE:'}
\`\`\`json
{
  "title": "${isRussian ? 'Цепляющий заголовок' : 'Catchy title'}",
  "slug": "url-friendly-slug",
  "excerpt": "${isRussian ? 'Интригующее описание 160-200 символов' : 'Intriguing description 160-200 chars'}",
  "content": "${isRussian ? 'HTML контент со структурой выше' : 'HTML content with structure above'}",
  "meta_title": "SEO ${isRussian ? 'заголовок' : 'title'} 55-60",
  "meta_description": "SEO ${isRussian ? 'описание' : 'description'} 150-160",
  "keywords": ["${isRussian ? 'ключ' : 'key'}1", "${isRussian ? 'ключ' : 'key'}2", "${isRussian ? 'ключ' : 'key'}3", "${isRussian ? 'ключ' : 'key'}4", "${isRussian ? 'ключ' : 'key'}5", "${isRussian ? 'ключ' : 'key'}6", "${isRussian ? 'ключ' : 'key'}7"]
}
\`\`\`

${isRussian
  ? 'Верни ТОЛЬКО валидный JSON. Контент должен быть ГЛУБОКИМ, ЭКСПЕРТНЫМ и ЧИТАЕМЫМ как статья на Medium.'
  : 'Return ONLY valid JSON. Content must be DEEP, EXPERT and READABLE like Medium article.'}`
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
          content: 'Ты — ведущий UX-эксперт и профессиональный автор статей в стиле Medium, The Verge и Smashing Magazine. Пишешь глубокие, экспертные и читаемые статьи. Твой стиль — живой, с примерами, метафорами и конкретикой. Ты избегаешь банальностей и роботического языка. Каждая твоя статья — это история с инсайтами.'
        },
        {
          role: 'user',
          content: generateArticlePrompt(auditData, audit.language || 'ru')
        }
      ],
      temperature: 0.85,
      response_format: { type: 'json_object' },
      max_tokens: 6000
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
