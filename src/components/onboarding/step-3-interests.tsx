'use client'

import { Check } from 'lucide-react'

interface Step3InterestsProps {
  selectedInterests: string[]
  onChange: (interests: string[]) => void
}

const interests = [
  { id: 'ux_analysis', label: 'UX анализ' },
  { id: 'ab_test', label: 'A/B тест' },
  { id: 'hypotheses', label: 'Гипотезы' },
  { id: 'business_analytics', label: 'Бизнес-аналитика' },
  { id: 'surveys', label: 'Опросы' },
  { id: 'card_sorting', label: 'Карточная сортировка' },
  { id: 'comparative_analysis', label: 'Сравнительный анализ' },
  { id: 'other', label: 'Другое' },
]

export function Step3Interests({ selectedInterests, onChange }: Step3InterestsProps) {
  const toggleInterest = (interestId: string) => {
    if (selectedInterests.includes(interestId)) {
      onChange(selectedInterests.filter(id => id !== interestId))
    } else {
      onChange([...selectedInterests, interestId])
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Что вас больше всего интересует?
        </h2>
        <p className="text-slate-600">
          Выберите все подходящие варианты
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {interests.map((interest) => {
          const isSelected = selectedInterests.includes(interest.id)
          return (
            <button
              key={interest.id}
              onClick={() => toggleInterest(interest.id)}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md relative ${
                isSelected
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
              <p
                className={`text-sm font-medium ${
                  isSelected ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                {interest.label}
              </p>
            </button>
          )
        })}
      </div>

      {selectedInterests.length > 0 && (
        <p className="text-center text-sm text-slate-500 mt-4">
          Выбрано: {selectedInterests.length}
        </p>
      )}
    </div>
  )
}
