'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Layout } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, ArrowLeft, Share2 } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string | null
  published_at: string
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
        {/* Header */}
        <div className="bg-gradient-to-b from-slate-50 to-white border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            {/* Back Button */}
            <Button
              variant="ghost"
              className="mb-8 -ml-4"
              onClick={() => router.push('/blog')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к блогу
            </Button>

            {/* Category */}
            {post.category && (
              <Badge className="mb-4">
                {post.category.name}
              </Badge>
            )}

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-slate-600 mb-6">
              {post.excerpt}
            </p>

            {/* Meta */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-500">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.published_at)}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Поделиться
              </Button>
            </div>
          </div>
        </div>

        {/* Featured Image */}
        {post.featured_image_url && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 mb-12">
            <img
              src={post.featured_image_url}
              alt={post.title}
              className="w-full rounded-xl shadow-2xl"
            />
          </div>
        )}

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div
            className="prose prose-lg prose-slate max-w-none
              prose-headings:font-bold prose-headings:text-slate-900
              prose-p:text-slate-700 prose-p:leading-relaxed
              prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-slate-900 prose-strong:font-semibold
              prose-code:text-blue-600 prose-code:bg-blue-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-slate-900 prose-pre:text-slate-100
              prose-ul:list-disc prose-ol:list-decimal
              prose-li:text-slate-700 prose-li:marker:text-blue-600
              prose-blockquote:border-l-blue-600 prose-blockquote:bg-blue-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r
              prose-img:rounded-lg prose-img:shadow-lg"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Keywords */}
          {post.keywords && post.keywords.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Ключевые слова:
              </h3>
              <div className="flex flex-wrap gap-2">
                {post.keywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl text-white text-center">
            <h3 className="text-2xl font-bold mb-4">
              Хотите улучшить UX вашего продукта?
            </h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Получите детальный UX-аудит с конкретными рекомендациями по улучшению пользовательского опыта
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-blue-50"
              onClick={() => router.push('/')}
            >
              Начать анализ
            </Button>
          </div>
        </div>
      </article>
    </Layout>
  )
}
