'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Link as LinkIcon, Sparkles, Zap } from "lucide-react"

interface UploadFormProps {
  onSubmit: (data: { url?: string; screenshot?: string }) => void
  isLoading?: boolean
}

export function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'url' && url) {
      onSubmit({ url })
    } else if (activeTab === 'upload' && file) {
      // Конвертируем файл в base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        onSubmit({ screenshot: base64String })
      }
      reader.readAsDataURL(file)
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
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <Card className="overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient mb-2">
            Начать исследование
          </CardTitle>
          <p className="text-slate-600 text-lg">
            Загрузите URL или скриншот для профессионального UX анализа
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Красивые табы */}
          <div className="flex mb-8 p-1 bg-slate-100 rounded-2xl">
            <button
              className={`flex-1 py-4 px-6 text-center rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'url' 
                  ? 'bg-white shadow-soft text-blue-600 transform scale-105' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('url')}
            >
              <LinkIcon className="w-5 h-5 inline mr-3" />
              URL сайта
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'upload' 
                  ? 'bg-white shadow-soft text-blue-600 transform scale-105' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="w-5 h-5 inline mr-3" />
              Скриншот
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'url' ? (
              <div className="space-y-3">
                <label htmlFor="url" className="block text-lg font-semibold text-slate-800">
                  Ссылка на страницу для анализа
                </label>
                <div className="relative">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                  />
                  <LinkIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  Введите полную ссылку на страницу, которую хотите проанализировать
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <label htmlFor="file" className="block text-lg font-semibold text-slate-800">
                  Загрузить скриншот
                </label>
                <div className="relative">
                  <input
                    id="file"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="w-full px-6 py-4 text-lg border-2 border-dashed border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm hover:border-blue-300"
                    required
                  />
                  <Upload className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                {file && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-medium">
                      ✅ Выбран файл: {file.name}
                    </p>
                  </div>
                )}
                <p className="text-sm text-slate-500">
                  Поддерживаются форматы: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}

            <Button
              type="submit"
              disabled={!isValid || isLoading}
              size="lg"
              className="w-full text-lg font-bold"
              variant={isLoading ? "secondary" : "gradient"}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                  Анализируем с помощью ИИ...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  Начать анализ
                </>
              )}
            </Button>
          </form>

          {/* Дополнительная информация */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <h4 className="font-semibold text-slate-800 mb-3">Что вы получите:</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✨</span>
                Подробный UX анализ с экспертными рекомендациями
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">📊</span>
                Бизнес-аналитика и влияние на конверсию
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">🧪</span>
                Готовые планы A/B тестов для улучшений
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">💡</span>
                Продуктовые гипотезы для развития
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
