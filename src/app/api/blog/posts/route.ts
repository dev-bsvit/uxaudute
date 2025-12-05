import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const categoryId = searchParams.get('category')

    let query = supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        featured_image_url,
        published_at,
        created_at,
        language,
        category:blog_categories(id, name, slug)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('❌ Ошибка получения статей:', error)
      throw error
    }

    // Получаем общее количество статей для пагинации
    let countQuery = supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'published')

    if (categoryId) {
      countQuery = countQuery.eq('category_id', categoryId)
    }

    const { count } = await countQuery

    return NextResponse.json({
      success: true,
      data: {
        posts,
        total: count || 0,
        limit,
        offset
      }
    })

  } catch (error) {
    console.error('❌ Ошибка API blog/posts:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
