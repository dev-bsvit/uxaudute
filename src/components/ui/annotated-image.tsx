'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit3, Save, X, RotateCcw } from 'lucide-react'

interface AnnotatedImageProps {
  src: string
  alt: string
  className?: string
  onAnnotationSave?: (annotationData: string) => void
  initialAnnotationData?: string
}

export function AnnotatedImage({ 
  src, 
  alt, 
  className = "w-full h-auto max-h-80 object-contain bg-white",
  onAnnotationSave,
  initialAnnotationData
}: AnnotatedImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const editorRef = useRef<any>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasAnnotations, setHasAnnotations] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Проверяем, что мы в браузере
    setIsClient(typeof window !== 'undefined')
    
    if (initialAnnotationData) {
      setHasAnnotations(true)
    }
  }, [initialAnnotationData])

  // Автоматически открываем редактор при загрузке изображения
  useEffect(() => {
    if (isClient && imageRef.current) {
      // Небольшая задержка для полной загрузки изображения
      const timer = setTimeout(() => {
        startAnnotation()
      }, 500)
      
      return () => clearTimeout(timer)
    }
  }, [isClient])

  const startAnnotation = async () => {
    if (!imageRef.current || !isClient) return

    try {
      // Динамически импортируем MarkerJS только в браузере
      const { AnnotationEditor } = await import('@markerjs/markerjs-ui')
      
      // Очищаем предыдущий редактор
      if (editorRef.current) {
        editorRef.current.close()
      }

      // Создаем новый редактор
      const editor = new AnnotationEditor()
      editor.targetImage = imageRef.current
      
      // Загружаем существующие аннотации если есть
      if (initialAnnotationData) {
        try {
          editor.deserializeState(initialAnnotationData)
        } catch (error) {
          console.warn('Ошибка загрузки аннотаций:', error)
        }
      }

      // Обработчики событий
      editor.addEventListener('statechange', () => {
        setHasAnnotations(true)
      })

      editor.addEventListener('close', () => {
        setIsEditing(false)
      })

      // Открываем редактор (правильный метод)
      editor.open()
      editorRef.current = editor

      setIsEditing(true)
    } catch (error) {
      console.error('Ошибка загрузки MarkerJS:', error)
    }
  }

  const saveAnnotations = () => {
    if (editorRef.current) {
      const annotationData = editorRef.current.serializeState()
      onAnnotationSave?.(annotationData)
      setHasAnnotations(true)
      editorRef.current.close()
      setIsEditing(false)
    }
  }

  const cancelAnnotation = () => {
    if (editorRef.current) {
      editorRef.current.close()
      setIsEditing(false)
    }
  }

  const clearAnnotations = () => {
    if (editorRef.current) {
      editorRef.current.clear()
      setHasAnnotations(false)
      onAnnotationSave?.('')
    }
  }

  // Если не в браузере, показываем обычное изображение
  if (!isClient) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <img 
          src={src} 
          alt={alt} 
          className={className}
        />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Изображение */}
      <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
        <img 
          ref={imageRef}
          src={src} 
          alt={alt} 
          className={className}
          onError={(e) => {
            console.error('Error loading image:', src)
            console.error('Image error:', e)
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', src)
          }}
        />
      </div>

      {/* Панель управления аннотациями - только при редактировании */}
      {isEditing && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Button
            size="sm"
            onClick={saveAnnotations}
            className="bg-green-600 hover:bg-green-700 text-white shadow-md"
          >
            <Save className="w-4 h-4 mr-2" />
            Сохранить
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={cancelAnnotation}
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Индикатор загрузки редактора */}
      {isClient && !isEditing && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
          Загружается редактор...
        </div>
      )}
    </div>
  )
}
