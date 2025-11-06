'use client'

import { Label } from '@/components/ui/label'

interface Step3SourceProps {
  selectedSource: string
  onChange: (source: string) => void
}

const sources = [
  { id: 'linkedin', label: 'Linkedin' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'google', label: 'Google' },
  { id: 'chatgpt', label: 'ChatGPT' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'other', label: 'Другое' },
]

export function Step3Source({ selectedSource, onChange }: Step3SourceProps) {
  return (
    <div className="space-y-4">
      {/* Заголовок: Inter Display Medium 28, lh 1.1, tracking −0.28, #1f1f1f */}
      <h2
        className="text-[28px] font-medium leading-[1.1] tracking-[-0.28px] text-[#1f1f1f]"
        style={{ fontFamily: 'Inter Display, sans-serif' }}
      >
        Откуда вы о нас узнали?
      </h2>

      {/* Подзаголовок: Inter Regular 16, lh ≈1.07, #a9a9bc, width 334px */}
      <p
        className="text-base leading-[1.07] text-[#a9a9bc] max-w-[334px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Это поможет нам стать лучше
      </p>

      {/* Отступ 16px между подзаголовком и первым полем */}
      <div className="pt-4 space-y-2">
        {/* Лейбл: Inter Medium 14, #121217 */}
        <Label
          className="text-sm font-medium text-[#121217]"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Что лучше всего описывает вашу текущую роль?
        </Label>

        {/* Контейнер чипсов: flex-wrap, gap 8px */}
        <div className="flex flex-wrap gap-2">
          {sources.map((source) => {
            const isSelected = selectedSource === source.id
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => onChange(source.id)}
                className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#0058fc] text-white'
                    : 'bg-[#f7f7f8] text-[#121217] hover:bg-[#e8e8f0]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {source.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
