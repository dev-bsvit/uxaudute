/**
 * Утилиты для безопасного парсинга JSON с восстановлением
 */

import { StructuredAnalysisResponse } from './analysis-types'

/**
 * Пытается распарсить JSON с восстановлением обрезанных данных
 */
export function safeParseJSON(jsonString: string): StructuredAnalysisResponse | null {
  if (!jsonString || typeof jsonString !== 'string') {
    console.warn('Invalid JSON string provided')
    return null
  }

  // Очищаем строку от лишних символов
  const cleanedString = cleanJSONString(jsonString)
  
  try {
    // Сначала пытаемся обычный парсинг
    const parsed = JSON.parse(cleanedString)
    console.log('✅ JSON parsed successfully')
    return validateAndFixStructure(parsed)
  } catch (error) {
    console.warn('⚠️ JSON parsing failed, attempting recovery...', error)
    
    // Пытаемся восстановить обрезанный JSON
    const recovered = recoverTruncatedJSON(cleanedString)
    if (recovered) {
      try {
        const parsed = JSON.parse(recovered)
        console.log('✅ JSON recovered and parsed successfully')
        return validateAndFixStructure(parsed)
      } catch (recoveryError) {
        console.warn('❌ JSON recovery failed', recoveryError)
      }
    }
    
    // Если восстановление не удалось, создаем fallback объект
    console.log('🔄 Creating fallback object from partial JSON')
    return createFallbackFromPartialJSON(cleanedString)
  }
}

/**
 * Очищает JSON строку от лишних символов и форматирования
 */
function cleanJSONString(jsonString: string): string {
  return jsonString
    .trim()
    // Убираем возможные markdown блоки
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    // Убираем лишние пробелы и переносы строк в начале и конце
    .replace(/^\s+|\s+$/g, '')
}

/**
 * Проверяет и исправляет структуру распарсенного объекта
 */
function validateAndFixStructure(parsed: any): StructuredAnalysisResponse {
  if (!parsed || typeof parsed !== 'object') {
    return createFallbackFromPartialJSON('')
  }

  // Создаем базовую структуру с fallback значениями
  const result: StructuredAnalysisResponse = {
    screenDescription: parsed.screenDescription || {
      screenType: 'Неизвестно',
      userGoal: 'Не удалось определить',
      keyElements: [],
      confidence: 0,
      confidenceReason: 'Данные не загружены'
    },
    uxSurvey: parsed.uxSurvey || {
      questions: [],
      overallConfidence: 0,
      summary: {
        totalQuestions: 0,
        averageConfidence: 0,
        criticalIssues: 0,
        recommendations: []
      }
    },
    audience: parsed.audience || {
      targetAudience: 'Не удалось определить',
      mainPain: 'Данные недоступны',
      fears: []
    },
    behavior: parsed.behavior || {
      userScenarios: {
        idealPath: 'Не удалось определить',
        typicalError: 'Не удалось определить',
        alternativeWorkaround: 'Не удалось определить'
      },
      behavioralPatterns: 'Данные недоступны',
      frictionPoints: [],
      actionMotivation: 'Не удалось определить'
    },
    problemsAndSolutions: parsed.problemsAndSolutions || [],
    selfCheck: parsed.selfCheck || {
      checklist: {
        coversAllElements: false,
        noContradictions: false,
        principlesJustified: false,
        actionClarity: false
      },
      confidence: {
        analysis: 0,
        survey: 0,
        recommendations: 0
      }
    },
    metadata: parsed.metadata || {
      timestamp: new Date().toISOString(),
      version: '1.0',
      model: 'unknown'
    }
  }

  // Исправляем возможные проблемы в данных
  if (result.screenDescription && typeof result.screenDescription === 'object') {
    result.screenDescription.keyElements = Array.isArray(result.screenDescription.keyElements) 
      ? result.screenDescription.keyElements 
      : []
    result.screenDescription.confidence = typeof result.screenDescription.confidence === 'number' 
      ? result.screenDescription.confidence 
      : 0
  }

  if (result.uxSurvey && typeof result.uxSurvey === 'object') {
    result.uxSurvey.questions = Array.isArray(result.uxSurvey.questions) 
      ? result.uxSurvey.questions 
      : []
  }

  if (result.audience && typeof result.audience === 'object') {
    result.audience.fears = Array.isArray(result.audience.fears) 
      ? result.audience.fears 
      : []
  }

  if (result.behavior && typeof result.behavior === 'object') {
    result.behavior.frictionPoints = Array.isArray(result.behavior.frictionPoints) 
      ? result.behavior.frictionPoints 
      : []
  }

  result.problemsAndSolutions = Array.isArray(result.problemsAndSolutions) 
    ? result.problemsAndSolutions 
    : []

  return result
}

/**
 * Пытается восстановить обрезанный JSON
 */
function recoverTruncatedJSON(jsonString: string): string | null {
  try {
    let recovered = jsonString.trim()
    
    // Если JSON заканчивается на запятую, удаляем её
    if (recovered.endsWith(',')) {
      recovered = recovered.slice(0, -1)
    }
    
    // Если JSON заканчивается на незакрытую кавычку, удаляем её
    if (recovered.endsWith('"') && !recovered.endsWith('""')) {
      // Проверяем, что это действительно незакрытая кавычка
      const lastQuoteIndex = recovered.lastIndexOf('"')
      if (lastQuoteIndex > 0) {
        const beforeQuote = recovered[lastQuoteIndex - 1]
        if (beforeQuote !== '\\' && beforeQuote !== '"') {
          recovered = recovered.slice(0, -1)
        }
      }
    }
    
    // Подсчитываем открытые скобки и кавычки
    let openBraces = 0
    let openBrackets = 0
    let inString = false
    let escapeNext = false
    
    for (let i = 0; i < recovered.length; i++) {
      const char = recovered[i]
      
      if (escapeNext) {
        escapeNext = false
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        continue
      }
      
      if (!inString) {
        if (char === '{') openBraces++
        else if (char === '}') openBraces--
        else if (char === '[') openBrackets++
        else if (char === ']') openBrackets--
      }
    }
    
    // Закрываем незакрытые строки
    if (inString) {
      recovered += '"'
    }
    
    // Закрываем незакрытые массивы
    while (openBrackets > 0) {
      recovered += ']'
      openBrackets--
    }
    
    // Закрываем незакрытые объекты
    while (openBraces > 0) {
      recovered += '}'
      openBraces--
    }
    
    return recovered
  } catch (error) {
    console.warn('Error during JSON recovery:', error)
    return null
  }
}

/**
 * Создает fallback объект из частичного JSON
 */
function createFallbackFromPartialJSON(jsonString: string): StructuredAnalysisResponse {
  const fallback: StructuredAnalysisResponse = {
    screenDescription: {
      screenType: 'Неизвестно',
      userGoal: 'Данные недоступны',
      keyElements: [],
      confidence: 0,
      confidenceReason: 'Данные не были получены'
    },
    uxSurvey: {
      questions: [],
      overallConfidence: 0,
      summary: {
        totalQuestions: 0,
        averageConfidence: 0,
        criticalIssues: 0,
        recommendations: []
      }
    },
    audience: {
      targetAudience: 'Данные недоступны',
      mainPain: 'Данные недоступны',
      fears: []
    },
    behavior: {
      userScenarios: {
        idealPath: 'Данные недоступны',
        typicalError: 'Данные недоступны',
        alternativeWorkaround: 'Данные недоступны'
      },
      behavioralPatterns: 'Данные недоступны',
      frictionPoints: [],
      actionMotivation: 'Данные недоступны'
    },
    problemsAndSolutions: [],
    selfCheck: {
      checklist: {
        coversAllElements: false,
        noContradictions: false,
        principlesJustified: false,
        actionClarity: false
      },
      confidence: {
        analysis: 0,
        survey: 0,
        recommendations: 0
      }
    },
    metadata: {
      timestamp: new Date().toISOString(),
      version: '1.0',
      model: 'fallback'
    }
  }

  try {
    // Пытаемся извлечь хотя бы частичные данные
    const partialData = extractPartialData(jsonString)
    
    // Объединяем с fallback данными
    return {
      ...fallback,
      ...partialData
    }
  } catch (error) {
    console.warn('Error creating fallback object:', error)
    return fallback
  }
}

/**
 * Извлекает частичные данные из поврежденного JSON
 */
function extractPartialData(jsonString: string): Partial<StructuredAnalysisResponse> {
  const result: Partial<StructuredAnalysisResponse> = {}
  
  try {
    // Пытаемся найти и извлечь основные блоки данных
    const sections = [
      'screenDescription',
      'uxSurvey', 
      'audience',
      'behavior',
      'problemsAndSolutions',
      'selfCheck'
    ]
    
    for (const section of sections) {
      const extracted = extractJSONSection(jsonString, section)
      if (extracted) {
        result[section as keyof StructuredAnalysisResponse] = extracted
      }
    }
    
  } catch (error) {
    console.warn('Error extracting partial data:', error)
  }
  
  return result
}

/**
 * Извлекает конкретную секцию из JSON строки
 */
function extractJSONSection(jsonString: string, sectionName: string): any {
  try {
    // Ищем начало секции
    const sectionStart = jsonString.indexOf(`"${sectionName}":`)
    if (sectionStart === -1) return null
    
    // Находим начало значения
    const valueStart = jsonString.indexOf(':', sectionStart) + 1
    let pos = valueStart
    
    // Пропускаем пробелы
    while (pos < jsonString.length && /\s/.test(jsonString[pos])) {
      pos++
    }
    
    if (pos >= jsonString.length) return null
    
    const startChar = jsonString[pos]
    let endPos = pos
    let depth = 0
    let inString = false
    let escapeNext = false
    
    // Определяем тип значения и находим его конец
    if (startChar === '{' || startChar === '[') {
      const openChar = startChar
      const closeChar = startChar === '{' ? '}' : ']'
      
      for (let i = pos; i < jsonString.length; i++) {
        const char = jsonString[i]
        
        if (escapeNext) {
          escapeNext = false
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          continue
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString
          continue
        }
        
        if (!inString) {
          if (char === openChar) {
            depth++
          } else if (char === closeChar) {
            depth--
            if (depth === 0) {
              endPos = i + 1
              break
            }
          }
        }
      }
      
      if (depth === 0) {
        const sectionJSON = jsonString.substring(pos, endPos)
        return JSON.parse(sectionJSON)
      }
    }
    
    return null
  } catch (error) {
    console.warn(`Failed to extract section ${sectionName}:`, error)
    return null
  }
}

/**
 * Проверяет, является ли объект валидным StructuredAnalysisResponse
 */
export function validateAnalysisResponse(obj: any): obj is StructuredAnalysisResponse {
  if (!obj || typeof obj !== 'object') return false
  
  // Проверяем наличие основных полей
  const requiredFields = ['screenDescription', 'uxSurvey', 'audience', 'behavior', 'problemsAndSolutions']
  
  for (const field of requiredFields) {
    if (!(field in obj)) {
      console.warn(`Missing required field: ${field}`)
      return false
    }
  }
  
  return true
}

/**
 * Безопасно получает значение из объекта с fallback
 */
export function safeGet<T>(obj: any, path: string, fallback: T): T {
  try {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key]
      } else {
        return fallback
      }
    }
    
    return current !== undefined ? current : fallback
  } catch (error) {
    console.warn(`Error getting path ${path}:`, error)
    return fallback
  }
}