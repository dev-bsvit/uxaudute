'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface LayoutProps {
  children: ReactNode
  title?: string
}

export function Layout({ children, title = 'UX Audit' }: LayoutProps) {
  const pathname = usePathname()
  
  const navigation = [
    { name: 'Главная', href: '/', current: pathname === '/' },
    { name: 'Dashboard', href: '/dashboard', current: pathname === '/dashboard' },
    { name: 'Проекты', href: '/projects', current: pathname.startsWith('/projects') },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
                🎯 UX Audit
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            
            <div className="text-sm text-gray-600">
              {title !== 'UX Audit' && title}
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
