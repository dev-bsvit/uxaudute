'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ACTIONS, type ActionType } from "@/lib/utils"
import { 
  Search, 
  FileText, 
  BarChart3, 
  FlaskConical, 
  Lightbulb,
  Sparkles 
} from "lucide-react"

interface ActionPanelProps {
  onAction: (action: ActionType) => void
  className?: string
}

const actionIcons: Record<string, any> = {
  'research': Search,
  'collect': FileText,
  'analytics': BarChart3,
  'ab-test': FlaskConical,
  'hypotheses': Lightbulb
}

const actionGradients: Record<string, { gradient: string; hoverGradient: string }> = {
  'research': { gradient: 'from-blue-500 to-blue-600', hoverGradient: 'from-blue-600 to-blue-700' },
  'collect': { gradient: 'from-green-500 to-emerald-600', hoverGradient: 'from-green-600 to-emerald-700' },
  'analytics': { gradient: 'from-purple-500 to-purple-600', hoverGradient: 'from-purple-600 to-purple-700' },
  'ab-test': { gradient: 'from-orange-500 to-red-500', hoverGradient: 'from-orange-600 to-red-600' },
  'hypotheses': { gradient: 'from-yellow-500 to-amber-500', hoverGradient: 'from-yellow-600 to-amber-600' }
}

export function ActionPanel({ onAction, className }: ActionPanelProps) {
  return (
    <div className={`w-full max-w-6xl mx-auto p-6 animate-fade-in ${className}`}>
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-3">
          <Sparkles className="w-6 h-6 text-blue-500 mr-2" />
          <h3 className="text-2xl font-bold text-gradient">
            Экспертные действия
          </h3>
          <Sparkles className="w-6 h-6 text-purple-500 ml-2" />
        </div>
        <p className="text-slate-600">
          Выберите тип анализа для получения профессиональных инсайтов
        </p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {ACTIONS.map((action, index) => {
          const Icon = actionIcons[action.id] || Search
          const colors = actionGradients[action.id] || actionGradients['research']
          
          return (
            <Card 
              key={action.id} 
              className="group relative overflow-hidden hover:scale-105 transition-all duration-300 cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-90 group-hover:opacity-100 transition-opacity duration-300`} />
              
              <div className="relative p-4 h-32 flex flex-col items-center justify-center text-white">
                <div className="mb-3 p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Icon className="w-6 h-6" />
                </div>
                
                <span className="text-sm font-semibold text-center leading-tight">
                  {action.label}
                </span>
              </div>

              <Button
                onClick={() => onAction(action.id)}
                className="absolute inset-0 w-full h-full bg-transparent hover:bg-transparent border-none shadow-none"
                aria-label={action.label}
              />
              
              {/* Эффект свечения при наведении */}
              <div className={`absolute inset-0 bg-gradient-to-br ${colors.hoverGradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
            </Card>
          )
        })}
      </div>

      {/* Дополнительная информация */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-white/20 shadow-soft">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
          <span className="text-xs font-medium text-slate-700">
            Анализы выполняются с помощью GPT-4 ИИ
          </span>
        </div>
      </div>
    </div>
  )
}
