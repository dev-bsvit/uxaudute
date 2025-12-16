import { Metadata } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params

  try {
    // Получаем пост из базы данных
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select(`
        id,
        title,
        excerpt,
        meta_title,
        meta_description,
        keywords,
        featured_image_url,
        published_at,
        slug,
        category:blog_categories(name)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single()

    if (error || !post) {
      return {
        title: 'Статья не найдена',
        description: 'Запрашиваемая статья не найдена'
      }
    }

    const title = post.meta_title || post.title
    const description = post.meta_description || post.excerpt
    const imageUrl = post.featured_image_url || 'https://ux-audit.vercel.app/og-image.png'
    const url = `https://ux-audit.vercel.app/blog/${slug}`
    const publishedTime = post.published_at

    return {
      title,
      description,
      keywords: post.keywords || [],
      authors: [{ name: 'UX Audit Platform' }],
      openGraph: {
        type: 'article',
        locale: 'ru_RU',
        url,
        siteName: 'UX Audit Platform',
        title,
        description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: post.title,
          },
        ],
        publishedTime,
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: url
      },
      other: {
        'article:published_time': publishedTime,
        'article:author': 'UX Audit Platform',
        'article:section': post.category?.name || 'UX Design',
      }
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'UX Audit Platform',
      description: 'Блог о UX-дизайне'
    }
  }
}
