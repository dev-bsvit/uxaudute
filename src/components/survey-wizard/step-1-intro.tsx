'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Image as ImageIcon, X } from 'lucide-react'
import Image from 'next/image'

interface Step1IntroProps {
  introImageUrl?: string
  introTitle?: string
  introDescription?: string
  onUpdate: (data: {
    intro_image_url?: string
    intro_title?: string
    intro_description?: string
  }) => void
  onNext: () => void
}

export function Step1Intro({
  introImageUrl,
  introTitle,
  introDescription,
  onUpdate,
  onNext
}: Step1IntroProps) {
  const [imageUrl, setImageUrl] = useState(introImageUrl || '')
  const [title, setTitle] = useState(introTitle || '')
  const [description, setDescription] = useState(introDescription || '')
  const [uploading, setUploading] = useState(false)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // TODO: Implement actual upload to Supabase storage
      // For now, create object URL for preview
      const objectUrl = URL.createObjectURL(file)
      setImageUrl(objectUrl)
      onUpdate({ intro_image_url: objectUrl, intro_title: title, intro_description: description })
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Не удалось загрузить изображение')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    onUpdate({ intro_image_url: '', intro_title: title, intro_description: description })
  }

  const handleNext = () => {
    if (!imageUrl || !title || !description) {
      alert('Пожалуйста, заполните все поля')
      return
    }
    onUpdate({ intro_image_url: imageUrl, intro_title: title, intro_description: description })
    onNext()
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          Вступительный экран
        </h2>
        <p className="text-slate-600">
          Создайте первое впечатление. Это первое, что увидят пользователи при открытии опроса.
        </p>
      </div>

      <Card className="p-6 space-y-6">
        {/* Image Upload */}
        <div>
          <Label htmlFor="intro-image" className="text-base font-medium mb-2 block">
            Изображение *
          </Label>
          <p className="text-sm text-slate-500 mb-4">
            Загрузите изображение для вступительного экрана. Это изображение также будет использоваться для показа вопросов.
          </p>

          {imageUrl ? (
            <div className="relative w-full h-64 rounded-lg overflow-hidden border-2 border-slate-200">
              <Image
                src={imageUrl}
                alt="Intro image"
                fill
                className="object-cover"
              />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor="intro-image"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {uploading ? (
                  <div className="text-slate-500">Загрузка...</div>
                ) : (
                  <>
                    <ImageIcon className="w-12 h-12 text-slate-400 mb-3" />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold">Нажмите для загрузки</span> или перетащите
                    </p>
                    <p className="text-xs text-slate-400">PNG, JPG или WEBP (макс. 5MB)</p>
                  </>
                )}
              </div>
              <input
                id="intro-image"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="intro-title" className="text-base font-medium mb-2 block">
            Заголовок *
          </Label>
          <Input
            id="intro-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              onUpdate({ intro_image_url: imageUrl, intro_title: e.target.value, intro_description: description })
            }}
            placeholder="Например: Помогите нам улучшить ваш опыт"
            className="text-lg"
          />
        </div>

        {/* Description */}
        <div>
          <Label htmlFor="intro-description" className="text-base font-medium mb-2 block">
            Описание *
          </Label>
          <Textarea
            id="intro-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              onUpdate({ intro_image_url: imageUrl, intro_title: title, intro_description: e.target.value })
            }}
            placeholder="Расскажите, что пользователей ждет в опросе и почему их мнение важно..."
            rows={4}
          />
        </div>
      </Card>

      {/* Preview */}
      {(imageUrl || title || description) && (
        <Card className="p-8">
          <div className="text-center space-y-4">
            <p className="text-sm text-slate-500 mb-6">Предпросмотр:</p>
            {imageUrl && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden mb-6">
                <Image
                  src={imageUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            {title && (
              <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            )}
            {description && (
              <p className="text-slate-600 max-w-2xl mx-auto">{description}</p>
            )}
            <Button className="mt-6" disabled>
              Начать опрос
            </Button>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-end">
        <Button
          onClick={handleNext}
          size="lg"
          disabled={!imageUrl || !title || !description}
        >
          Далее: Вопросы
        </Button>
      </div>
    </div>
  )
}
