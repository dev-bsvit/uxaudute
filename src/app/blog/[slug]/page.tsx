'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { BlogComments } from '@/components/blog-comments'
import { BlogSidebar } from '@/components/blog-sidebar'
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
        {/* Top Bar - минималистичный как в VC.ru */}
        <div className="bg-white sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
              onClick={() => router.push('/blog')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              К блогу
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

        {/* Two-column layout - VC.ru style */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Main Content Column */}
            <div className="flex-1 max-w-[780px]">
              {/* Header */}
              <div className="mb-6">
                {/* Category Badge */}
                {post.category && (
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border-0">
                      {post.category.name}
                    </Badge>
                  </div>
                )}

                {/* Title - VC.ru размер */}
                <h1 className="text-[32px] leading-[40px] font-bold tracking-tight text-gray-900 mb-4">
                  {post.title}
                </h1>

                {/* Meta Info - компактно без нижней границы */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(post.published_at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{post.views_count || 0}</span>
                  </div>
                </div>
              </div>

              {/* Featured Image - фиксированные пропорции 3:2 (1280x853) */}
              {post.featured_image_url && (
                <div className="mb-8 w-full bg-gray-100 rounded-lg overflow-hidden">
                  <div className="w-full" style={{ aspectRatio: '3/2' }}>
                    <img
                      src={post.featured_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Excerpt */}
              <p className="text-[18px] leading-[28px] text-gray-700 mb-8 font-medium">
                {post.excerpt}
              </p>

              {/* Content - VC.ru стиль */}
              <div
                className="prose prose-lg max-w-none
                  prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-gray-900
                  prose-h1:text-[28px] prose-h1:leading-[36px] prose-h1:mb-5 prose-h1:mt-10
                  prose-h2:text-[24px] prose-h2:leading-[32px] prose-h2:mb-4 prose-h2:mt-8
                  prose-h3:text-[20px] prose-h3:leading-[28px] prose-h3:mb-3 prose-h3:mt-6
                  prose-p:text-[17px] prose-p:leading-[28px] prose-p:text-gray-800 prose-p:mb-6
                  prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                  prose-strong:text-gray-900 prose-strong:font-semibold
                  prose-em:italic
                  prose-code:text-[15px] prose-code:bg-gray-100 prose-code:text-red-600 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:before:content-[''] prose-code:after:content-['']
                  prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-5 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-sm
                  prose-ul:my-5 prose-ul:list-disc prose-ul:pl-6
                  prose-ol:my-5 prose-ol:list-decimal prose-ol:pl-6
                  prose-li:text-[17px] prose-li:leading-[28px] prose-li:text-gray-800 prose-li:mb-2
                  prose-blockquote:border-l-3 prose-blockquote:border-blue-500 prose-blockquote:pl-5 prose-blockquote:py-2 prose-blockquote:my-6 prose-blockquote:italic prose-blockquote:text-gray-700 prose-blockquote:bg-blue-50/30
                  prose-img:w-full prose-img:my-8 prose-img:rounded-lg
                  prose-hr:border-gray-100 prose-hr:my-8"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Keywords - компактно */}
              {post.keywords && post.keywords.length > 0 && (
                <div className="mt-12 pt-6">
                  <div className="flex flex-wrap gap-2">
                    {post.keywords.map((keyword, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-gray-100 text-gray-600 hover:bg-gray-200 text-sm font-normal px-3 py-1 border-0"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Комментарии */}
              <div className="mt-16">
                <BlogComments postId={post.id} />
              </div>
            </div>

            {/* Sidebar Column */}
            <div className="hidden lg:block w-80">
              <BlogSidebar currentPostId={post.id} />
            </div>
          </div>
        </div>
      </article>
    </Layout>
  )
}
