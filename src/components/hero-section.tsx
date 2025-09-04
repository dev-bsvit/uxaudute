'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Upload, Link as LinkIcon, Sparkles } from 'lucide-react'

export function HeroSection() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (activeTab === 'url' && url) {
        // Перенаправляем на дашборд с URL
        window.location.href = `/dashboard?url=${encodeURIComponent(url)}`
      } else if (activeTab === 'upload' && file) {
        // Конвертируем файл в base64 и перенаправляем
        const reader = new FileReader()
        reader.onload = () => {
          const base64String = reader.result as string
          window.location.href = `/dashboard?screenshot=${encodeURIComponent(base64String)}`
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const isValid = (activeTab === 'url' && url) || (activeTab === 'upload' && file)

  return (
    <div 
      className="relative w-full h-[120vh] flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #6A8DB8 0%, #BDD4E5 80.29%, #FFF 100%)'
      }}
    >
        <div className="w-full">
        <div className="text-center">
          {/* Центрированный заголовок */}
          <h1 className="text-6xl font-bold mb-8 leading-tight text-white">
            Intelligent Research shapes<br />
            the next digital products
          </h1>
          
          {/* Форма загрузки по центру */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              {/* Красивые табы */}
              <div className="flex mb-6 p-1 bg-gray-100 rounded-xl">
                <button
                  className={`flex-1 py-3 px-4 text-center rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'url' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('url')}
                >
                  <LinkIcon className="w-4 h-4 inline mr-2" />
                  URL сайта
                </button>
                <button
                  className={`flex-1 py-3 px-4 text-center rounded-lg font-medium transition-all duration-300 ${
                    activeTab === 'upload' 
                      ? 'bg-white shadow-sm text-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab('upload')}
                >
                  <Upload className="w-4 h-4 inline mr-2" />
                  Скриншот
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {activeTab === 'url' ? (
                  <div className="space-y-3">
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700">
                      Ссылка на страницу для анализа
                    </label>
                    <div className="relative">
                      <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://example.com"
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        required
                      />
                      <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                      Загрузить скриншот
                    </label>
                    <div className="relative">
                      <input
                        id="file"
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-blue-300"
                        required
                      />
                      <Upload className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                    {file && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-green-800 text-sm font-medium">
                          ✅ Выбран файл: {file.name}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={!isValid || isLoading}
                  size="lg"
                  className="w-full text-lg font-bold bg-black hover:bg-gray-800"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                      Анализируем...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-3" />
                      Get the test for free
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
