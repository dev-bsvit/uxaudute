import { ImageResponse } from 'next/og'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const runtime = 'edge'
export const alt = 'UX Audit Platform Blog'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { slug: string } }) {
  const { slug } = params

  try {
    // Получаем пост
    const { data: post } = await supabase
      .from('blog_posts')
      .select('title, excerpt, category:blog_categories(name)')
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (!post) {
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 60,
              background: 'linear-gradient(to bottom right, #3b82f6, #6366f1)',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
          >
            UX Audit Platform
          </div>
        ),
        {
          ...size,
        }
      )
    }

    return new ImageResponse(
      (
        <div
          style={{
            background: 'linear-gradient(to bottom right, #3b82f6, #6366f1)',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'flex-end',
            padding: 80,
            color: 'white',
          }}
        >
          {/* Category */}
          {(post as any).category?.name && (
            <div
              style={{
                fontSize: 24,
                marginBottom: 20,
                opacity: 0.9,
                fontWeight: 500,
              }}
            >
              {(post as any).category.name}
            </div>
          )}

          {/* Title */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 'bold',
              lineHeight: 1.2,
              marginBottom: 20,
              maxWidth: '90%',
            }}
          >
            {post.title}
          </div>

          {/* Excerpt */}
          <div
            style={{
              fontSize: 28,
              opacity: 0.9,
              lineHeight: 1.4,
              maxWidth: '85%',
            }}
          >
            {post.excerpt.substring(0, 120)}...
          </div>

          {/* Brand */}
          <div
            style={{
              position: 'absolute',
              top: 60,
              right: 80,
              fontSize: 32,
              fontWeight: 'bold',
            }}
          >
            UX Audit Platform
          </div>
        </div>
      ),
      {
        ...size,
      }
    )
  } catch (error) {
    console.error('Error generating OG image:', error)
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 60,
            background: 'linear-gradient(to bottom right, #3b82f6, #6366f1)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 'bold',
          }}
        >
          UX Audit Platform
        </div>
      ),
      {
        ...size,
      }
    )
  }
}
