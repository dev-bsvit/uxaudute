import { ReactNode } from 'react'
import { Zap, Sparkles } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title = 'UX Audit' }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Фоновые элементы */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-40 -left-32 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 right-32 w-80 h-80 bg-gradient-to-br from-indigo-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
      </div>

      <header className="relative bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-xl shadow-lg animate-bounce-subtle">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gradient">
                  {title}
                </h1>
                <p className="text-sm text-slate-600 font-medium">
                  ИИ анализ пользовательского опыта
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 px-4 py-2 bg-gradient-primary rounded-full text-white font-medium shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">AI Powered</span>
            </div>
          </div>
        </div>
      </header>
      
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="animate-fade-in">
          {children}
        </div>
      </main>

      {/* Футер */}
      <footer className="relative mt-20 bg-white/50 backdrop-blur-xl border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-sm text-slate-600">
              Создано с помощью <span className="text-gradient font-semibold">Cursor AI</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Профессиональный UX анализ для современных продуктов
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
