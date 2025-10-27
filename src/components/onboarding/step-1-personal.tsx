'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Palette, Search, TrendingUp, User, Briefcase, GraduationCap, MoreHorizontal } from 'lucide-react'

interface Step1PersonalProps {
  firstName: string
  role: string
  onChange: (updates: { firstName?: string; role?: string }) => void
}

const roles = [
  { id: 'designer', label: 'Designer', icon: Palette },
  { id: 'researcher', label: 'Researcher', icon: Search },
  { id: 'marketer', label: 'Marketer', icon: TrendingUp },
  { id: 'product_manager', label: 'Product manager', icon: Briefcase },
  { id: 'founder_ceo', label: 'Founder / CEO', icon: User },
  { id: 'student', label: 'Student', icon: GraduationCap },
  { id: 'other', label: 'Other', icon: MoreHorizontal },
]

export function Step1Personal({ firstName, role, onChange }: Step1PersonalProps) {
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

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Имя */}
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-base font-medium text-slate-700">
            Как к вам обращаться?
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

        {/* Роль */}
        <div className="space-y-4">
          <Label className="text-base font-medium text-slate-700">
            Кто вы? (What best describes your current role?)
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {roles.map((roleOption) => {
              const Icon = roleOption.icon
              return (
                <button
                  key={roleOption.id}
                  onClick={() => onChange({ role: roleOption.id })}
                  className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                    role === roleOption.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <Icon
                    className={`w-8 h-8 mx-auto mb-3 ${
                      role === roleOption.id ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                  <p
                    className={`text-sm font-medium ${
                      role === roleOption.id ? 'text-blue-900' : 'text-gray-700'
                    }`}
                  >
                    {roleOption.label}
                  </p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
