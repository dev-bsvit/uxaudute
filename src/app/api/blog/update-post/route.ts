import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const {
      postId,
      title,
      slug,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      keywords
    } = await request.json()

    if (!postId) {
      return NextResponse.json(
        { success: false, error: 'Post ID is required' },
        { status: 400 }
      )
    }

    console.log('📝 Обновление статьи:', postId)

    // Проверяем существование статьи
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Обновляем статью
    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update({
        title,
        slug,
        excerpt,
        content,
        meta_title: metaTitle,
        meta_description: metaDescription,
        keywords,
        updated_at: new Date().toISOString()
      })
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Ошибка обновления статьи:', updateError)
      throw updateError
    }

    console.log('✅ Статья успешно обновлена')

    return NextResponse.json({
      success: true,
      data: updatedPost
    })

  } catch (error) {
    console.error('❌ Ошибка обновления статьи:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
