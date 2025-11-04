'use client'

import { useState, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, Image as ImageIcon, X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'

interface Step1IntroProps {
  introImageUrl?: string
  introTitle?: string
  introDescription?: string
  onUpdate: (data: {
    intro_image_url?: string
    intro_title?: string
    intro_description?: string
  }) => Promise<void>
  onNext?: () => void
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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if already uploading
    if (uploading) {
      e.target.value = ''
      return
    }

    // Validation
    if (!file.type.startsWith('image/')) {
      alert('Пожалуйста, загрузите изображение')
      e.target.value = '' // Reset input
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Размер файла не должен превышать 10MB')
      e.target.value = '' // Reset input
      return
    }

    setUploading(true)
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('Необходима авторизация')
        setUploading(false)
        e.target.value = '' // Reset input
        return
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data, error } = await supabase.storage
        .from('screenshots')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('screenshots')
        .getPublicUrl(fileName)

      console.log('Uploaded image URL:', publicUrl)
      setImageUrl(publicUrl)
      onUpdate({ intro_image_url: publicUrl, intro_title: title, intro_description: description })

      // Reset input after successful upload
      e.target.value = ''
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Не удалось загрузить изображение. Попробуйте еще раз.')
      e.target.value = '' // Reset input on error
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setImageUrl('')
    onUpdate({ intro_image_url: '', intro_title: title, intro_description: description })
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h2 className="text-[28px] font-medium leading-[30.8px] tracking-[-0.28px] text-[#1F1F1F] mb-2">
          Шаги создания
        </h2>
      </div>

      {/* Step Section: Экран Вступления */}
      <div className="space-y-6">
        {/* Step Header */}
        <div>
          <h3 className="text-base font-bold leading-[17.6px] tracking-[-0.16px] text-[#1F1F1F] mb-3">
            Экран Вступления
          </h3>
          <p className="text-base leading-[17.12px] text-[#1F1F1F]">
            На этом шаге загрузите скриншот интерфейса, для которого вы хотите создать опрос. Укажите вопрос либо задачу, которую пользователь должен был понятно, о каком экране идёт речь. Добавьте описание с контекстом: объясните, что нужно сделать пользователю, на что обратить внимание или какую функцию найти. Эта информация будет показана на приветственном экране опроса.
          </p>
        </div>

        {/* Image Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="intro-image" className="text-sm font-medium text-[#121217]">
            Загрузите изображения <span className="text-red-500">*</span>
          </Label>

          {imageUrl ? (
            <div className="relative w-full h-[104px] rounded-[15px] border-[1.2px] border-dashed border-[#CECECE] bg-white flex items-center justify-center overflow-visible">
              <div className="absolute left-[185px] top-[5px] w-[157px] h-[92px]">
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt="Intro image"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors z-10"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center w-full h-[104px] border-[1.2px] border-dashed border-[#CECECE] rounded-[15px] cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex flex-col items-center justify-center">
                {uploading ? (
                  <>
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
                    <p className="text-xs font-medium text-slate-700">Загрузка...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-500">
                      Перетащите изображения сюда
                    </p>
                    <p className="text-xs text-slate-400 mt-1">или нажмите для выбора файла</p>
                    <p className="text-xs text-slate-400 mt-1">PNG, JPG, GIF, WEBP до 5MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
            </div>
          )}
        </div>

        {/* Title Field */}
        <div className="space-y-2">
          <Label htmlFor="intro-title" className="text-sm font-medium text-[#121217]">
            Заголовок
          </Label>
          <Input
            id="intro-title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              onUpdate({ intro_image_url: imageUrl, intro_title: e.target.value, intro_description: description })
            }}
            placeholder="Экран ообавления карты "
            className="w-full bg-white border border-[#D1D1DB] rounded-lg px-2 py-2 text-sm text-[#6C6C89] placeholder:text-[#6C6C89]"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-2">
          <Label htmlFor="intro-description" className="text-sm font-medium text-[#121217]">
            Описание <span className="text-sm text-[#6C6C89]">(необязательно)</span>
          </Label>
          <Textarea
            id="intro-description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              onUpdate({ intro_image_url: imageUrl, intro_title: title, intro_description: e.target.value })
            }}
            placeholder="Оцените удобсто и расположения элементов после прохождения тестов вам будет предоставлен подарочный сертификат"
            rows={4}
            className="w-full bg-white border border-[#D1D1DB] rounded-lg px-4 py-2 text-sm text-[#6C6C89] placeholder:text-[#6C6C89]"
          />
        </div>

        {/* Next Button */}
        <div>
          <Button
            onClick={onNext}
            className="h-[50px] px-6 bg-[#0058FC] rounded-[44px] text-white text-base font-medium leading-[17.6px] tracking-[-0.16px] hover:bg-[#0047d1]"
          >
            Дальше
          </Button>
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-4 mt-6">
        {/* Вопросы Accordion */}
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-base font-bold text-[#1F1F1F]">Вопросы</span>
          <div className="w-8 h-8 rounded-full bg-[#EEF2FA] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>

        {/* Экран благодарности Accordion */}
        <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
          <span className="text-base font-bold text-[#1F1F1F]">Экран благодарности</span>
          <div className="w-8 h-8 rounded-full bg-[#EEF2FA] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </button>
      </div>
    </div>
  )
}
