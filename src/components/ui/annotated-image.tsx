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
        const rect = img.getBoundingClientRect()
        editorRef.current.style.width = rect.width + 'px'
        editorRef.current.style.height = rect.height + 'px'
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
      // Динамически импортируем MarkerArea из markerjs3 согласно документации
      const markerjs3 = await import('@markerjs/markerjs3') as any
      console.log('MarkerJS3 module:', markerjs3)
      const MarkerArea = markerjs3.MarkerArea || markerjs3.default?.MarkerArea || markerjs3.default
      
      // Очищаем предыдущий редактор
      if (editorRef.current) {
        containerRef.current.removeChild(editorRef.current)
      }

      // Создаем новый MarkerArea согласно документации
      const markerArea = new MarkerArea()
      markerArea.targetImage = imageRef.current
      
      // Устанавливаем размеры MarkerArea равными размерам изображения
      const img = imageRef.current
      if (img) {
        // Ждем полной загрузки изображения для правильных размеров
        const updateMarkerAreaSize = () => {
          const rect = img.getBoundingClientRect()
          
          // Устанавливаем точные размеры MarkerArea согласно документации
          markerArea.style.width = rect.width + 'px'
          markerArea.style.height = rect.height + 'px'
          markerArea.style.position = 'absolute'
          markerArea.style.top = '0'
          markerArea.style.left = '0'
          markerArea.style.zIndex = '10'
          markerArea.style.pointerEvents = 'auto'
          
          // Важно: не растягиваем MarkerArea, сохраняем пропорции
          markerArea.style.objectFit = 'contain'
          markerArea.style.objectPosition = 'center'
          
          console.log('MarkerArea size set to:', rect.width, 'x', rect.height)
        }
        
        if (img.complete) {
          updateMarkerAreaSize()
        } else {
          img.addEventListener('load', updateMarkerAreaSize)
        }
      }

      // Настраиваем светлую тему для MarkerArea
      const applyLightTheme = () => {
        console.log('Applying light theme to MarkerArea...')
        
        // Применяем светлую тему к MarkerArea
        const markerAreaElement = markerArea as HTMLElement
        
        // Применяем к самому MarkerArea
        markerAreaElement.style.background = '#ffffff'
        markerAreaElement.style.color = '#000000'
        markerAreaElement.style.setProperty('background', '#ffffff', 'important')
        markerAreaElement.style.setProperty('color', '#000000', 'important')
        
        // Находим и стилизуем все дочерние элементы
        const allElements = markerAreaElement.querySelectorAll('*')
        console.log('Found MarkerArea elements:', allElements.length)
        
        allElements.forEach((element: any) => {
          if (element.style) {
            // Принудительно применяем светлую тему ко всем элементам
            element.style.setProperty('background', '#ffffff', 'important')
            element.style.setProperty('color', '#000000', 'important')
            
            // Стилизуем кнопки
            if (element.tagName === 'BUTTON' || element.classList.contains('markerjs-button')) {
              element.style.setProperty('background', '#ffffff', 'important')
              element.style.setProperty('color', '#000000', 'important')
              element.style.setProperty('border', '1px solid #e5e7eb', 'important')
            }
            
            // Стилизуем панели
            if (element.classList.contains('markerjs-toolbar') || 
                element.classList.contains('markerjs-properties-panel') ||
                element.classList.contains('markerjs-context-menu')) {
              element.style.setProperty('background', '#ffffff', 'important')
              element.style.setProperty('border', '1px solid #e5e7eb', 'important')
              element.style.setProperty('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)', 'important')
              element.style.setProperty('color', '#000000', 'important')
            }
            
            // Стилизуем инпуты
            if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
              element.style.setProperty('background', '#ffffff', 'important')
              element.style.setProperty('color', '#000000', 'important')
              element.style.setProperty('border', '1px solid #d1d5db', 'important')
            }
          }
        })
      }
      
      // Применяем тему сразу и через небольшую задержку
      applyLightTheme()
      setTimeout(applyLightTheme, 100)
      setTimeout(applyLightTheme, 500)
      setTimeout(applyLightTheme, 1000)
      setTimeout(applyLightTheme, 2000)
      
      // Дополнительно применяем через MutationObserver
      const observer = new MutationObserver(() => {
        applyLightTheme()
      })
      observer.observe(markerArea as HTMLElement, { childList: true, subtree: true })
      
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
          markerArea.setState(JSON.parse(annotationsToLoad))
        } catch (error) {
          console.warn('Ошибка загрузки аннотаций:', error)
        }
      }

      // Обработчики событий согласно документации MarkerArea
      markerArea.addEventListener('statechange', () => {
        const state = markerArea.getState()
        setHasAnnotations(true)
        onAnnotationSave?.(JSON.stringify(state))
        
        // Сохраняем аннотации в localStorage для персистентности
        const storageKey = `markerjs-annotations-${src}`
        localStorage.setItem(storageKey, JSON.stringify(state))
      })

      // Добавляем MarkerArea в DOM согласно документации
      containerRef.current.appendChild(markerArea)
      editorRef.current = markerArea
      setIsEditing(true)
    } catch (error) {
      console.error('Ошибка загрузки MarkerJS:', error)
    }
  }

  const saveAnnotations = () => {
    if (editorRef.current) {
      // Сохранение происходит через событие statechange
      // Просто закрываем MarkerArea
      if (containerRef.current && editorRef.current) {
        containerRef.current.removeChild(editorRef.current)
        editorRef.current = null
        setIsEditing(false)
      }
    }
  }

  const cancelAnnotation = () => {
    if (editorRef.current && containerRef.current) {
      containerRef.current.removeChild(editorRef.current)
      editorRef.current = null
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
          className="w-full h-auto max-h-[70vh] object-contain bg-white"
          style={{ 
            aspectRatio: 'auto',
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block'
          }}
          onError={(e) => {
            console.error('Error loading image:', src)
            console.error('Image error:', e)
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', src)
            console.log('Image dimensions:', imageRef.current?.naturalWidth, 'x', imageRef.current?.naturalHeight)
            console.log('Image display size:', imageRef.current?.offsetWidth, 'x', imageRef.current?.offsetHeight)
            
            // Обновляем размеры MarkerArea после загрузки изображения
            if (editorRef.current && imageRef.current) {
              const img = imageRef.current
              const rect = img.getBoundingClientRect()
              editorRef.current.style.width = rect.width + 'px'
              editorRef.current.style.height = rect.height + 'px'
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
          minHeight: 'fit-content',
          overflow: 'hidden'
        }}
      >
        {/* Редактор будет добавлен сюда динамически */}
        <style jsx>{`
          markerjs-editor {
            background: #ffffff !important;
            color: #000000 !important;
          }
          markerjs-editor * {
            background: #ffffff !important;
            color: #000000 !important;
          }
          markerjs-editor button {
            background: #ffffff !important;
            color: #000000 !important;
            border: 1px solid #e5e7eb !important;
          }
          markerjs-editor button:hover {
            background: #f3f4f6 !important;
            color: #000000 !important;
          }
        `}</style>
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
