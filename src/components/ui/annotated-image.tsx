'use client'

import React, { useRef, useEffect, useState } from 'react'
import { AnnotationEditor } from '@markerjs/markerjs-ui'
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
  const editorRef = useRef<AnnotationEditor | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasAnnotations, setHasAnnotations] = useState(false)

  useEffect(() => {
    if (initialAnnotationData) {
      setHasAnnotations(true)
    }
  }, [initialAnnotationData])

  const startAnnotation = () => {
    if (!imageRef.current || !containerRef.current) return

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

    // Добавляем редактор в контейнер
    containerRef.current.appendChild(editor)
    editorRef.current = editor

    setIsEditing(true)
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

      {/* Контейнер для редактора аннотаций */}
      <div ref={containerRef} className="absolute inset-0 pointer-events-none" />

      {/* Панель управления аннотациями */}
      <div className="absolute top-4 right-4 flex gap-2">
        {!isEditing ? (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={startAnnotation}
              className="bg-white/90 hover:bg-white shadow-md"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              {hasAnnotations ? 'Редактировать' : 'Аннотировать'}
            </Button>
            {hasAnnotations && (
              <Button
                size="sm"
                variant="outline"
                onClick={clearAnnotations}
                className="bg-white/90 hover:bg-white shadow-md text-red-600 hover:text-red-700"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </>
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
