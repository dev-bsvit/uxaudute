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
    
    // Загружаем аннотации из localStorage
    if (isClient && src) {
      const storageKey = `markerjs-annotations-${src}`
      const savedAnnotations = localStorage.getItem(storageKey)
      if (savedAnnotations) {
        setHasAnnotations(true)
        // Если нет initialAnnotationData, используем сохраненные
        if (!initialAnnotationData) {
          onAnnotationSave?.(savedAnnotations)
        }
      }
    }
    
    if (initialAnnotationData) {
      setHasAnnotations(true)
    }
  }, [initialAnnotationData, isClient, src])

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
        // Ждем полной загрузки изображения для правильных размеров
        const updateEditorSize = () => {
          const rect = img.getBoundingClientRect()
          editor.style.width = rect.width + 'px'
          editor.style.height = rect.height + 'px'
          editor.style.position = 'absolute'
          editor.style.top = '0'
          editor.style.left = '0'
          editor.style.maxWidth = '100%'
          editor.style.maxHeight = '100%'
        }
        
        if (img.complete) {
          updateEditorSize()
        } else {
          img.addEventListener('load', updateEditorSize)
        }
      }

      // Настраиваем светлую тему для MarkerJS
      editor.addEventListener('ready', () => {
        // Применяем светлую тему к редактору
        const editorElement = editor as HTMLElement
        
        // Устанавливаем CSS переменные для светлой темы
        editorElement.style.setProperty('--markerjs-background', '#ffffff')
        editorElement.style.setProperty('--markerjs-foreground', '#000000')
        editorElement.style.setProperty('--markerjs-primary', '#3b82f6')
        editorElement.style.setProperty('--markerjs-secondary', '#6b7280')
        editorElement.style.setProperty('--markerjs-accent', '#10b981')
        editorElement.style.setProperty('--markerjs-muted', '#f3f4f6')
        editorElement.style.setProperty('--markerjs-border', '#e5e7eb')
        editorElement.style.setProperty('--markerjs-shadow', '0 1px 3px 0 rgba(0, 0, 0, 0.1)')
        
        // Применяем светлую тему к дочерним элементам
        setTimeout(() => {
          const toolbar = editorElement.querySelector('.markerjs-toolbar') as HTMLElement
          const propertiesPanel = editorElement.querySelector('.markerjs-properties-panel') as HTMLElement
          const contextMenu = editorElement.querySelector('.markerjs-context-menu') as HTMLElement
          
          if (toolbar) {
            toolbar.style.background = '#ffffff'
            toolbar.style.border = '1px solid #e5e7eb'
            toolbar.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
          
          if (propertiesPanel) {
            propertiesPanel.style.background = '#ffffff'
            propertiesPanel.style.border = '1px solid #e5e7eb'
            propertiesPanel.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
          
          if (contextMenu) {
            contextMenu.style.background = '#ffffff'
            contextMenu.style.border = '1px solid #e5e7eb'
            contextMenu.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        }, 100)
      })
      
      // Загружаем существующие аннотации если есть
      let annotationsToLoad = initialAnnotationData
      
      // Если нет initialAnnotationData, пробуем загрузить из localStorage
      if (!annotationsToLoad && isClient) {
        const storageKey = `markerjs-annotations-${src}`
        const savedAnnotations = localStorage.getItem(storageKey)
        if (savedAnnotations) {
          annotationsToLoad = savedAnnotations
        }
      }
      
      if (annotationsToLoad) {
        try {
          editor.deserializeState(annotationsToLoad)
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
          
          // Сохраняем аннотации в localStorage для персистентности
          const storageKey = `markerjs-annotations-${src}`
          localStorage.setItem(storageKey, state)
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
