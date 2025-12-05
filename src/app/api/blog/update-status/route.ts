import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendBlogPublishedEmail } from '@/lib/email'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { postId, status } = await request.json()

    if (!postId || !status) {
      return NextResponse.json(
        { success: false, error: 'Post ID and status are required' },
        { status: 400 }
      )
    }

    if (!['draft', 'published', 'archived'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      )
    }

    console.log(`📝 Изменение статуса статьи ${postId} на ${status}`)

    // Проверяем существование статьи и получаем данные пользователя
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select(`
        id,
        status,
        title,
        slug,
        excerpt,
        user:profiles!blog_posts_user_id_fkey(email, full_name)
      `)
      .eq('id', postId)
      .single()

    if (checkError || !existingPost) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      )
    }

    // Обновляем статус
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    // Если публикуем впервые, устанавливаем published_at
    if (status === 'published' && existingPost.status !== 'published') {
      updateData.published_at = new Date().toISOString()
    }

    const { data: updatedPost, error: updateError } = await supabase
      .from('blog_posts')
      .update(updateData)
      .eq('id', postId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Ошибка обновления статуса:', updateError)
      throw updateError
    }

    console.log('✅ Статус успешно обновлён')

    // Отправляем email уведомление при публикации
    if (status === 'published' && existingPost.status !== 'published') {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const user = existingPost.user as any

      if (user?.email) {
        console.log('📧 Отправка email уведомления пользователю...')
        await sendBlogPublishedEmail({
          userEmail: user.email,
          userName: user.full_name || 'Пользователь',
          postTitle: existingPost.title,
          postUrl: `${baseUrl}/blog/${existingPost.slug}`,
          postExcerpt: existingPost.excerpt || ''
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedPost
    })

  } catch (error) {
    console.error('❌ Ошибка обновления статуса:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
