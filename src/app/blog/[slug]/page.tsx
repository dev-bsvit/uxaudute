'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogComments } from '@/components/blog-comments'
import { Calendar, ArrowLeft, Share2, Eye } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string | null
  published_at: string
  views_count: number
  meta_title: string
  meta_description: string
  keywords: string[]
  category: {
    id: string
    name: string
    slug: string
  }
}

export default function BlogPostPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (slug) {
      loadPost()
    }
  }, [slug])

  const loadPost = async () => {
    try {
      const response = await fetch(`/api/blog/post/${slug}`)
      const data = await response.json()

      if (data.success) {
        setPost(data.data)

        // Устанавливаем meta теги
        if (data.data.meta_title) {
          document.title = data.data.meta_title
        }
      } else {
        router.push('/blog')
      }
    } catch (error) {
      console.error('Error loading post:', error)
      router.push('/blog')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
  }

  const handleShare = async () => {
    if (navigator.share && post) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Ссылка скопирована в буфер обмена')
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="animate-pulse space-y-8">
              <div className="h-8 w-32 bg-slate-200 rounded"></div>
              <div className="h-12 w-full bg-slate-200 rounded"></div>
              <div className="h-64 w-full bg-slate-200 rounded"></div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-slate-200 rounded"></div>
                <div className="h-4 w-full bg-slate-200 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!post) {
    return null
  }

  return (
    <Layout>
      <article className="min-h-screen bg-white">
        {/* Top Bar - как в Medium */}
        <div className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-[680px] mx-auto px-6 py-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => router.push('/blog')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="text-gray-600 hover:text-gray-900"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Header - Medium Style */}
        <div className="max-w-[680px] mx-auto px-6 pt-16 pb-10">
          {/* Category Badge */}
          {post.category && (
            <div className="mb-3">
              <Badge variant="secondary" className="text-xs font-normal bg-gray-100 text-gray-700 hover:bg-gray-200">
                {post.category.name}
              </Badge>
            </div>
          )}

          {/* Title - крупный как в Medium */}
          <h1 className="text-[42px] leading-[52px] font-bold tracking-tight text-gray-900 mb-3 font-serif">
            {post.title}
          </h1>

          {/* Subtitle/Excerpt */}
          <p className="text-[22px] leading-[32px] text-gray-600 mb-8 font-serif">
            {post.excerpt}
          </p>

          {/* Meta Info - компактно */}
          <div className="flex items-center gap-6 text-sm text-gray-600 pb-8 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(post.published_at)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{post.views_count || 0} просмотров</span>
            </div>
          </div>
        </div>

        {/* Featured Image - на всю ширину как в Medium */}
        {post.featured_image_url && (
          <div className="mb-12">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full max-w-full"
            />
          </div>
        )}

        {/* Content - стиль Medium */}
        <div className="max-w-[680px] mx-auto px-6 pb-16">
          <div
            className="prose prose-lg max-w-none
              [&>*]:font-serif
              prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
              prose-h1:text-[32px] prose-h1:leading-[40px] prose-h1:mb-6 prose-h1:mt-12
              prose-h2:text-[28px] prose-h2:leading-[36px] prose-h2:mb-5 prose-h2:mt-10
              prose-h3:text-[24px] prose-h3:leading-[32px] prose-h3:mb-4 prose-h3:mt-8
              prose-p:text-[21px] prose-p:leading-[32px] prose-p:text-gray-800 prose-p:mb-8 prose-p:tracking-[-0.003em]
              prose-a:text-gray-900 prose-a:underline prose-a:decoration-gray-400 hover:prose-a:decoration-gray-900
              prose-strong:text-gray-900 prose-strong:font-bold
              prose-em:italic
              prose-code:text-[18px] prose-code:bg-gray-100 prose-code:text-red-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
              prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-6 prose-pre:rounded-lg prose-pre:overflow-x-auto
              prose-ul:my-6 prose-ul:list-disc prose-ul:pl-8
              prose-ol:my-6 prose-ol:list-decimal prose-ol:pl-8
              prose-li:text-[21px] prose-li:leading-[32px] prose-li:text-gray-800 prose-li:mb-2 prose-li:pl-2
              prose-blockquote:border-l-4 prose-blockquote:border-gray-900 prose-blockquote:pl-6 prose-blockquote:pr-6 prose-blockquote:py-4 prose-blockquote:my-8 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-transparent
              prose-img:w-full prose-img:my-10 prose-img:rounded-none
              prose-hr:border-gray-200 prose-hr:my-10"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Keywords - в стиле Medium tags */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-16 pt-8 border-t border-gray-200">
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm font-normal px-3 py-1"
                  >
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* CTA - чище и минималистичнее */}
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="max-w-[680px] mx-auto px-6 py-16 text-center">
            <h3 className="text-[28px] leading-[36px] font-bold text-gray-900 mb-4 font-serif">
              Хотите улучшить UX вашего продукта?
            </h3>
            <p className="text-[18px] leading-[28px] text-gray-600 mb-8 max-w-lg mx-auto">
              Получите детальный UX-аудит с конкретными рекомендациями по улучшению пользовательского опыта
            </p>
            <Button
              size="lg"
              className="bg-gray-900 text-white hover:bg-gray-800 font-medium"
              onClick={() => router.push('/')}
            >
              Начать анализ
            </Button>
          </div>
        </div>

        {/* Комментарии */}
        <div className="max-w-[680px] mx-auto px-6 py-16">
          <BlogComments postId={post.id} />
        </div>
      </article>
    </Layout>
  )
}
