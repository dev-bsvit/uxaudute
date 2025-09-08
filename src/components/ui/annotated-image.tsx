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
  const containerRef = useRef<HTMLDivElement>(null)
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

  // Не открываем редактор автоматически, только по клику

  const startAnnotation = async () => {
    if (!imageRef.current || !isClient || !containerRef.current) return

    try {
      // Динамически импортируем MarkerJS только в браузере
      const { AnnotationEditor } = await import('@markerjs/markerjs-ui')
      
      // Очищаем предыдущий редактор
      if (editorRef.current) {
        containerRef.current.removeChild(editorRef.current)
      }

      // Создаем новый редактор
      const editor = new AnnotationEditor() as any
      editor.targetImage = imageRef.current
      
      // Загружаем существующие аннотации если есть
      if (initialAnnotationData) {
        try {
          editor.deserializeState(initialAnnotationData)
        } catch (error) {
          console.warn('Ошибка загрузки аннотаций:', error)
        }
      }

      // Обработчики событий согласно документации
      editor.addEventListener('editorsave', (event: any) => {
        const state = event.detail.state
        if (state) {
          setHasAnnotations(true)
          onAnnotationSave?.(state)
        }
        setIsEditing(false)
      })

      editor.addEventListener('close', () => {
        setIsEditing(false)
      })

      // Добавляем редактор в DOM согласно документации
      containerRef.current.appendChild(editor as HTMLElement)
      editorRef.current = editor
      setIsEditing(true)
    } catch (error) {
      console.error('Ошибка загрузки MarkerJS:', error)
    }
  }

  const saveAnnotations = () => {
    if (editorRef.current) {
      // Сохранение происходит через событие editorsave
      // Просто закрываем редактор
      if (containerRef.current && editorRef.current) {
        containerRef.current.removeChild(editorRef.current as HTMLElement)
        editorRef.current = null
        setIsEditing(false)
      }
    }
  }

  const cancelAnnotation = () => {
    if (editorRef.current && containerRef.current) {
      containerRef.current.removeChild(editorRef.current as HTMLElement)
      editorRef.current = null
      setIsEditing(false)
    }
  }

  const clearAnnotations = () => {
    if (editorRef.current) {
      (editorRef.current as any).clear()
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

      {/* Контейнер для редактора MarkerJS */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none">
        {/* Редактор будет добавлен сюда динамически */}
      </div>

      {/* Панель управления аннотациями */}
      <div className="absolute top-4 right-4 flex gap-2">
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startAnnotation}
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {hasAnnotations ? 'Редактировать' : 'Аннотировать'}
          </Button>
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Индикатор аннотаций */}
      {hasAnnotations && !isEditing && (
        <div className="absolute bottom-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium shadow-md">
          Есть аннотации
        </div>
      )}
    </div>
  )
}
