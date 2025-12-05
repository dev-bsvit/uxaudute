import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

    // Проверяем существование статьи
    const { data: existingPost, error: checkError } = await supabase
      .from('blog_posts')
      .select('id, status')
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
