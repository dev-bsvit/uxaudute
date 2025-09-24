'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Loader2,
  RefreshCw,
  FileText,
  Globe
} from 'lucide-react'
import { useLanguageInitialization } from '@/hooks/use-language-initialization'
import { useBrowserLanguageDetection } from '@/hooks/use-browser-language-detection'
import { useLanguageReadiness } from '@/hooks/use-language-readiness'

/**
 * Компонент для тестирования инициализации языка (только в режиме разработки)
 */
export function LanguageInitializationTest() {
  const initialization = useLanguageInitialization()
  const detection = useBrowserLanguageDetection()
  const readiness = useLanguageReadiness()
  const [testResults, setTestResults] = useState<string[]>([])

  // Скрываем в продакшене
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const runFullTest = async () => {
    setTestResults([])
    addTestResult('🚀 Начинаем полный тест инициализации языка')

    try {
      // 1. Тест определения языка
      addTestResult('🔍 Тестируем определение языка...')
      const detectionResult = await detection.detectLanguage()
      addTestResult(`✅ Язык определен: ${detectionResult.language} (источник: ${detectionResult.source}, уверенность: ${(detectionResult.confidence * 100).toFixed(0)}%)`)

      // 2. Тест инициализации
      addTestResult('⚡ Тестируем быструю инициализацию...')
      const quickInitResult = await initialization.quickInitialize()
      addTestResult(`✅ Быстрая инициализация завершена за ${quickInitResult.initializationTime}ms`)

      // 3. Тест полной инициализации
      addTestResult('🎯 Тестируем полную инициализацию...')
      const fullInitResult = await initialization.initialize()
      addTestResult(`✅ Полная инициализация завершена за ${fullInitResult.initializationTime}ms`)

      // 4. Тест готовности
      addTestResult('🔍 Проверяем готовность системы...')
      const readinessResult = await readiness.checkReadiness()
      addTestResult(`${readinessResult.isReady ? '✅' : '❌'} Система ${readinessResult.isReady ? 'готова' : 'не готова'}`)

      if (readinessResult.errors.length > 0) {
        addTestResult(`⚠️ Ошибки: ${readinessResult.errors.join(', ')}`)
      }

      if (readinessResult.warnings.length > 0) {
        addTestResult(`⚠️ Предупреждения: ${readinessResult.warnings.join(', ')}`)
      }

      addTestResult('🎉 Тест завершен успешно!')

    } catch (error) {
      addTestResult(`❌ Ошибка теста: ${error}`)
    }
  }

  const runQuickTest = async () => {
    setTestResults([])
    addTestResult('⚡ Быстрый тест инициализации')

    try {
      const isReady = await readiness.quickCheck()
      addTestResult(`${isReady ? '✅' : '❌'} Система ${isReady ? 'готова' : 'не готова'}`)
    } catch (error) {
      addTestResult(`❌ Ошибка: ${error}`)
    }
  }

  const generateReport = async () => {
    try {
      const report = await readiness.generateReport()
      const blob = new Blob([report], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `language-readiness-report-${new Date().toISOString().slice(0, 19)}.json`
      a.click()
      URL.revokeObjectURL(url)
      addTestResult('📄 Отчет сохранен')
    } catch (error) {
      addTestResult(`❌ Ошибка генерации отчета: ${error}`)
    }
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full mx-4">
      <Card className="bg-white border shadow-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            <span>Language Initialization Test</span>
            <div className="ml-auto flex gap-1">
              {initialization.isInitialized && <Badge variant="outline" className="text-green-600">Initialized</Badge>}
              {readiness.isReady && <Badge variant="outline" className="text-blue-600">Ready</Badge>}
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Статус */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex items-center gap-1">
              {initialization.isInitializing ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              ) : initialization.isInitialized ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span>Инициализация</span>
            </div>
            
            <div className="flex items-center gap-1">
              {detection.isDetecting ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              ) : detection.detectionResult ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span>Определение</span>
            </div>
            
            <div className="flex items-center gap-1">
              {readiness.isChecking ? (
                <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
              ) : readiness.isReady ? (
                <CheckCircle className="h-3 w-3 text-green-600" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              <span>Готовность</span>
            </div>
          </div>

          {/* Кнопки управления */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runQuickTest}
              disabled={readiness.isChecking}
              className="flex-1"
            >
              <Play className="h-3 w-3 mr-1" />
              Быстрый тест
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={runFullTest}
              disabled={initialization.isInitializing || readiness.isChecking}
              className="flex-1"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Полный тест
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={generateReport}
              className="px-3"
            >
              <FileText className="h-3 w-3" />
            </Button>
          </div>

          {/* Результаты тестов */}
          {testResults.length > 0 && (
            <div className="bg-gray-50 rounded p-3 max-h-40 overflow-y-auto">
              <div className="text-xs font-medium mb-2">Результаты тестов:</div>
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono text-gray-700">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Информация о текущем состоянии */}
          {(initialization.initializationResult || detection.detectionResult) && (
            <div className="text-xs space-y-1 bg-blue-50 p-2 rounded">
              {detection.detectionResult && (
                <div>
                  <strong>Определение:</strong> {detection.detectionResult.language} 
                  ({detection.detectionResult.source}, {(detection.detectionResult.confidence * 100).toFixed(0)}%)
                </div>
              )}
              {initialization.initializationResult && (
                <div>
                  <strong>Инициализация:</strong> {initialization.initializationResult.initializationTime}ms
                  {initialization.initializationResult.errors.length > 0 && (
                    <span className="text-red-600"> ({initialization.initializationResult.errors.length} ошибок)</span>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}