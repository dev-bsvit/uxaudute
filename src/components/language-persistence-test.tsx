'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  RefreshCw, 
  Save, 
  Trash2,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { useLanguage } from '@/hooks/use-language'

/**
 * Компонент для тестирования сохранения языка (только в режиме разработки)
 */
export function LanguagePersistenceTest() {
  const { currentLanguage, switchLanguage, availableLanguages } = useLanguage()
  const [savedLanguage, setSavedLanguage] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<string[]>([])

  // Скрываем в продакшене
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  useEffect(() => {
    checkSavedLanguage()
  }, [])

  const checkSavedLanguage = () => {
    try {
      const saved = localStorage.getItem('preferred_language')
      setSavedLanguage(saved)
      addTestResult(`📱 Saved language: ${saved || 'none'}`)
    } catch (error) {
      addTestResult(`❌ Error reading localStorage: ${error}`)
    }
  }

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev.slice(-4), `${new Date().toLocaleTimeString()}: ${result}`])
  }

  const testLanguageSwitch = async (language: string) => {
    addTestResult(`🔄 Testing switch to: ${language}`)
    try {
      const result = await switchLanguage(language)
      if (result.success) {
        addTestResult(`✅ Switch successful: ${language}`)
        checkSavedLanguage()
      } else {
        addTestResult(`❌ Switch failed: ${result.error}`)
      }
    } catch (error) {
      addTestResult(`❌ Switch error: ${error}`)
    }
  }

  const clearSavedLanguage = () => {
    try {
      localStorage.removeItem('preferred_language')
      addTestResult(`🗑️ Cleared saved language`)
      checkSavedLanguage()
    } catch (error) {
      addTestResult(`❌ Error clearing localStorage: ${error}`)
    }
  }

  const testPersistence = () => {
    addTestResult(`🧪 Testing persistence...`)
    checkSavedLanguage()
    
    // Проверяем соответствие текущего языка и сохраненного
    const saved = localStorage.getItem('preferred_language')
    if (saved === currentLanguage) {
      addTestResult(`✅ Language persistence working correctly`)
    } else {
      addTestResult(`❌ Mismatch: current=${currentLanguage}, saved=${saved}`)
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm">
      <Card className="bg-gray-900 text-white border-gray-700 shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Save className="h-4 w-4" />
            <span>Language Persistence Test</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Текущее состояние */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Current:</span>
              <Badge variant="outline" className="text-white border-gray-600">
                {currentLanguage.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Saved:</span>
              <div className="flex items-center gap-1">
                {savedLanguage === currentLanguage ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span className="font-mono">
                  {savedLanguage || 'none'}
                </span>
              </div>
            </div>
          </div>

          {/* Кнопки тестирования */}
          <div className="grid grid-cols-2 gap-1">
            {availableLanguages.slice(0, 2).map(lang => (
              <Button
                key={lang.code}
                variant="outline"
                size="sm"
                onClick={() => testLanguageSwitch(lang.code)}
                className="h-7 text-xs border-gray-600 text-gray-300 hover:text-white"
                disabled={lang.code === currentLanguage}
              >
                {lang.flag} {lang.code}
              </Button>
            ))}
          </div>

          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={testPersistence}
              className="flex-1 h-7 text-xs border-gray-600 text-gray-300 hover:text-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Test
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={clearSavedLanguage}
              className="h-7 px-2 border-gray-600 text-gray-300 hover:text-white"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>

          {/* Результаты тестов */}
          {testResults.length > 0 && (
            <div className="bg-gray-800 rounded p-2 max-h-24 overflow-y-auto">
              <div className="space-y-1">
                {testResults.map((result, index) => (
                  <div key={index} className="text-xs font-mono text-gray-300">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}