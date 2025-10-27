'use client'

import { Linkedin, Send, Search, MessageCircle, Youtube, Instagram, MoreHorizontal } from 'lucide-react'

interface Step3SourceProps {
  selectedSource: string
  onChange: (source: string) => void
}

const sources = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'telegram', label: 'Telegram', icon: Send },
  { id: 'google', label: 'Google', icon: Search },
  { id: 'chatgpt', label: 'ChatGPT', icon: MessageCircle },
  { id: 'youtube', label: 'YouTube', icon: Youtube },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'other', label: 'Другое', icon: MoreHorizontal },
]

export function Step3Source({ selectedSource, onChange }: Step3SourceProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Откуда вы о нас узнали?
        </h2>
        <p className="text-slate-600">
          Это поможет нам стать лучше
        </p>
      </div>

      <div className="max-w-3xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-4">
        {sources.map((source) => {
          const Icon = source.icon
          return (
            <button
              key={source.id}
              onClick={() => onChange(source.id)}
              className={`p-6 rounded-lg border-2 transition-all hover:shadow-md ${
                selectedSource === source.id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <Icon
                className={`w-8 h-8 mx-auto mb-3 ${
                  selectedSource === source.id ? 'text-blue-600' : 'text-gray-400'
                }`}
              />
              <p
                className={`text-sm font-medium ${
                  selectedSource === source.id ? 'text-blue-900' : 'text-gray-700'
                }`}
              >
                {source.label}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
