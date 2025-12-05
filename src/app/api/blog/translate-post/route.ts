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

export async function POST(request: NextRequest) {
  try {
    const { postId, targetLanguage } = await request.json()

    if (!postId || !targetLanguage) {
      return NextResponse.json(
        { success: false, error: 'Post ID and target language are required' },
        { status: 400 }
      )
    }

    if (!['ru', 'ua', 'en'].includes(targetLanguage)) {
      return NextResponse.json(
        { success: false, error: 'Invalid language. Supported: ru, ua, en' },
        { status: 400 }
      )
    }

    console.log(`🌍 Генерация перевода статьи ${postId} на язык: ${targetLanguage}`)

    // Получаем оригинальную статью
    const { data: post, error: postError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Проверяем, существует ли уже перевод
    const { data: existingTranslation } = await supabase
      .from('blog_post_translations')
      .select('id')
      .eq('post_id', postId)
      .eq('language', targetLanguage)
      .single()

    if (existingTranslation) {
      return NextResponse.json(
        { success: false, error: 'Translation already exists for this language' },
        { status: 400 }
      )
    }

    // Генерируем перевод через GPT-4
    const languageNames: Record<string, string> = {
      'ru': 'русский',
      'ua': 'украинский',
      'en': 'английский'
    }

    const targetLang = languageNames[targetLanguage]

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Ты профессиональный переводчик. Переведи следующую статью о UX-дизайне на ${targetLang} язык, сохраняя:
- Профессиональную терминологию
- Структуру и форматирование HTML
- Tone of voice
- SEO-оптимизацию

Верни результат в JSON формате с полями:
{
  "title": "переведённый заголовок",
  "excerpt": "переведённое краткое описание",
  "content": "переведённый HTML контент",
  "meta_title": "переведённый SEO заголовок",
  "meta_description": "переведённое SEO описание"
}`
        },
        {
          role: 'user',
          content: `Оригинальная статья:

Заголовок: ${post.title}

Краткое описание: ${post.excerpt}

Контент:
${post.content}

Meta Title: ${post.meta_title}

Meta Description: ${post.meta_description}

Переведи на ${targetLang} язык.`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3
    })

    const translation = JSON.parse(completion.choices[0].message.content || '{}')

    console.log('✅ Перевод сгенерирован через GPT-4')

    // Сохраняем перевод в базу данных
    const { data: savedTranslation, error: saveError } = await supabase
      .from('blog_post_translations')
      .insert({
        post_id: postId,
        language: targetLanguage,
        title: translation.title,
        excerpt: translation.excerpt,
        content: translation.content,
        meta_title: translation.meta_title,
        meta_description: translation.meta_description
      })
      .select()
      .single()

    if (saveError) {
      console.error('❌ Ошибка сохранения перевода:', saveError)
      throw saveError
    }

    console.log('✅ Перевод сохранён в базе данных')

    return NextResponse.json({
      success: true,
      data: savedTranslation
    })

  } catch (error) {
    console.error('❌ Ошибка генерации перевода:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
