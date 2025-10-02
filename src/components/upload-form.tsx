'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ImageUpload } from "@/components/ui/image-upload"
import { Upload, Link as LinkIcon, Sparkles, Zap } from "lucide-react"
import { useTranslation } from '@/hooks/use-translation'

interface UploadFormProps {
  onSubmit: (data: { url?: string; screenshot?: string; context?: string; provider?: string; openrouterModel?: string }) => void
  isLoading?: boolean
}

export function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [context, setContext] = useState('')
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('upload')
  const [provider, setProvider] = useState<'openai' | 'openrouter'>('openai')
  const [openrouterModel, setOpenrouterModel] = useState<'sonoma'>('sonoma')
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('🔍 UploadForm handleSubmit вызвана')
    console.log('🔍 activeTab:', activeTab)
    console.log('🔍 url:', url)
    console.log('🔍 file:', file?.name)
    console.log('🔍 context:', context?.substring(0, 100) + '...')
    
    const providerData = { provider, openrouterModel }
    
    if (activeTab === 'url' && url) {
      console.log('✅ Отправляем URL анализ')
      onSubmit({ url, context, ...providerData })
    } else if (activeTab === 'upload' && file) {
      console.log('✅ Отправляем файл анализ')
      // Конвертируем файл в base64
      const reader = new FileReader()
      reader.onload = () => {
        const base64String = reader.result as string
        console.log('✅ Файл конвертирован в base64, отправляем')
        onSubmit({ screenshot: base64String, context, ...providerData })
      }
      reader.readAsDataURL(file)
    } else {
      console.log('❌ Нет данных для отправки')
    }
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
  }

  const isValid = (activeTab === 'url' && url) || (activeTab === 'upload' && file)

  return (
    <div className="w-full max-w-3xl mx-auto animate-slide-up">
      <Card className="overflow-hidden">
        <CardHeader className="text-center bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gradient mb-2">
            {t('analysis.uploadForm.title')}
          </CardTitle>
          <p className="text-slate-600 text-lg">
            {t('analysis.uploadForm.description')}
          </p>
        </CardHeader>
        
        <CardContent className="p-8">
          {/* Красивые табы */}
          <div className="flex mb-8 p-1 bg-slate-100 rounded-2xl">
            <button
              className={`flex-1 py-4 px-6 text-center rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'upload'
                  ? 'bg-white shadow-soft text-blue-600 transform scale-105'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('upload')}
            >
              <Upload className="w-5 h-5 inline mr-3" />
              {t('analysis.uploadForm.tabs.upload')}
            </button>
            <button
              className={`flex-1 py-4 px-6 text-center rounded-xl font-semibold transition-all duration-300 ${
                activeTab === 'url'
                  ? 'bg-white shadow-soft text-blue-600 transform scale-105'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
              onClick={() => setActiveTab('url')}
            >
              <LinkIcon className="w-5 h-5 inline mr-3" />
              {t('analysis.uploadForm.tabs.url')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {activeTab === 'url' ? (
              <div className="space-y-3">
                <label htmlFor="url" className="block text-lg font-semibold text-slate-800">
                  {t('analysis.uploadForm.urlLabel')}
                </label>
                <div className="relative">
                  <input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t('analysis.uploadForm.urlPlaceholder')}
                    className="w-full px-6 py-4 text-lg border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white/80 backdrop-blur-sm"
                    required
                  />
                  <LinkIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                </div>
                <p className="text-sm text-slate-500">
                  {t('analysis.uploadForm.urlHelp')}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <ImageUpload
                  onImageSelect={handleFileChange}
                  maxSize={10 * 1024 * 1024} // 10MB
                  acceptedTypes={['image/jpeg', 'image/png', 'image/gif', 'image/webp']}
                  className="w-full"
                />
              </div>
            )}

            {/* Поле контекста */}
            <div className="space-y-2">
              <Label htmlFor="context">
                {t('analysis.uploadForm.contextLabel')}
              </Label>
              <Textarea
                id="context"
                placeholder={t('analysis.uploadForm.contextPlaceholder')}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={3}
                className="resize-none"
              />
              <p className="text-sm text-slate-500">
                {t('analysis.uploadForm.contextHelp')}
              </p>
            </div>

            {/* Выбор AI провайдера - скрыт, используется OpenAI по умолчанию */}

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
                  {t('analysis.uploadForm.submitting')}
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-3" />
                  {t('analysis.uploadForm.submit')}
                </>
              )}
            </Button>
          </form>

          {/* Дополнительная информация */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <h4 className="font-semibold text-slate-800 mb-3">{t('analysis.uploadForm.benefitsTitle')}</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">✨</span>
                {t('analysis.uploadForm.benefits.uxAnalysis')}
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">📊</span>
                {t('analysis.uploadForm.benefits.businessAnalytics')}
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">🧪</span>
                {t('analysis.uploadForm.benefits.abTests')}
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">💡</span>
                {t('analysis.uploadForm.benefits.productHypotheses')}
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
