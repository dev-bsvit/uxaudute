'use client'

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Edit3, Save, X, RotateCcw, Square, Circle, Type, ArrowRight } from 'lucide-react'

interface CanvasAnnotationsProps {
  src: string
  alt: string
  className?: string
  onAnnotationSave?: (annotationData: string) => void
  initialAnnotationData?: string
  auditId?: string // ID аудита для сохранения в базу данных
  autoSave?: boolean // Автоматическое сохранение при изменениях
}

interface Annotation {
  id: string
  type: 'rectangle' | 'circle' | 'arrow' | 'text'
  x: number
  y: number
  width: number
  height: number
  text?: string
  color: string
}

export function CanvasAnnotations({ 
  src, 
  alt, 
  className = "w-full h-auto max-h-80 object-contain",
  onAnnotationSave,
  initialAnnotationData,
  auditId,
  autoSave = true
}: CanvasAnnotationsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [hasAnnotations, setHasAnnotations] = useState(false)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [currentTool, setCurrentTool] = useState<'rectangle' | 'circle' | 'arrow' | 'text'>('rectangle')
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const [currentAnnotation, setCurrentAnnotation] = useState<Annotation | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isCanvasReady, setIsCanvasReady] = useState(false)

  // Функции для работы с API аннотаций
  const saveAnnotationsToAPI = async (annotationsData: Annotation[]) => {
    if (!auditId || !isClient) return

    try {
      setIsSaving(true)
      const response = await fetch('/api/annotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auditId,
          annotations: { annotations: annotationsData, timestamp: new Date().toISOString() }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save annotations')
      }

      setLastSaved(new Date())
      console.log('Annotations saved to database')
    } catch (error) {
      console.error('Error saving annotations:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadAnnotationsFromAPI = async () => {
    if (!auditId || !isClient) return

    try {
      const response = await fetch(`/api/annotations?auditId=${auditId}`)
      if (!response.ok) return

      const data = await response.json()
      if (data.success && data.annotations) {
        // data.annotations уже является массивом аннотаций
        const annotationsArray = Array.isArray(data.annotations) ? data.annotations : []
        setAnnotations(annotationsArray)
        setHasAnnotations(annotationsArray.length > 0)
        console.log('Annotations loaded from database:', annotationsArray)
      }
    } catch (error) {
      console.error('Error loading annotations:', error)
    }
  }

  // Автоматическое сохранение при изменениях
  useEffect(() => {
    if (autoSave && auditId && annotations.length > 0 && isClient) {
      const timeoutId = setTimeout(() => {
        saveAnnotationsToAPI(annotations)
      }, 1000) // Сохраняем через 1 секунду после последнего изменения

      return () => clearTimeout(timeoutId)
    }
  }, [annotations, autoSave, auditId, isClient])

  useEffect(() => {
    setIsClient(typeof window !== 'undefined')
    
    // Создаем стабильный ключ на основе имени файла или URL
    const getStableKey = (url: string) => {
      try {
        const urlObj = new URL(url)
        const pathname = urlObj.pathname
        const filename = pathname.split('/').pop() || 'unknown'
        return `canvas-annotations-${filename}`
      } catch {
        // Если не удается распарсить URL, используем хеш
        const hash = url.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0)
          return a & a
        }, 0)
        return `canvas-annotations-${Math.abs(hash)}`
      }
    }
    
    // Загружаем аннотации из базы данных, если есть auditId
    const loadAnnotations = async () => {
      if (auditId) {
        try {
          console.log('Loading annotations from database for audit:', auditId)
          const response = await fetch(`/api/annotations?auditId=${auditId}`)
          
          if (response.ok) {
            const { annotations: dbAnnotations } = await response.json()
            if (dbAnnotations) {
              // dbAnnotations уже является массивом, не нужно парсить
              const annotationsArray = Array.isArray(dbAnnotations) ? dbAnnotations : []
              console.log('Loaded annotations from database:', annotationsArray)
              setAnnotations(annotationsArray)
              setHasAnnotations(annotationsArray.length > 0)
              return // Если загрузили из БД, не загружаем из localStorage
            }
          } else {
            console.error('Failed to load annotations from database:', await response.text())
          }
        } catch (error) {
          console.error('Error loading annotations from database:', error)
        }
      }
      
      // Fallback: загружаем из localStorage
      if (isClient && src) {
        const storageKey = getStableKey(src)
        console.log('Loading annotations from localStorage with key:', storageKey)
        
        const savedAnnotations = localStorage.getItem(storageKey)
        if (savedAnnotations) {
          try {
            const parsed = JSON.parse(savedAnnotations)
            console.log('Loaded annotations from localStorage:', parsed)
            setAnnotations(parsed)
            setHasAnnotations(parsed.length > 0)
          } catch (error) {
            console.error('Error loading annotations from localStorage:', error)
          }
        }
      }
    }
    
    loadAnnotations()
    
    // Загружаем initialAnnotationData если есть
    if (initialAnnotationData) {
      try {
        const parsed = JSON.parse(initialAnnotationData)
        setAnnotations(parsed)
        setHasAnnotations(parsed.length > 0)
      } catch (error) {
        console.error('Error parsing initial annotations:', error)
      }
    }
  }, [initialAnnotationData, isClient, src, auditId])

  // Автоматический запуск редактора отключен - пользователь сам решает когда начать

  const startAnnotation = () => {
    console.log('Starting annotation mode', { isCanvasReady, isClient })
    setIsEditing(true)
    
    // Добавляем небольшую задержку, чтобы Canvas успел инициализироваться
    setTimeout(() => {
      drawAnnotations()
    }, 100)
  }

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) {
      console.log('Canvas or image not available for drawing', { 
        canvas: !!canvas, 
        image: !!image,
        isCanvasReady,
        isClient 
      })
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.log('Canvas context not available')
      return
    }
    
    console.log('Drawing annotations:', annotations.length, { 
      canvasSize: { width: canvas.width, height: canvas.height },
      imageSize: { width: image.naturalWidth, height: image.naturalHeight }
    })

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем аннотации
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = 2
      ctx.fillStyle = annotation.color + '20'

      switch (annotation.type) {
        case 'rectangle':
          if (annotation.width > 0 && annotation.height > 0) {
            ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
            ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height)
          }
          break
        case 'circle':
          ctx.beginPath()
          const radius = Math.abs(Math.min(annotation.width, annotation.height)) / 2
          if (radius > 0) {
            ctx.arc(
              annotation.x + annotation.width / 2,
              annotation.y + annotation.height / 2,
              radius,
              0,
              2 * Math.PI
            )
            ctx.stroke()
            ctx.fill()
          }
          break
        case 'arrow':
          drawArrow(ctx, annotation)
          break
        case 'text':
          ctx.fillStyle = annotation.color
          ctx.font = '16px Arial'
          ctx.fillText(annotation.text || '', annotation.x, annotation.y + 16)
          break
      }
    })
  }, [annotations])

  // Перерисовываем аннотации когда Canvas становится готов
  useEffect(() => {
    if (isCanvasReady && isEditing) {
      console.log('Canvas ready, redrawing annotations')
      drawAnnotations()
    }
  }, [isCanvasReady, isEditing, drawAnnotations])

  const drawArrow = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { x, y, width, height } = annotation
    
    // Проверяем, что стрелка имеет разумные размеры
    if (Math.abs(width) < 1 && Math.abs(height) < 1) return
    
    const headLength = Math.min(20, Math.sqrt(width * width + height * height) / 3)
    const angle = Math.atan2(height, width)
    
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x + width, y + height)
    ctx.stroke()
    
    // Стрелка
    ctx.beginPath()
    ctx.moveTo(x + width, y + height)
    ctx.lineTo(
      x + width - headLength * Math.cos(angle - Math.PI / 6),
      y + height - headLength * Math.sin(angle - Math.PI / 6)
    )
    ctx.moveTo(x + width, y + height)
    ctx.lineTo(
      x + width - headLength * Math.cos(angle + Math.PI / 6),
      y + height - headLength * Math.sin(angle + Math.PI / 6)
    )
    ctx.stroke()
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    console.log('Mouse down clicked!', { isEditing, isCanvasReady, currentTool })
    
    if (!isEditing || !isCanvasReady) {
      console.log('Canvas not ready or not editing')
      return
    }

    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) {
      console.log('Canvas or image ref not available')
      return
    }

    const canvasRect = canvas.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    
    // Вычисляем координаты относительно Canvas с учетом масштаба
    const scaleX = canvas.width / imageRect.width
    const scaleY = canvas.height / imageRect.height
    
    const x = (e.clientX - canvasRect.left) * scaleX
    const y = (e.clientY - canvasRect.top) * scaleY

    console.log('Mouse down:', { 
      x, y, 
      canvasRect: { width: canvasRect.width, height: canvasRect.height },
      imageRect: { width: imageRect.width, height: imageRect.height },
      scale: { x: scaleX, y: scaleY }
    })

    setIsDrawing(true)
    setStartPos({ x, y })

    if (currentTool === 'text') {
      const text = prompt('Введите текст:')
      if (text) {
        const newAnnotation: Annotation = {
          id: Date.now().toString(),
          type: 'text',
          x,
          y,
          width: 0,
          height: 0,
          text,
          color: '#3b82f6'
        }
        setAnnotations(prev => [...prev, newAnnotation])
        setHasAnnotations(true)
      }
    } else {
      setCurrentAnnotation({
        id: Date.now().toString(),
        type: currentTool,
        x,
        y,
        width: 0,
        height: 0,
        color: '#3b82f6'
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentAnnotation || currentTool === 'text') return

    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const canvasRect = canvas.getBoundingClientRect()
    const imageRect = image.getBoundingClientRect()
    
    // Вычисляем координаты относительно Canvas с учетом масштаба
    const scaleX = canvas.width / imageRect.width
    const scaleY = canvas.height / imageRect.height
    
    const x = (e.clientX - canvasRect.left) * scaleX
    const y = (e.clientY - canvasRect.top) * scaleY

    const width = x - startPos.x
    const height = y - startPos.y

    setCurrentAnnotation(prev => prev ? { ...prev, width, height } : null)

    // Рисуем временную аннотацию
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем canvas и рисуем все аннотации
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawAnnotations()

    // Рисуем текущую аннотацию
    ctx.strokeStyle = currentAnnotation.color
    ctx.lineWidth = 2
    ctx.fillStyle = currentAnnotation.color + '20'

    switch (currentTool) {
      case 'rectangle':
        ctx.strokeRect(startPos.x, startPos.y, width, height)
        ctx.fillRect(startPos.x, startPos.y, width, height)
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(
          startPos.x + width / 2,
          startPos.y + height / 2,
          Math.min(Math.abs(width), Math.abs(height)) / 2,
          0,
          2 * Math.PI
        )
        ctx.stroke()
        ctx.fill()
        break
      case 'arrow':
        drawArrow(ctx, { ...currentAnnotation, width, height })
        break
    }
  }

  const handleMouseUp = () => {
    if (!isDrawing || !currentAnnotation || currentTool === 'text') return

    setAnnotations(prev => [...prev, currentAnnotation])
    setCurrentAnnotation(null)
    setIsDrawing(false)
    setHasAnnotations(true)
  }


  const getStableKey = (url: string) => {
    try {
      const urlObj = new URL(url)
      const pathname = urlObj.pathname
      const filename = pathname.split('/').pop() || 'unknown'
      return `canvas-annotations-${filename}`
    } catch {
      // Если не удается распарсить URL, используем хеш
      const hash = url.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0)
        return a & a
      }, 0)
      return `canvas-annotations-${Math.abs(hash)}`
    }
  }

  const saveAnnotations = async () => {
    const data = JSON.stringify(annotations)
    onAnnotationSave?.(data)
    
    // Сохраняем в localStorage для быстрого доступа
    if (isClient) {
      const storageKey = getStableKey(src)
      console.log('Saving annotations with key:', storageKey)
      localStorage.setItem(storageKey, data)
      console.log('Annotations saved to localStorage:', annotations)
    }
    
    // Сохраняем в базу данных, если есть auditId
    if (auditId) {
      try {
        console.log('Saving annotations to database for audit:', auditId)
        const response = await fetch('/api/annotations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            auditId,
            annotations: data
          })
        })
        
        if (response.ok) {
          console.log('Annotations saved to database successfully')
        } else {
          console.error('Failed to save annotations to database:', await response.text())
        }
      } catch (error) {
        console.error('Error saving annotations to database:', error)
      }
    }
    
    setIsEditing(false)
  }

  const cancelAnnotation = () => {
    setIsEditing(false)
    setCurrentAnnotation(null)
    setIsDrawing(false)
  }

  const clearAnnotations = () => {
    setAnnotations([])
    setHasAnnotations(false)
    onAnnotationSave?.('')
    
    if (isClient) {
      const storageKey = getStableKey(src)
      console.log('Clearing annotations with key:', storageKey)
      localStorage.removeItem(storageKey)
    }
    
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    }
  }

  const updateCanvasSize = () => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) {
      console.log('Canvas or image not available in updateCanvasSize', { 
        canvas: !!canvas, 
        image: !!image 
      })
      return
    }

    const rect = image.getBoundingClientRect()
    console.log('updateCanvasSize called', { 
      rectWidth: rect.width, 
      rectHeight: rect.height, 
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      isCanvasReady
    })
    
    // Проверяем, что изображение загружено и имеет размеры
    if (rect.width === 0 || rect.height === 0 || image.naturalWidth === 0) {
      console.log('Image not ready, retrying...', { 
        rectWidth: rect.width, 
        rectHeight: rect.height, 
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight 
      })
      // Уменьшаем интервал повтора для более быстрой инициализации
      setTimeout(updateCanvasSize, 100)
      return
    }
    
    // Устанавливаем размеры Canvas равными размерам изображения
    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.width = rect.width + 'px'
    canvas.style.height = rect.height + 'px'
    canvas.style.position = 'absolute'
    canvas.style.top = '0'
    canvas.style.left = '0'
    canvas.style.pointerEvents = 'auto'
    canvas.style.zIndex = '10'
    
    console.log('Canvas size updated:', rect.width, 'x', rect.height)
    console.log('Image natural size:', image.naturalWidth, 'x', image.naturalHeight)
    console.log('Image display size:', image.offsetWidth, 'x', image.offsetHeight)
    
    // Помечаем Canvas как готовый
    setIsCanvasReady(true)
    
    // Перерисовываем аннотации сразу
    drawAnnotations()
  }

  useEffect(() => {
    console.log('Canvas initialization useEffect triggered', { 
      hasImageRef: !!imageRef.current,
      isClient,
      isCanvasReady 
    })
    
    if (!isClient) return
    
    const initializeCanvas = () => {
      if (imageRef.current) {
        const img = imageRef.current
        console.log('Image state:', { 
          complete: img.complete, 
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          src: img.src
        })
        
        if (img.complete && img.naturalWidth > 0) {
          console.log('Image already loaded, calling updateCanvasSize')
          updateCanvasSize()
        } else {
          console.log('Image not loaded, adding load listener')
          const handleLoad = () => {
            console.log('Image load event fired')
            updateCanvasSize()
            img.removeEventListener('load', handleLoad)
          }
          img.addEventListener('load', handleLoad)
          
          // Fallback: если изображение не загрузилось за 3 секунды
          const timeout = setTimeout(() => {
            if (!isCanvasReady) {
              console.log('Image load timeout, forcing canvas initialization')
              updateCanvasSize()
            }
          }, 3000)
          
          return () => {
            img.removeEventListener('load', handleLoad)
            clearTimeout(timeout)
          }
        }
      } else {
        // Если изображение еще не создано, ждем немного и пробуем снова
        const retryTimeout = setTimeout(() => {
          initializeCanvas()
        }, 100)
        
        return () => clearTimeout(retryTimeout)
      }
    }
    
    // Запускаем инициализацию с небольшой задержкой
    const initTimeout = setTimeout(initializeCanvas, 50)
    
    return () => clearTimeout(initTimeout)
  }, [isClient, src])

  useEffect(() => {
    const handleResize = () => {
      updateCanvasSize()
    }

    if (isClient) {
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [isClient])

  if (!isClient) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden py-6 px-4" style={{ backgroundColor: '#D8E5EF' }}>
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
      <div className="border-2 border-dashed border-slate-200 rounded-xl overflow-hidden py-6 px-4" style={{ backgroundColor: '#D8E5EF' }}>
        <img 
          ref={imageRef}
          src={src} 
          alt={alt} 
          className={className}
          style={{ 
            aspectRatio: 'auto',
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block'
          }}
        />
        
        {/* Canvas для аннотаций */}
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-auto cursor-crosshair"
          style={{ zIndex: 10 }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>

      {/* Индикатор загрузки */}
      {!isCanvasReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 rounded-xl">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Загрузка редактора аннотаций...</p>
          </div>
        </div>
      )}

      {/* Кнопка запуска редактора */}
      {isCanvasReady && !isEditing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-xl">
          <Button
            onClick={startAnnotation}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            Начать редактирование
          </Button>
        </div>
      )}

      {/* Панель инструментов */}
      {isEditing && (
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          <Button
            size="sm"
            variant={currentTool === 'rectangle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('rectangle')}
          >
            <Square className="w-4 h-4 mr-2" />
            Прямоугольник
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'circle' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('circle')}
          >
            <Circle className="w-4 h-4 mr-2" />
            Круг
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'arrow' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('arrow')}
          >
            <ArrowRight className="w-4 h-4 mr-2" />
            Стрелка
          </Button>
          <Button
            size="sm"
            variant={currentTool === 'text' ? 'default' : 'outline'}
            onClick={() => setCurrentTool('text')}
          >
            <Type className="w-4 h-4 mr-2" />
            Текст
          </Button>
        </div>
      )}

      {/* Кнопки управления */}
      <div className="mt-4 flex gap-2 justify-center">
        {!isEditing ? (
          <Button
            size="sm"
            variant="outline"
            onClick={startAnnotation}
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <Edit3 className="w-4 h-4 mr-2" />
            {hasAnnotations ? 'Редактировать' : 'Добавить аннотации'}
          </Button>
        ) : (
          <>
            <Button
              size="sm"
              variant="default"
              onClick={saveAnnotations}
            >
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={cancelAnnotation}
            >
              <X className="w-4 h-4 mr-2" />
              Отмена
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearAnnotations}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Очистить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsEditing(false)}
            >
              <X className="w-4 h-4 mr-2" />
              Остановить
            </Button>
          </>
        )}
      </div>

      {/* Индикатор загрузки Canvas */}
      {!isCanvasReady && isClient && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            ⏳ Загрузка редактора аннотаций...
          </span>
        </div>
      )}

      {/* Индикатор аннотаций */}
      {hasAnnotations && !isEditing && isCanvasReady && (
        <div className="mt-2 text-center space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            ✓ {annotations.length} аннотаций сохранено
          </span>
          
          {/* Статус сохранения */}
          {auditId && (
            <div className="text-xs text-gray-500">
              {isSaving ? (
                <span className="text-blue-600">💾 Сохранение...</span>
              ) : lastSaved ? (
                <span className="text-green-600">
                  ✓ Сохранено {lastSaved.toLocaleTimeString('ru-RU')}
                </span>
              ) : (
                <span className="text-gray-500">Синхронизировано с базой данных</span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
