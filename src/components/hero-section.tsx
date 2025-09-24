'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { RainbowButton } from '@/components/ui/rainbow-button'
import { ImageUpload } from '@/components/ui/image-upload'
import { AnalysisModal } from '@/components/analysis-modal'
import Link from 'next/link'
import { ArrowRight, Upload, Link as LinkIcon } from 'lucide-react'
import { useTranslation } from '@/hooks/use-translation'

export function HeroSection() {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('upload')
  const [isLoading, setIsLoading] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisData, setAnalysisData] = useState<{url?: string; screenshot?: string} | null>(null)
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    try {
      if (activeTab === 'url' && url) {
        // Сохраняем данные для модального окна
        setAnalysisData({ url })
        setIsAnalyzing(true)
        // Сохраняем URL в localStorage и перенаправляем
        localStorage.setItem('pendingAnalysis', JSON.stringify({ type: 'url', data: url }))
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 2000) // Даем время показать модальное окно
      } else if (activeTab === 'upload' && file) {
        // Конвертируем файл в base64
        const reader = new FileReader()
        reader.onload = () => {
          const base64String = reader.result as string
          // Сохраняем данные для модального окна
          setAnalysisData({ screenshot: base64String })
          setIsAnalyzing(true)
          // Сохраняем в localStorage и перенаправляем
          localStorage.setItem('pendingAnalysis', JSON.stringify({ type: 'screenshot', data: base64String }))
          setTimeout(() => {
            window.location.href = '/dashboard'
          }, 2000) // Даем время показать модальное окно
        }
        reader.readAsDataURL(file)
      } else {
        // Если ничего не загружено, перенаправляем на авторизацию
        window.location.href = '/dashboard'
      }
    } catch (error) {
      console.error('Error:', error)
      setIsLoading(false)
    }
  }

  const handleFileChange = (selectedFile: File) => {
    setFile(selectedFile)
  }

  const isValid = true // Кнопка всегда активна

  return (
    <div 
      className="relative w-full h-[110vh] flex items-center justify-center px-6"
      style={{
        background: 'linear-gradient(180deg, #6A8DB8 0%, #BDD4E5 80.29%, #FFF 100%)'
      }}
    >
        <div className="w-full">
        <div className="text-center">
          {/* Центрированный заголовок */}
          <h1 
            className="mb-8 leading-tight text-white"
            style={{
              color: '#FFF',
              textAlign: 'center',
              fontFamily: 'Inter Display',
              fontSize: '80px',
              fontStyle: 'normal',
              fontWeight: 600,
              lineHeight: '90%'
            }}
          >
            Intelligent Research shapes<br />
            the next digital products
          </h1>
          
          {/* Форма загрузки по центру */}
          <div className="w-full max-w-2xl mx-auto">
            <div className="bg-white rounded-[32px] p-4 shadow-2xl">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Поле загрузки сверху */}
                {activeTab === 'url' ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={t('analysis.hero.placeholder')}
                        className="w-full px-4 py-3 text-sm border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 flex items-center justify-center"
                        style={{ minHeight: '190px', borderRadius: '16px' }}
                        required
                      />
                      <LinkIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
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

                {/* Кнопки переключатели снизу слева и кнопка справа */}
                <div className="flex items-center justify-between">
                  {/* Кнопки переключатели слева */}
                  <div className="flex gap-2 rounded-[30px]" style={{ borderRadius: '30px' }}>
                    <button
                      type="button"
                      className="px-4 py-2 transition-all duration-300"
                      style={{
                        color: activeTab === 'upload' ? '#000' : 'rgba(161, 161, 161, 1)',
                        textAlign: 'center',
                        fontFamily: 'Inter Display',
                        fontSize: '15px',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        lineHeight: '90%'
                      }}
                      onClick={() => setActiveTab('upload')}
                    >
{t('analysis.hero.screenshot')}
                    </button>
                    <button
                      type="button"
                      className="px-4 py-2 transition-all duration-300"
                      style={{
                        color: activeTab === 'url' ? '#000' : 'rgba(161, 161, 161, 1)',
                        textAlign: 'center',
                        fontFamily: 'Inter Display',
                        fontSize: '15px',
                        fontStyle: 'normal',
                        fontWeight: 600,
                        lineHeight: '90%'
                      }}
                      onClick={() => setActiveTab('url')}
                    >
{t('analysis.hero.urlSite')}
                    </button>
                  </div>

                  {/* Кнопка справа */}
                  {isLoading ? (
                    <Button
                      type="submit"
                      disabled={true}
                      size="lg"
                      className="text-lg font-bold bg-black hover:bg-gray-800"
                    >
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
{t('analysis.hero.analyzing')}
                    </Button>
                  ) : (
                    <RainbowButton
                      type="submit"
                      disabled={!isValid}
                      className="text-lg font-bold"
                    >
{t('analysis.hero.getTestFree')}
                    </RainbowButton>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно прогресса анализа */}
      <AnalysisModal
        isOpen={isAnalyzing}
        onClose={() => setIsAnalyzing(false)}
        screenshot={analysisData?.screenshot}
        url={analysisData?.url}
        canClose={true}
      />
    </div>
  )
}
