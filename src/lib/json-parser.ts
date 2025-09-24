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

  try {
    // Сначала пытаемся обычный парсинг
    const parsed = JSON.parse(jsonString)
    console.log('✅ JSON parsed successfully')
    return parsed
  } catch (error) {
    console.warn('⚠️ JSON parsing failed, attempting recovery...', error)
    
    // Пытаемся восстановить обрезанный JSON
    const recovered = recoverTruncatedJSON(jsonString)
    if (recovered) {
      try {
        const parsed = JSON.parse(recovered)
        console.log('✅ JSON recovered and parsed successfully')
        return parsed
      } catch (recoveryError) {
        console.warn('❌ JSON recovery failed', recoveryError)
      }
    }
    
    // Если восстановление не удалось, создаем fallback объект
    console.log('🔄 Creating fallback object from partial JSON')
    return createFallbackFromPartialJSON(jsonString)
  }
}

/**
 * Пытается восстановить обрезанный JSON
 */
function recoverTruncatedJSON(jsonString: string): string | null {
  try {
    let recovered = jsonString.trim()
    
    // Удаляем незакрытые кавычки в конце
    if (recovered.endsWith('"')) {
      recovered = recovered.slice(0, -1)
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
    // Ищем screenDescription
    const screenDescMatch = jsonString.match(/"screenDescription":\s*({[^}]*})/)
    if (screenDescMatch) {
      try {
        result.screenDescription = JSON.parse(screenDescMatch[1])
      } catch (e) {
        console.warn('Failed to parse screenDescription')
      }
    }
    
    // Ищем uxSurvey
    const surveyMatch = jsonString.match(/"uxSurvey":\s*({.*?"overallConfidence":\s*\d+[^}]*})/)
    if (surveyMatch) {
      try {
        result.uxSurvey = JSON.parse(surveyMatch[1])
      } catch (e) {
        console.warn('Failed to parse uxSurvey')
      }
    }
    
    // Ищем audience
    const audienceMatch = jsonString.match(/"audience":\s*({[^}]*})/)
    if (audienceMatch) {
      try {
        result.audience = JSON.parse(audienceMatch[1])
      } catch (e) {
        console.warn('Failed to parse audience')
      }
    }
    
    // Ищем problemsAndSolutions
    const problemsMatch = jsonString.match(/"problemsAndSolutions":\s*(\[[^\]]*\])/)
    if (problemsMatch) {
      try {
        result.problemsAndSolutions = JSON.parse(problemsMatch[1])
      } catch (e) {
        console.warn('Failed to parse problemsAndSolutions')
      }
    }
    
  } catch (error) {
    console.warn('Error extracting partial data:', error)
  }
  
  return result
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