'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check, ExternalLink, Share2, QrCode } from 'lucide-react'
import { Survey } from '@/types/survey'

interface ShareTabProps {
  survey: Survey
  currentLanguage: 'ru' | 'en'
}

export function ShareTab({ survey, currentLanguage }: ShareTabProps) {
  const [copied, setCopied] = useState(false)
  const publicUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/public/survey/${survey.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleOpenInNewTab = () => {
    window.open(publicUrl, '_blank')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Status Info */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Статус опроса
            </h3>
            <div className="flex items-center gap-2">
              <div
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  survey.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-800'
                    : survey.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {survey.status === 'draft'
                  ? 'Черновик'
                  : survey.status === 'published'
                  ? 'Опубликован'
                  : 'Закрыт'}
              </div>
            </div>
          </div>
          {survey.status === 'draft' && (
            <div className="text-sm text-slate-600">
              Опубликуйте опрос во вкладке "Create", чтобы начать собирать ответы
            </div>
          )}
        </div>
      </Card>

      {/* Public Link */}
      {survey.status === 'published' && (
        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Публичная ссылка
              </h3>
              <p className="text-sm text-slate-600 mb-4">
                Поделитесь этой ссылкой с пользователями для прохождения опроса
              </p>
            </div>

            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button onClick={handleCopyLink} variant="outline">
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Скопировано
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Копировать
                  </>
                )}
              </Button>
              <Button onClick={handleOpenInNewTab} variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Открыть
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Stats */}
      {survey.status === 'published' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Статистика
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-slate-600 mb-1">Всего ответов</p>
              <p className="text-3xl font-bold text-slate-900">
                {survey.responses_count || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Вопросов в опросе</p>
              <p className="text-3xl font-bold text-slate-900">
                {survey.main_questions?.length || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">Среднее время</p>
              <p className="text-3xl font-bold text-slate-900">
                {survey.avg_completion_time
                  ? `${Math.round(survey.avg_completion_time / 60)} мин`
                  : '—'}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Sharing Options */}
      {survey.status === 'published' && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Способы распространения
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* QR Code */}
            <Card className="p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">QR-код</h4>
                  <p className="text-xs text-slate-600">
                    Для печатных материалов
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Скоро
              </Button>
            </Card>

            {/* Email */}
            <Card className="p-4 bg-slate-50">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h4 className="font-medium text-slate-900">Email рассылка</h4>
                  <p className="text-xs text-slate-600">
                    Отправка приглашений
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full" disabled>
                Скоро
              </Button>
            </Card>
          </div>
        </Card>
      )}

      {/* Draft Notice */}
      {survey.status === 'draft' && (
        <Card className="p-8 text-center bg-slate-50">
          <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-slate-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Опрос еще не опубликован
          </h3>
          <p className="text-slate-600 max-w-md mx-auto">
            Завершите настройку опроса во вкладке "Create" и опубликуйте его, чтобы получить
            доступ к ссылке и другим способам распространения.
          </p>
        </Card>
      )}
    </div>
  )
}
