'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ImageUpload } from '@/components/ui/image-upload'
import Link from 'next/link'
import { ArrowRight, Upload, Link as LinkIcon, Sparkles } from 'lucide-react'

export function HeroSection() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('upload')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (activeTab === 'url' && url) {
        // Сохраняем URL в localStorage и перенаправляем
        localStorage.setItem('pendingAnalysis', JSON.stringify({ type: 'url', data: url }))
        window.location.href = '/dashboard'
      } else if (activeTab === 'upload' && file) {
        // Конвертируем файл в base64 и сохраняем в localStorage
        const reader = new FileReader()
        reader.onload = () => {
          const base64String = reader.result as string
          localStorage.setItem('pendingAnalysis', JSON.stringify({ type: 'screenshot', data: base64String }))
          window.location.href = '/dashboard'
        }
        reader.readAsDataURL(file)
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Поле загрузки сверху */}
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
                    <label className="block text-sm font-medium text-gray-700">
                      Загрузить скриншот
                    </label>
                    <ImageUpload
                      onImageSelect={handleFileChange}
                      maxSize={10 * 1024 * 1024} // 10MB
                      acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                      className="w-full"
                    />
                  </div>
                )}

                {/* Кнопки переключатели снизу слева и кнопка справа */}
                <div className="flex items-center justify-between">
                  {/* Кнопки переключатели слева */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        activeTab === 'upload' 
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' 
                          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('upload')}
                    >
                      <Upload className="w-4 h-4 inline mr-2" />
                      Скриншот
                    </button>
                    <button
                      type="button"
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                        activeTab === 'url' 
                          ? 'bg-blue-100 text-blue-600 border-2 border-blue-200' 
                          : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                      }`}
                      onClick={() => setActiveTab('url')}
                    >
                      <LinkIcon className="w-4 h-4 inline mr-2" />
                      URL сайта
                    </button>
                  </div>

                  {/* Кнопка справа */}
                  <Button
                    type="submit"
                    disabled={!isValid || isLoading}
                    size="lg"
                    className="text-lg font-bold bg-black hover:bg-gray-800"
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
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
