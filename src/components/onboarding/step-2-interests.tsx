'use client'

import { Label } from '@/components/ui/label'

interface Step2InterestsProps {
  selectedInterests: string[]
  onChange: (interests: string[]) => void
}

const interests = [
  { id: 'ux_analysis', label: 'UX анализ' },
  { id: 'ab_test', label: 'А/В тест' },
  { id: 'hypotheses', label: 'Гипотезы' },
  { id: 'business_analytics', label: 'Бизнес-аналитика' },
  { id: 'surveys', label: 'Опросы' },
  { id: 'card_sorting', label: 'Карточная сортировка' },
  { id: 'comparative_analysis', label: 'Сравнительный анали' },
  { id: 'other', label: 'Другое' },
]

export function Step2Interests({ selectedInterests, onChange }: Step2InterestsProps) {
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onChange(selectedInterests.filter(id => id !== interestId))
    } else {
      onChange([...selectedInterests, interestId])
    }
  }

  return (
    <div className="space-y-4">
      {/* Заголовок: Inter Display Medium 28, lh 1.1, tracking −0.28, #1f1f1f */}
      <h2
        className="text-[28px] font-medium leading-[1.1] tracking-[-0.28px] text-[#1f1f1f]"
        style={{ fontFamily: 'Inter Display, sans-serif' }}
      >
        Что вас больше всего интересует?
      </h2>

      {/* Подзаголовок: Inter Regular 16, lh ≈1.07, #a9a9bc, width 334px */}
      <p
        className="text-base leading-[1.07] text-[#a9a9bc] max-w-[334px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Выберите все подходящие варианты
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
          {interests.map((interest) => {
            const isSelected = selectedInterests.includes(interest.id)
            return (
              <button
                key={interest.id}
                type="button"
                onClick={() => toggleInterest(interest.id)}
                className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#0058fc] text-white'
                    : 'bg-[#f7f7f8] text-[#121217] hover:bg-[#e8e8f0]'
                }`}
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                {interest.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
