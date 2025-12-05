'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { supabase } from '@/lib/supabase'
import { MessageSquare, Send, Loader2 } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  user: {
    id: string
    full_name: string | null
    email: string
  }
  replies?: Comment[]
}

interface BlogCommentsProps {
  postId: string
}

export function BlogComments({ postId }: BlogCommentsProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
    loadComments()
  }, [postId])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  const loadComments = async () => {
    try {
      const { data, error } = await supabase
        .from('blog_comments')
        .select(`
          id,
          content,
          created_at,
          parent_id,
          user:profiles!blog_comments_user_id_fkey(id, full_name, email)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Организуем комментарии в дерево (родители + ответы)
      const commentsMap = new Map<string, Comment>()
      const rootComments: Comment[] = []

      data?.forEach((comment: any) => {
        const formattedComment: Comment = {
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user: comment.user,
          replies: []
        }
        commentsMap.set(comment.id, formattedComment)

        if (!comment.parent_id) {
          rootComments.push(formattedComment)
        }
      })

      // Добавляем ответы к родительским комментариям
      data?.forEach((comment: any) => {
        if (comment.parent_id) {
          const parent = commentsMap.get(comment.parent_id)
          const child = commentsMap.get(comment.id)
          if (parent && child) {
            parent.replies!.push(child)
          }
        }
      })

      setComments(rootComments)
    } catch (error) {
      console.error('Error loading comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: newComment.trim()
        })

      if (error) throw error

      setNewComment('')
      await loadComments()
    } catch (error) {
      console.error('Error submitting comment:', error)
      alert('Ошибка при отправке комментария')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || !user) return

    setSubmitting(true)
    try {
      const { error } = await supabase
        .from('blog_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: replyContent.trim(),
          parent_id: parentId
        })

      if (error) throw error

      setReplyContent('')
      setReplyTo(null)
      await loadComments()
    } catch (error) {
      console.error('Error submitting reply:', error)
      alert('Ошибка при отправке ответа')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email[0].toUpperCase()
  }

  const renderComment = (comment: Comment, isReply = false) => (
    <div key={comment.id} className={isReply ? 'ml-12' : ''}>
      <div className="flex gap-4 mb-4">
        <Avatar className="w-10 h-10 flex-shrink-0">
          <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
            {getInitials(comment.user.full_name, comment.user.email)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-900">
                {comment.user.full_name || comment.user.email}
              </h4>
              <span className="text-xs text-slate-500">
                {formatDate(comment.created_at)}
              </span>
            </div>
            <p className="text-slate-700 leading-relaxed">{comment.content}</p>
          </div>

          {!isReply && user && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-blue-600 hover:text-blue-700"
              onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
            >
              Ответить
            </Button>
          )}

          {/* Форма ответа */}
          {replyTo === comment.id && (
            <div className="mt-3 ml-4">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Напишите ответ..."
                className="mb-2"
                rows={3}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleSubmitReply(comment.id)}
                  disabled={submitting || !replyContent.trim()}
                >
                  {submitting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Отправить
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setReplyTo(null)
                    setReplyContent('')
                  }}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}

          {/* Рендерим ответы */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-4 space-y-4">
              {comment.replies.map(reply => renderComment(reply, true))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          Комментарии ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Форма нового комментария */}
        {user ? (
          <div className="mb-8">
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Поделитесь своим мнением..."
              className="mb-3"
              rows={4}
            />
            <Button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Отправить комментарий
            </Button>
          </div>
        ) : (
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
            <p className="text-slate-700 mb-3">
              Войдите, чтобы оставить комментарий
            </p>
            <Button onClick={() => window.location.href = '/projects'}>
              Войти
            </Button>
          </div>
        )}

        {/* Список комментариев */}
        {comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">
              Пока нет комментариев. Будьте первым!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
