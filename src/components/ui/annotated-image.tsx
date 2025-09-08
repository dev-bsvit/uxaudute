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

  // Автоматически открываем редактор при загрузке изображения
  useEffect(() => {
    if (isClient && imageRef.current && !isEditing) {
      // Небольшая задержка для полной загрузки изображения
      const timer = setTimeout(() => {
        startAnnotation()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isClient, isEditing])

  // Обработчик изменения размера окна
  useEffect(() => {
    const handleResize = () => {
      if (editorRef.current && imageRef.current) {
        const img = imageRef.current
        editorRef.current.style.width = img.offsetWidth + 'px'
        editorRef.current.style.height = img.offsetHeight + 'px'
      }
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isClient])

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
      
      // Устанавливаем размеры редактора равными размерам изображения
      const img = imageRef.current
      if (img) {
        editor.style.width = img.offsetWidth + 'px'
        editor.style.height = img.offsetHeight + 'px'
        editor.style.position = 'absolute'
        editor.style.top = '0'
        editor.style.left = '0'
      }
      
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
        // Закрываем редактор после сохранения
        if (containerRef.current && editorRef.current) {
          containerRef.current.removeChild(editorRef.current as HTMLElement)
          editorRef.current = null
        }
        setIsEditing(false)
      })

      editor.addEventListener('close', () => {
        if (containerRef.current && editorRef.current) {
          containerRef.current.removeChild(editorRef.current as HTMLElement)
          editorRef.current = null
        }
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
          className="w-full h-auto max-h-[70vh] object-contain bg-white"
          style={{ aspectRatio: 'auto' }}
          onError={(e) => {
            console.error('Error loading image:', src)
            console.error('Image error:', e)
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', src)
            // Обновляем размеры редактора после загрузки изображения
            if (editorRef.current && imageRef.current) {
              const img = imageRef.current
              editorRef.current.style.width = img.offsetWidth + 'px'
              editorRef.current.style.height = img.offsetHeight + 'px'
            }
          }}
        />
      </div>

      {/* Контейнер для редактора MarkerJS */}
      <div 
        ref={containerRef} 
        className="absolute top-0 left-0 pointer-events-auto z-10"
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: 'fit-content'
        }}
      >
        {/* Редактор будет добавлен сюда динамически */}
      </div>

      {/* Панель управления аннотациями - только для повторного открытия */}
      <div className="absolute top-4 right-4 flex gap-2">
        {!isEditing && hasAnnotations && (
          <Button
            size="sm"
            variant="outline"
            onClick={startAnnotation}
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Редактировать
          </Button>
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
