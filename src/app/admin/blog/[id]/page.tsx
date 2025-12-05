'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { SidebarDemo } from '@/components/sidebar-demo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'
import { PageHeader } from '@/components/page-header'
import { ArrowLeft, Save, Eye, Archive, CheckCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

// Динамический импорт Novel editor (только на клиенте)
const Editor = dynamic(() => import('@/components/novel-editor'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-slate-100 h-96 rounded-lg"></div>
})

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  meta_title: string
  meta_description: string
  keywords: string[]
  featured_image_url: string | null
  status: 'draft' | 'published' | 'archived'
  language: string
  created_at: string
  updated_at: string
  audit_id: string
  user_id: string
  category_id: string
}

export default function BlogEditPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Form state
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordsInput, setKeywordsInput] = useState('')

  useEffect(() => {
    checkAuthAndLoadPost()
  }, [postId])

  const checkAuthAndLoadPost = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/projects')
        return
      }

      setUser(user)
      await loadPost()
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPost = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (error) throw error

      setPost(data)
      setTitle(data.title)
      setSlug(data.slug)
      setExcerpt(data.excerpt)
      setContent(data.content)
      setMetaTitle(data.meta_title)
      setMetaDescription(data.meta_description)
      setKeywords(data.keywords || [])
      setKeywordsInput((data.keywords || []).join(', '))
    } catch (error) {
      console.error('Error loading post:', error)
      alert('Ошибка загрузки статьи')
      router.push('/admin/blog-queue')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/blog/update-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId,
          title,
          slug,
          excerpt,
          content,
          metaTitle,
          metaDescription,
          keywords: keywordsInput.split(',').map(k => k.trim()).filter(k => k)
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Статья успешно сохранена!')
        await loadPost()
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error saving post:', error)
      alert('❌ Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!confirm('Опубликовать статью? Она станет доступна всем.')) return

    setSaving(true)
    try {
      const response = await fetch('/api/blog/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, status: 'published' })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Статья опубликована!')
        await loadPost()
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error publishing post:', error)
      alert('❌ Ошибка при публикации')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!confirm('Архивировать статью? Она будет скрыта из публичного блога.')) return

    setSaving(true)
    try {
      const response = await fetch('/api/blog/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, status: 'archived' })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Статья архивирована!')
        await loadPost()
      } else {
        alert(`❌ Ошибка: ${data.error}`)
      }
    } catch (error) {
      console.error('Error archiving post:', error)
      alert('❌ Ошибка при архивации')
    } finally {
      setSaving(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">Опубликована</Badge>
      case 'archived':
        return <Badge className="bg-gray-100 text-gray-800">Архивирована</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Черновик</Badge>
    }
  }

  if (loading) {
    return (
      <SidebarDemo user={null}>
        <div className="space-y-6">
          <div className="px-8">
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-5 w-96 bg-gray-100 rounded animate-pulse"></div>
          </div>
        </div>
      </SidebarDemo>
    )
  }

  return (
    <SidebarDemo user={user}>
      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="px-8 space-y-4">
          <PageHeader
            breadcrumbs={[
              { label: 'Админ-панель', href: '/admin' },
              { label: 'Очередь блога', href: '/admin/blog-queue' },
              { label: 'Редактирование' }
            ]}
            title={post?.title || 'Загрузка...'}
            subtitle={post ? `Статус: ${post.status}` : ''}
            showBackButton={true}
            onBack={() => router.push('/admin/blog-queue')}
          />

          {/* Action Bar */}
          <div className="flex items-center justify-between">
            <div>
              {post && getStatusBadge(post.status)}
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`/blog/${post?.slug}`, '_blank')}
                disabled={!post}
              >
                <Eye className="w-4 h-4 mr-2" />
                Предпросмотр
              </Button>

              {post?.status !== 'published' && (
                <Button
                  size="sm"
                  onClick={handlePublish}
                  disabled={saving}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Опубликовать
                </Button>
              )}

              {post?.status === 'published' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleArchive}
                  disabled={saving}
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Архивировать
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>
          </div>
        </div>

        <div className="px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content - 2/3 width */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Заголовок</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Заголовок статьи"
                      className="text-lg"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Content Editor */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <Label>Содержание</Label>
                    <Editor
                      initialContent={content}
                      onChange={setContent}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - 1/3 width */}
            <div className="space-y-6">
              {/* SEO Settings */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold text-slate-900">SEO настройки</h3>

                  <div className="space-y-2">
                    <Label htmlFor="slug">URL (slug)</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Краткое описание</Label>
                    <textarea
                      id="excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="150-200 символов"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaTitle">Meta Title</Label>
                    <Input
                      id="metaTitle"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      placeholder="55-60 символов"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="metaDescription">Meta Description</Label>
                    <textarea
                      id="metaDescription"
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      placeholder="150-160 символов"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Ключевые слова</Label>
                    <Input
                      id="keywords"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="ключевое1, ключевое2, ключевое3"
                    />
                    <p className="text-xs text-slate-500">Через запятую</p>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Image */}
              {post?.featured_image_url && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-slate-900 mb-3">Обложка</h3>
                    <img
                      src={post.featured_image_url}
                      alt={title}
                      className="w-full rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </SidebarDemo>
  )
}
