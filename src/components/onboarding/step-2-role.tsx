'use client'

import { Palette, Search, TrendingUp, User, Briefcase, GraduationCap, MoreHorizontal } from 'lucide-react'

interface Step2RoleProps {
  selectedRole: string
  onChange: (role: string) => void
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

export function Step2Role({ selectedRole, onChange }: Step2RoleProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          What best describes your current role?
        </h2>
        <p className="text-slate-600">
          Кто вы
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {roles.map((role) => {
          const Icon = role.icon
          return (
            <button
              key={role.id}
              onClick={() => onChange(role.id)}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedRole === role.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <Icon
                className={`w-8 h-8 mx-auto mb-3 ${
                  selectedRole === role.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  selectedRole === role.id ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                {role.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
