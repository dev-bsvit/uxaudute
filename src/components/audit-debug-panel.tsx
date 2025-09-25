'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Copy, Eye, EyeOff, Code, FileText } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface AuditDebugPanelProps {
  auditId: string
  auditData: any
}

export function AuditDebugPanel({ auditId, auditData }: AuditDebugPanelProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [promptData, setPromptData] = useState<string>('')
  const [responseData, setResponseData] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  // Загружаем отладочную информацию
  const loadDebugData = async () => {
    setLoading(true)
    try {
      // Получаем данные аудита из базы
      const { data: audit, error } = await supabase
        .from('audits')
        .select('*')
        .eq('id', auditId)
        .single()

      if (error) {
        console.error('Ошибка загрузки аудита:', error)
        return
      }

      setDebugInfo(audit)

      // Загружаем реальный промпт, который использовался для анализа
      try {
        const language = audit.input_data?.language || 'ru'
        const analysisType = audit.input_data?.analysisType || 'json'
        
        // Определяем тип промпта на основе типа анализа
        let promptPath = ''
        if (analysisType === 'json' || analysisType === 'structured') {
          promptPath = `/prompts/${language}/json-structured-prompt.md`
        } else if (analysisType === 'sonoma') {
          promptPath = `/prompts/${language}/sonoma-structured-prompt.md`
        } else {
          promptPath = `/prompts/${language}/main-prompt.md`
        }

        // Загружаем промпт
        const promptResponse = await fetch(promptPath)
        if (promptResponse.ok) {
          const promptContent = await promptResponse.text()
          
          // Формируем полный промпт как он отправляется в AI
          let fullPrompt = `**SYSTEM PROMPT (${promptPath}):**\n\n${promptContent}\n\n`
          
          // Добавляем контекст если есть
          if (audit.input_data?.context) {
            fullPrompt += `**CONTEXT:**\n${audit.input_data.context}\n\n`
          }
          
          // Добавляем инструкцию для анализа
          if (audit.input_data?.url) {
            fullPrompt += `**TASK:**\nПроанализируй сайт по URL: ${audit.input_data.url}\n\nПоскольку я не могу получить скриншот, проведи анализ основываясь на общих принципах UX для данного типа сайта.`
          } else if (audit.input_data?.screenshotUrl) {
            fullPrompt += `**TASK:**\nПроанализируй интерфейс на прикрепленном изображении.\n\n**IMAGE URL:**\n${audit.input_data.screenshotUrl}`
          }
          
          setPromptData(fullPrompt)
        } else {
          // Fallback если промпт не найден
          const inputInfo = []
          if (audit.input_data?.url) inputInfo.push(`URL: ${audit.input_data.url}`)
          if (audit.input_data?.screenshotUrl) inputInfo.push(`Screenshot: ${audit.input_data.screenshotUrl}`)
          if (audit.input_data?.analysisType) inputInfo.push(`Analysis Type: ${audit.input_data.analysisType}`)
          if (audit.input_data?.language) inputInfo.push(`Language: ${audit.input_data.language}`)
          
          setPromptData(`**INPUT DATA:**\n${inputInfo.join('\n')}\n\n**ERROR:**\nНе удалось загрузить промпт из ${promptPath}\n\n**INPUT DATA STRUCTURE:**\n${JSON.stringify(audit.input_data, null, 2)}`)
        }
      } catch (promptError) {
        console.error('Ошибка загрузки промпта:', promptError)
        setPromptData(`**ERROR LOADING PROMPT:**\n${promptError}\n\n**INPUT DATA:**\n${JSON.stringify(audit.input_data, null, 2)}`)
      }

      // Извлекаем ответ от OpenAI из result_data
      if (audit.result_data) {
        let responseText = `**OPENAI RESPONSE:**\n\n`
        
        if (typeof audit.result_data === 'string') {
          // Если это строка, показываем как есть и пытаемся распарсить
          responseText += `**RAW STRING:**\n${audit.result_data}\n\n`
          try {
            const parsed = JSON.parse(audit.result_data)
            responseText += `**PARSED JSON:**\n${JSON.stringify(parsed, null, 2)}`
          } catch {
            responseText += `**PARSE ERROR:** Не удалось распарсить как JSON`
          }
        } else if (audit.result_data.content) {
          // Если есть content (старый формат)
          responseText += `**CONTENT FIELD:**\n${audit.result_data.content}\n\n`
          try {
            const parsed = JSON.parse(audit.result_data.content)
            responseText += `**PARSED CONTENT:**\n${JSON.stringify(parsed, null, 2)}`
          } catch {
            responseText += `**PARSE ERROR:** Content не является валидным JSON`
          }
        } else {
          // Если это уже объект
          responseText += `**STRUCTURED OBJECT:**\n${JSON.stringify(audit.result_data, null, 2)}`
        }
        
        // Добавляем информацию о размере ответа
        const dataSize = JSON.stringify(audit.result_data).length
        responseText += `\n\n**METADATA:**\n- Response size: ${dataSize} characters\n- Data type: ${typeof audit.result_data}\n- Has content field: ${audit.result_data.content ? 'Yes' : 'No'}`
        
        setResponseData(responseText)
      } else {
        setResponseData('**ERROR:** Ответ не найден в result_data\n\nВозможные причины:\n- Анализ не завершен\n- Ошибка при сохранении\n- Анализ в процессе выполнения')
      }

    } catch (error) {
      console.error('Ошибка загрузки отладочных данных:', error)
    } finally {
      setLoading(false)
    }
  }

  // Копирование в буфер обмена
  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${type} скопирован в буфер обмена!`)
    } catch (error) {
      console.error('Ошибка копирования:', error)
      alert('Ошибка копирования в буфер обмена')
    }
  }

  // Загружаем данные при открытии панели
  useEffect(() => {
    if (isVisible && !debugInfo) {
      loadDebugData()
    }
  }, [isVisible])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-white shadow-lg border-2 border-blue-200 hover:border-blue-400"
        >
          <Code className="w-4 h-4 mr-2" />
          Debug Panel
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Заголовок */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Debug Panel - Audit {auditId}</h2>
            {debugInfo && (
              <Badge variant="outline">
                {debugInfo.status}
              </Badge>
            )}
          </div>
          <Button
            onClick={() => setIsVisible(false)}
            variant="outline"
            size="sm"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Закрыть
          </Button>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
            </div>
          ) : (
            <Tabs defaultValue="prompt-response" className="h-full flex flex-col">
              <TabsList className="mx-4 mt-4">
                <TabsTrigger value="prompt-response">Промпт и Ответ</TabsTrigger>
                <TabsTrigger value="raw-data">Сырые данные</TabsTrigger>
                <TabsTrigger value="metadata">Метаданные</TabsTrigger>
              </TabsList>

              <TabsContent value="prompt-response" className="flex-1 p-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Промпт */}
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Промпт
                        </CardTitle>
                        <Button
                          onClick={() => copyToClipboard(promptData, 'Промпт')}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {promptData}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Ответ */}
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          Ответ
                        </CardTitle>
                        <Button
                          onClick={() => copyToClipboard(responseData, 'Ответ')}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {responseData}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="raw-data" className="flex-1 p-4 overflow-hidden">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Input Data */}
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Input Data</CardTitle>
                        <Button
                          onClick={() => copyToClipboard(
                            JSON.stringify(debugInfo?.input_data, null, 2), 
                            'Input Data'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {JSON.stringify(debugInfo?.input_data, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Result Data */}
                  <Card className="flex flex-col h-full">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle>Result Data</CardTitle>
                        <Button
                          onClick={() => copyToClipboard(
                            JSON.stringify(debugInfo?.result_data, null, 2), 
                            'Result Data'
                          )}
                          variant="outline"
                          size="sm"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden">
                      <div className="h-full overflow-auto bg-gray-50 rounded-lg p-4">
                        <pre className="text-sm whitespace-pre-wrap font-mono">
                          {JSON.stringify(debugInfo?.result_data, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="metadata" className="flex-1 p-4 overflow-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>Метаданные аудита</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">ID аудита</label>
                          <p className="font-mono text-sm bg-gray-100 p-2 rounded">{debugInfo?.id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Название</label>
                          <p className="text-sm">{debugInfo?.name}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Тип</label>
                          <p className="text-sm">{debugInfo?.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Статус</label>
                          <Badge variant={debugInfo?.status === 'completed' ? 'default' : 'secondary'}>
                            {debugInfo?.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Создан</label>
                          <p className="text-sm">{debugInfo?.created_at ? new Date(debugInfo.created_at).toLocaleString('ru-RU') : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Обновлен</label>
                          <p className="text-sm">{debugInfo?.updated_at ? new Date(debugInfo.updated_at).toLocaleString('ru-RU') : 'N/A'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Проект ID</label>
                          <p className="font-mono text-sm bg-gray-100 p-2 rounded">{debugInfo?.project_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Пользователь ID</label>
                          <p className="font-mono text-sm bg-gray-100 p-2 rounded">{debugInfo?.user_id}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">API Endpoint</label>
                          <p className="text-sm">{debugInfo?.input_data?.analysisType === 'json' ? '/api/research-json' : '/api/research'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Язык анализа</label>
                          <p className="text-sm">{debugInfo?.input_data?.language || 'ru'}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Футер */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              💡 Используйте этот панель для отладки промптов и анализа ответов
            </div>
            <Button
              onClick={loadDebugData}
              variant="outline"
              size="sm"
              disabled={loading}
            >
              🔄 Обновить данные
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}