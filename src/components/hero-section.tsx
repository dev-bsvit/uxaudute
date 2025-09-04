'use client'

import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <div 
      className="relative w-full h-[120vh] flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #6A8DB8 0%, #BDD4E5 80.29%, #FFF 100%)'
      }}
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="text-center">
          {/* Центрированный заголовок */}
          <h1 className="text-6xl font-bold mb-8 leading-tight text-white">
            Intelligent Research shapes<br />
            the next digital products
          </h1>
          
          {/* Форма загрузки по центру */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <div className="mb-6">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
                  <div className="text-gray-500 text-lg mb-2">Загрузите изображения</div>
                  <div className="text-sm text-gray-400">Перетащите файлы сюда или нажмите для выбора</div>
                </div>
              </div>
              
              <div className="flex gap-4 mb-6">
                <button className="flex-1 py-3 px-4 bg-blue-50 text-blue-600 rounded-lg font-medium border-2 border-blue-200">
                  Скриншот
                </button>
                <button className="flex-1 py-3 px-4 text-gray-500 rounded-lg font-medium border border-gray-200 hover:bg-gray-50">
                  URL сайта
                </button>
              </div>
              
              <div className="flex justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="px-8 py-4 text-lg bg-black hover:bg-gray-800">
                    Get the test for free
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
