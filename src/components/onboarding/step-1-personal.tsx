'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Step1PersonalProps {
  firstName: string
  lastName: string
  onChange: (updates: { firstName?: string; lastName?: string }) => void
}

export function Step1Personal({ firstName, lastName, onChange }: Step1PersonalProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Let's get to know you
        </h2>
        <p className="text-slate-600">
          Tell us a bit about yourself
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-6">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-base font-medium text-slate-700">
            Имя
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Введите ваше имя"
            value={firstName}
            onChange={(e) => onChange({ firstName: e.target.value })}
            className="h-12 text-base"
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-base font-medium text-slate-700">
            Фамилия
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Введите вашу фамилию"
            value={lastName}
            onChange={(e) => onChange({ lastName: e.target.value })}
            className="h-12 text-base"
          />
        </div>
      </div>
    </div>
  )
}
