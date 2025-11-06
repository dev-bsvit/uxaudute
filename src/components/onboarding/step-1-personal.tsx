'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step1PersonalProps {
  firstName: string
  role: string
  onChange: (updates: { firstName?: string; role?: string }) => void
}

const roles = [
  { id: 'designer', label: 'Designer' },
  { id: 'researcher', label: 'Researcher' },
  { id: 'marketer', label: 'Marketer' },
  { id: 'product_manager', label: 'Product manager' },
  { id: 'founder_ceo', label: 'Founder / CEO' },
  { id: 'student', label: 'Student' },
  { id: 'other', label: 'Other' },
]

export function Step1Personal({ firstName, role, onChange }: Step1PersonalProps) {
  return (
    <div className="space-y-4">
      {/* Заголовок: Inter Display Medium 28, lh 1.1, tracking −0.28, #1f1f1f */}
      <h2
        className="text-[28px] font-medium leading-[1.1] tracking-[-0.28px] text-[#1f1f1f]"
        style={{ fontFamily: 'Inter Display, sans-serif' }}
      >
        Давайте познакомимся с вами
      </h2>

      {/* Подзаголовок: Inter Regular 16, lh ≈1.07, #a9a9bc, width 334px */}
      <p
        className="text-base leading-[1.07] text-[#a9a9bc] max-w-[334px]"
        style={{ fontFamily: 'Inter, sans-serif' }}
      >
        Расскажите немного о себе.
      </p>

      {/* Отступ 16px между подзаголовком и первым полем */}
      <div className="pt-4 space-y-4">
        {/* Поле "Как вас зовут" */}
        <div className="space-y-2">
          {/* Лейбл: Inter Medium 14, #121217 */}
          <Label
            htmlFor="firstName"
            className="text-sm font-medium text-[#121217]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Как вас зовут
          </Label>

          {/* Инпут: height авто (min ~48px), bg #ffffff, border 1px solid #d1d1db, radius 8px, padding 8px */}
          <Input
            id="firstName"
            type="text"
            placeholder="Имя"
            value={firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-auto min-h-[48px] bg-white border border-[#d1d1db] rounded-lg px-2 py-2 text-sm text-[#121217] placeholder:text-[#6c6c89] focus:border-[#0058fc] focus:outline-none focus:ring-2 focus:ring-[#0058fc]/12"
            style={{ fontFamily: 'Inter, sans-serif' }}
            autoFocus
          />
        </div>

        {/* Блок "Что лучше всего описывает вашу текущую роль?" */}
        <div className="space-y-2">
          {/* Лейбл: Inter Medium 14, #121217 */}
          <Label
            className="text-sm font-medium text-[#121217]"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Что лучше всего описывает вашу текущую роль?
          </Label>

          {/* Контейнер чипсов: flex-wrap, gap 8px */}
          <div className="flex flex-wrap gap-2">
            {roles.map((roleOption) => {
              const isSelected = role === roleOption.id
              return (
                <button
                  key={roleOption.id}
                  type="button"
                  onClick={() => onChange({ role: roleOption.id })}
                  className={`px-2 py-1 rounded-lg text-sm font-medium transition-all ${
                    isSelected
                      ? 'bg-[#0058fc] text-white'
                      : 'bg-[#f7f7f8] text-[#121217] hover:bg-[#e8e8f0]'
                  }`}
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  {roleOption.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
