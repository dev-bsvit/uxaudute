'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Link as LinkIcon } from "lucide-react"

interface UploadFormProps {
  onSubmit: (data: { url?: string; screenshot?: File }) => void
  isLoading?: boolean
}

export function UploadForm({ onSubmit, isLoading }: UploadFormProps) {
  const [url, setUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (activeTab === 'url' && url) {
      onSubmit({ url })
    } else if (activeTab === 'upload' && file) {
      onSubmit({ screenshot: file })
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
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Начать исследование</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex mb-6 border-b">
          <button
            className={`flex-1 py-2 px-4 text-center border-b-2 ${
              activeTab === 'url' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('url')}
          >
            <LinkIcon className="w-4 h-4 inline mr-2" />
            URL сайта
          </button>
          <button
            className={`flex-1 py-2 px-4 text-center border-b-2 ${
              activeTab === 'upload' 
                ? 'border-blue-500 text-blue-600' 
                : 'border-transparent text-gray-500'
            }`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload className="w-4 h-4 inline mr-2" />
            Скриншот
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {activeTab === 'url' ? (
            <div>
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Ссылка на страницу для анализа
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          ) : (
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                Загрузить скриншот
              </label>
              <input
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              {file && (
                <p className="mt-2 text-sm text-gray-600">
                  Выбран файл: {file.name}
                </p>
              )}
            </div>
          )}

          <Button
            type="submit"
            disabled={!isValid || isLoading}
            className="w-full"
          >
            {isLoading ? 'Анализируем...' : 'Начать анализ'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
