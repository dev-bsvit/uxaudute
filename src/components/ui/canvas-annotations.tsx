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
  className = "w-full h-auto max-h-80 object-contain bg-white",
  onAnnotationSave,
  initialAnnotationData
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

  useEffect(() => {
    setIsClient(typeof window !== 'undefined')
    
    // Загружаем аннотации из localStorage
    if (isClient && src) {
      const storageKey = `canvas-annotations-${src}`
      const savedAnnotations = localStorage.getItem(storageKey)
      if (savedAnnotations) {
        try {
          const parsed = JSON.parse(savedAnnotations)
          setAnnotations(parsed)
          setHasAnnotations(parsed.length > 0)
        } catch (error) {
          console.error('Error loading annotations:', error)
        }
      }
    }
    
    if (initialAnnotationData) {
      try {
        const parsed = JSON.parse(initialAnnotationData)
        setAnnotations(parsed)
        setHasAnnotations(parsed.length > 0)
      } catch (error) {
        console.error('Error parsing initial annotations:', error)
      }
    }
  }, [initialAnnotationData, isClient, src])

  // Автоматически открываем редактор при загрузке изображения
  useEffect(() => {
    if (isClient && imageRef.current && !isEditing) {
      const timer = setTimeout(() => {
        startAnnotation()
      }, 1000)
      
      return () => clearTimeout(timer)
    }
  }, [isClient, isEditing])

  const startAnnotation = () => {
    setIsEditing(true)
    drawAnnotations()
  }

  const drawAnnotations = useCallback(() => {
    const canvas = canvasRef.current
    const image = imageRef.current
    if (!canvas || !image) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Рисуем аннотации
    annotations.forEach(annotation => {
      ctx.strokeStyle = annotation.color
      ctx.lineWidth = 2
      ctx.fillStyle = annotation.color + '20'

      switch (annotation.type) {
        case 'rectangle':
          ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height)
          ctx.fillRect(annotation.x, annotation.y, annotation.width, annotation.height)
          break
        case 'circle':
          ctx.beginPath()
          ctx.arc(
            annotation.x + annotation.width / 2,
            annotation.y + annotation.height / 2,
            Math.min(annotation.width, annotation.height) / 2,
            0,
            2 * Math.PI
          )
          ctx.stroke()
          ctx.fill()
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

  const drawArrow = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    const { x, y, width, height } = annotation
    const headLength = 20
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
    if (!isEditing) return

    const canvas = canvasRef.current
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    
    // Вычисляем координаты относительно Canvas
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top

    console.log('Mouse down:', { x, y })

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
    if (!canvas) return

    const canvasRect = canvas.getBoundingClientRect()
    
    // Вычисляем координаты относительно Canvas
    const x = e.clientX - canvasRect.left
    const y = e.clientY - canvasRect.top

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

  const saveAnnotations = () => {
    const data = JSON.stringify(annotations)
    onAnnotationSave?.(data)
    
    if (isClient) {
      const storageKey = `canvas-annotations-${src}`
      localStorage.setItem(storageKey, data)
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
      const storageKey = `canvas-annotations-${src}`
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
    if (!canvas || !image) return

    const rect = image.getBoundingClientRect()
    
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
    
    // Масштабируем координаты существующих аннотаций
    if (annotations.length > 0) {
      const scaleX = rect.width / image.naturalWidth
      const scaleY = rect.height / image.naturalHeight
      
      const scaledAnnotations = annotations.map(annotation => ({
        ...annotation,
        x: annotation.x * scaleX,
        y: annotation.y * scaleY,
        width: annotation.width * scaleX,
        height: annotation.height * scaleY
      }))
      
      setAnnotations(scaledAnnotations)
    }
    
    console.log('Canvas size updated:', rect.width, 'x', rect.height)
    drawAnnotations()
  }

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current
      if (img.complete) {
        updateCanvasSize()
      } else {
        img.addEventListener('load', updateCanvasSize)
      }
    }
  }, [drawAnnotations])

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
          </>
        )}
      </div>

      {/* Индикатор аннотаций */}
      {hasAnnotations && !isEditing && (
        <div className="mt-2 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            ✓ {annotations.length} аннотаций сохранено
          </span>
        </div>
      )}
    </div>
  )
}
