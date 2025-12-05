'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { BookOpen, TrendingUp, Lightbulb, ChevronRight } from 'lucide-react'

interface Category {
  id: string
  name: string
  slug: string
  posts_count?: number
}

interface SidebarProps {
  currentPostId?: string
}

const categoryIcons: Record<string, any> = {
  'ux-audit': BookOpen,
  'analytics': TrendingUp,
  'hypotheses': Lightbulb,
}

export function BlogSidebar({ currentPostId }: SidebarProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [popularPosts, setPopularPosts] = useState<any[]>([])

  useEffect(() => {
    loadCategories()
    loadPopularPosts()
  }, [])

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_categories')
        .select('*')
        .order('name')

      if (data) {
        setCategories(data)
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const loadPopularPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, title, slug, views_count')
        .eq('status', 'published')
        .neq('id', currentPostId || '')
        .order('views_count', { ascending: false })
        .limit(5)

      if (data) {
        setPopularPosts(data)
      }
    } catch (error) {
      console.error('Error loading popular posts:', error)
    }
  }

  return (
    <aside className="sticky top-24 space-y-8">
      {/* Категории */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-4">Разделы</h3>
        <nav className="space-y-1">
          {categories.map((category) => {
            const Icon = categoryIcons[category.slug] || BookOpen
            return (
              <button
                key={category.id}
                onClick={() => router.push(`/blog?category=${category.slug}`)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="flex-1 text-left">{category.name}</span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
              </button>
            )
          })}
          <button
            onClick={() => router.push('/blog')}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span className="flex-1 text-left">Все статьи</span>
            <ChevronRight className="w-3 h-3 text-gray-400" />
          </button>
        </nav>
      </div>

      {/* Популярные статьи */}
      {popularPosts.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Популярное</h3>
          <div className="space-y-3">
            {popularPosts.map((post) => (
              <button
                key={post.id}
                onClick={() => router.push(`/blog/${post.slug}`)}
                className="block w-full text-left group"
              >
                <p className="text-sm text-gray-700 group-hover:text-gray-900 line-clamp-2 transition-colors">
                  {post.title}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {post.views_count || 0} просмотров
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CTA блок */}
      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">
          Улучшите свой продукт
        </h3>
        <p className="text-xs text-gray-600 mb-4">
          Получите детальный UX-аудит с конкретными рекомендациями
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Начать анализ
        </button>
      </div>
    </aside>
  )
}
