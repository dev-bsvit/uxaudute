'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Link as LinkIcon, Tag } from 'lucide-react'

interface Step3ThankYouProps {
  thankYouText?: string
  thankYouLink?: string
  thankYouPromoCode?: string
  onUpdate: (data: {
    thank_you_text?: string
    thank_you_link?: string
    thank_you_promo_code?: string
  }) => void
  onBack: () => void
  onComplete: () => void
}

export function Step3ThankYou({
  thankYouText,
  thankYouLink,
  thankYouPromoCode,
  onUpdate,
  onBack,
  onComplete
}: Step3ThankYouProps) {
  const [text, setText] = useState(
    thankYouText || 'Спасибо за ваше время и ценные ответы! Ваше мнение поможет нам стать лучше.'
  )
  const [link, setLink] = useState(thankYouLink || '')
  const [promoCode, setPromoCode] = useState(thankYouPromoCode || '')

  const handleComplete = () => {
    if (!text.trim()) {
      alert('Пожалуйста, введите текст благодарности')
      return
    }
    onUpdate({ thank_you_text: text, thank_you_link: link, thank_you_promo_code: promoCode })
    onComplete()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Экран благодарности
        </h2>
        <p className="text-slate-600">
          Завершите опрос правильно. Поблагодарите пользователей и оставьте важную информацию.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Thank You Text */}
        <div>
          <Label htmlFor="thank-you-text" className="text-base font-medium mb-2 block">
            Текст благодарности *
          </Label>
          <Textarea
            id="thank-you-text"
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onUpdate({ thank_you_text: e.target.value, thank_you_link: link, thank_you_promo_code: promoCode })
            }}
            placeholder="Спасибо за участие в опросе!"
            rows={4}
          />
          <p className="text-sm text-slate-500 mt-2">
            Это последнее, что увидят пользователи после завершения опроса
          </p>
        </div>

        {/* Optional Link */}
        <div>
          <Label htmlFor="thank-you-link" className="text-base font-medium mb-2 block">
            Ссылка (опционально)
          </Label>
          <div className="relative">
            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="thank-you-link"
              type="url"
              value={link}
              onChange={(e) => {
                setLink(e.target.value)
                onUpdate({ thank_you_text: text, thank_you_link: e.target.value, thank_you_promo_code: promoCode })
              }}
              placeholder="https://example.com"
              className="pl-10"
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Например, ссылка на ваш сайт, соцсети или специальное предложение
          </p>
        </div>

        {/* Optional Promo Code */}
        <div>
          <Label htmlFor="thank-you-promo" className="text-base font-medium mb-2 block">
            Промокод (опционально)
          </Label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="thank-you-promo"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value)
                onUpdate({ thank_you_text: text, thank_you_link: link, thank_you_promo_code: e.target.value })
              }}
              placeholder="SURVEY2025"
              className="pl-10"
            />
          </div>
          <p className="text-sm text-slate-500 mt-2">
            Поощрите участников промокодом или специальным предложением
          </p>
        </div>
      </Card>

      {/* Preview */}
      <Card className="p-8">
        <div className="text-center space-y-6">
          <p className="text-sm text-slate-500 mb-6">Предпросмотр:</p>

          {/* Success Icon */}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* Text */}
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-900">
              Опрос завершен!
            </h3>
            <p className="text-slate-600 max-w-2xl mx-auto whitespace-pre-wrap">
              {text}
            </p>
          </div>

          {/* Promo Code */}
          {promoCode && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-slate-600 mb-2">Ваш промокод:</p>
              <div className="flex items-center justify-center gap-2">
                <code className="text-2xl font-bold text-blue-600 tracking-wider">
                  {promoCode}
                </code>
                <Button variant="ghost" size="sm" disabled>
                  Копировать
                </Button>
              </div>
            </div>
          )}

          {/* Link */}
          {link && (
            <Button className="mt-4" disabled>
              Перейти на сайт
            </Button>
          )}
        </div>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline" size="lg">
          Назад: Вопросы
        </Button>
        <Button
          onClick={handleComplete}
          size="lg"
          disabled={!text.trim()}
        >
          Сохранить и завершить
        </Button>
      </div>
    </div>
  )
}
