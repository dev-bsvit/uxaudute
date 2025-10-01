'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Upload, X, Check, AlertCircle } from 'lucide-react'

interface ImageUploadProps {
  onImageSelect?: (file: File) => void
  onImageUpload?: (file: File) => Promise<void>
  maxSize?: number
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  onImageSelect,
  onImageUpload,
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  className,
  disabled = false,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = React.useState(false)
  const [uploading, setUploading] = React.useState(false)
  const [uploadProgress, setUploadProgress] = React.useState(0)
  const [error, setError] = React.useState<string | null>(null)
  const [success, setSuccess] = React.useState(false)
  const [preview, setPreview] = React.useState<string | null>(null)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [open, setOpen] = React.useState(false)

  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleFile = (file: File) => {
    setError(null)
    setSuccess(false)

    // Validate file type
    if (!acceptedTypes.includes(file.type)) {
      setError(`Неподдерживаемый формат файла. Разрешены: ${acceptedTypes.join(', ')}`)
      return
    }

    // Validate file size
    if (file.size > maxSize) {
      setError(`Файл слишком большой. Максимальный размер: ${Math.round(maxSize / 1024 / 1024)}MB`)
      return
    }

    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
    onImageSelect?.(file)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()
    if (disabled) return

    const files = e.target.files
    if (files && files[0]) {
      handleFile(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !onImageUpload) return

    setUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + Math.random() * 30
        })
      }, 200)

      await onImageUpload(selectedFile)
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      setSuccess(true)
      
      setTimeout(() => {
        setOpen(false)
        setUploading(false)
        setUploadProgress(0)
        setSuccess(false)
        setSelectedFile(null)
        setPreview(null)
        if (inputRef.current) {
          inputRef.current.value = ''
        }
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла')
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
    setPreview(null)
    setError(null)
    setSuccess(false)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed p-6 transition-colors flex items-center justify-center',
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-red-300 bg-red-50'
        )}
        style={{ minHeight: '190px', borderRadius: '16px' }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleChange}
          disabled={disabled}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        <div className="text-center">
          {preview ? (
            <div className="space-y-4">
              <div className="relative inline-block">
                <img
                  src={preview}
                  alt="Preview"
                  className="max-h-32 max-w-full rounded-lg object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={removeFile}
                  disabled={uploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-gray-500">
                  {selectedFile && Math.round(selectedFile.size / 1024)} KB
                </p>
              </div>

              {onImageUpload && (
                <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                          Загружаем...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4 mr-2" />
                          Загрузить изображение
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  
                  <DialogContent className="sm:max-w-md" aria-describedby="image-upload-description">
                    <DialogHeader>
                      <DialogTitle>Загрузка изображения</DialogTitle>
                      <DialogDescription id="image-upload-description">
                        Выберите изображение для загрузки и анализа
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      {uploading && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Загружаем...</span>
                            <span>{Math.round(uploadProgress)}%</span>
                          </div>
                          <Progress value={uploadProgress} className="w-full" />
                        </div>
                      )}
                      
                      {success && (
                        <div className="flex items-center space-x-2 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>Изображение успешно загружено!</span>
                        </div>
                      )}
                      
                      {error && (
                        <div className="flex items-center space-x-2 text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-900">
                  Перетащите изображение сюда
                </p>
                <p className="text-xs text-gray-500">
                  или нажмите для выбора файла
                </p>
              </div>
              
              <p className="text-xs text-gray-400">
                PNG, JPG, GIF, WebP до {Math.round(maxSize / 1024 / 1024)}MB
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-2 flex items-center space-x-1 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
