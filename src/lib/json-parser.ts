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
    console.log('🔧 Attempting to recover JSON, length:', recovered.length)
    console.log('🔧 Last 100 chars:', recovered.slice(-100))
    
    // Если JSON заканчивается на запятую, удаляем её
    if (recovered.endsWith(',')) {
      recovered = recovered.slice(0, -1)
      console.log('🔧 Removed trailing comma')
    }
    
    // Если JSON заканчивается на незакрытую кавычку в середине значения
    if (recovered.endsWith('"') && !recovered.endsWith('""') && !recovered.endsWith('"}') && !recovered.endsWith('"]')) {
      // Проверяем, что это действительно незакрытая кавычка в значении
      const lastQuoteIndex = recovered.lastIndexOf('"')
      if (lastQuoteIndex > 0) {
        const beforeQuote = recovered[lastQuoteIndex - 1]
        // Если перед кавычкой не двоеточие и не запятая, это незакрытое значение
        if (beforeQuote !== ':' && beforeQuote !== ',' && beforeQuote !== '[') {
          recovered = recovered.slice(0, -1)
          console.log('🔧 Removed incomplete string value')
        }
      }
    }
    
    // Если строка заканчивается неполным значением (без кавычек), обрезаем до последнего полного поля
    const lastCompleteField = findLastCompleteField(recovered)
    if (lastCompleteField && lastCompleteField !== recovered) {
      recovered = lastCompleteField
      console.log('🔧 Truncated to last complete field')
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
    
    console.log('🔧 Open braces:', openBraces, 'Open brackets:', openBrackets, 'In string:', inString)
    
    // Закрываем незакрытые строки
    if (inString) {
      recovered += '"'
      console.log('🔧 Closed unclosed string')
    }
    
    // Закрываем незакрытые массивы
    while (openBrackets > 0) {
      recovered += ']'
      openBrackets--
      console.log('🔧 Closed array bracket')
    }
    
    // Закрываем незакрытые объекты
    while (openBraces > 0) {
      recovered += '}'
      openBraces--
      console.log('🔧 Closed object brace')
    }
    
    console.log('🔧 Recovery complete, final length:', recovered.length)
    return recovered
  } catch (error) {
    console.warn('Error during JSON recovery:', error)
    return null
  }
}

/**
 * Находит последнее полное поле в JSON строке
 */
function findLastCompleteField(jsonString: string): string | null {
  try {
    // Ищем последнее вхождение паттерна "field": "value" или "field": value
    const patterns = [
      /,\s*"[^"]+"\s*:\s*"[^"]*"$/,  // "field": "value" в конце
      /,\s*"[^"]+"\s*:\s*[^,}]+$/,   // "field": value в конце
      /"[^"]+"\s*:\s*"[^"]*"$/,      // первое поле
      /"[^"]+"\s*:\s*[^,}]+$/        // первое поле с числом/boolean
    ]
    
    for (const pattern of patterns) {
      const matches = jsonString.match(pattern)
      if (matches) {
        const matchIndex = jsonString.lastIndexOf(matches[0])
        if (matchIndex > 0) {
          // Обрезаем до начала последнего полного поля
          return jsonString.substring(0, matchIndex)
        }
      }
    }
    
    // Если не нашли паттерн, ищем последнюю запятую перед полным полем
    const lastCommaIndex = jsonString.lastIndexOf('",')
    if (lastCommaIndex > 0) {
      return jsonString.substring(0, lastCommaIndex + 1)
    }
    
    return null
  } catch (error) {
    console.warn('Error finding last complete field:', error)
    return null
  }
}

/**
 * Создает fallback объект из частичного JSON
 */
function createFallbackFromPartialJSON(jsonString: string): StructuredAnalysisResponse {
  console.log('🔄 Creating fallback from partial JSON, length:', jsonString.length)
  
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
    console.log('🔄 Extracted partial data keys:', Object.keys(partialData))
    
    // Объединяем с fallback данными
    const result = {
      ...fallback,
      ...partialData
    }
    
    console.log('🔄 Final result keys:', Object.keys(result))
    console.log('🔄 Problems and solutions count:', result.problemsAndSolutions?.length || 0)
    
    return result
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
    console.log('🔍 Extracting partial data from JSON...')
    
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
      console.log(`🔍 Extracting section: ${section}`)
      const extracted = extractJSONSection(jsonString, section)
      if (extracted) {
        result[section as keyof StructuredAnalysisResponse] = extracted
        console.log(`✅ Successfully extracted ${section}:`, typeof extracted === 'object' ? Object.keys(extracted) : extracted)
      } else {
        console.log(`❌ Failed to extract ${section}`)
      }
    }
    
    // Специальная обработка для problemsAndSolutions - пытаемся извлечь хотя бы частичные данные
    if (!result.problemsAndSolutions || (Array.isArray(result.problemsAndSolutions) && result.problemsAndSolutions.length === 0)) {
      console.log('🔍 Attempting to extract partial problemsAndSolutions...')
      const partialProblems = extractPartialProblemsAndSolutions(jsonString)
      if (partialProblems && partialProblems.length > 0) {
        result.problemsAndSolutions = partialProblems
        console.log(`✅ Extracted ${partialProblems.length} partial problems`)
      }
    }
    
  } catch (error) {
    console.warn('Error extracting partial data:', error)
  }
  
  return result
}

/**
 * Специальная функция для извлечения частичных данных problemsAndSolutions
 */
function extractPartialProblemsAndSolutions(jsonString: string): any[] {
  try {
    const problems: any[] = []
    
    // Ищем начало массива problemsAndSolutions (разные варианты)
    let problemsStart = jsonString.indexOf('"problemsAndSolutions": [')
    if (problemsStart === -1) {
      problemsStart = jsonString.indexOf("'problemsAndSolutions': [")
    }
    if (problemsStart === -1) {
      problemsStart = jsonString.indexOf('problemsAndSolutions: [')
    }
    
    if (problemsStart === -1) {
      console.log('❌ problemsAndSolutions section not found')
      // Попробуем найти хотя бы упоминание проблем
      const problemMention = jsonString.indexOf('"element"')
      if (problemMention !== -1) {
        console.log('🔍 Found element mention, trying to extract...')
        return extractProblemsFromText(jsonString)
      }
      return []
    }
    
    // Находим начало массива
    const arrayStart = jsonString.indexOf('[', problemsStart)
    if (arrayStart === -1) return []
    
    // Ищем все объекты в массиве, даже неполные
    let pos = arrayStart + 1
    let braceCount = 0
    let inString = false
    let escapeNext = false
    let currentObject = ''
    let objectStart = -1
    
    while (pos < jsonString.length) {
      const char = jsonString[pos]
      
      if (escapeNext) {
        escapeNext = false
        pos++
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        pos++
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
      }
      
      if (!inString) {
        if (char === '{') {
          if (braceCount === 0) {
            objectStart = pos
          }
          braceCount++
        } else if (char === '}') {
          braceCount--
          if (braceCount === 0 && objectStart !== -1) {
            // Нашли полный объект
            currentObject = jsonString.substring(objectStart, pos + 1)
            try {
              const parsed = JSON.parse(currentObject)
              problems.push(parsed)
              console.log('✅ Extracted complete problem object')
            } catch (e) {
              console.log('❌ Failed to parse complete object')
            }
            objectStart = -1
          }
        } else if (char === ']') {
          // Конец массива
          break
        }
      }
      
      pos++
    }
    
    // Если есть незавершенный объект, пытаемся его восстановить
    if (objectStart !== -1 && braceCount > 0) {
      currentObject = jsonString.substring(objectStart)
      console.log('🔧 Attempting to recover incomplete object:', currentObject.substring(0, 100) + '...')
      
      // Пытаемся восстановить объект
      const recovered = recoverIncompleteObject(currentObject)
      if (recovered) {
        try {
          const parsed = JSON.parse(recovered)
          problems.push(parsed)
          console.log('✅ Recovered incomplete problem object')
        } catch (e) {
          console.log('❌ Failed to parse recovered object')
        }
      }
    }
    
    return problems
  } catch (error) {
    console.warn('Error extracting partial problems:', error)
    return []
  }
}

/**
 * Извлекает проблемы из текста, даже если JSON поврежден
 */
function extractProblemsFromText(text: string): any[] {
  const problems: any[] = []
  
  try {
    // Ищем паттерны элементов проблем
    const elementRegex = /"element":\s*"([^"]+)"/g
    const problemRegex = /"problem":\s*"([^"]+)"/g
    const recommendationRegex = /"recommendation":\s*"([^"]+)"/g
    
    let elementMatch
    const elements: string[] = []
    const problemTexts: string[] = []
    const recommendations: string[] = []
    
    // Извлекаем все элементы
    while ((elementMatch = elementRegex.exec(text)) !== null) {
      elements.push(elementMatch[1])
    }
    
    // Извлекаем все проблемы
    let problemMatch
    while ((problemMatch = problemRegex.exec(text)) !== null) {
      problemTexts.push(problemMatch[1])
    }
    
    // Извлекаем все рекомендации
    let recommendationMatch
    while ((recommendationMatch = recommendationRegex.exec(text)) !== null) {
      recommendations.push(recommendationMatch[1])
    }
    
    // Создаем объекты проблем
    const maxLength = Math.max(elements.length, problemTexts.length, recommendations.length)
    for (let i = 0; i < maxLength; i++) {
      problems.push({
        element: elements[i] || 'Неизвестный элемент',
        problem: problemTexts[i] || 'Проблема не описана',
        recommendation: recommendations[i] || 'Рекомендация не указана',
        priority: 'medium',
        principle: 'Принцип UX'
      })
    }
    
    console.log(`🔧 Extracted ${problems.length} problems from text patterns`)
    return problems
    
  } catch (error) {
    console.log('❌ Error extracting problems from text:', error)
    return []
  }
}

/**
 * Восстанавливает неполный объект
 */
function recoverIncompleteObject(objectString: string): string | null {
  try {
    let recovered = objectString.trim()
    
    // Если объект не заканчивается на }, пытаемся его закрыть
    if (!recovered.endsWith('}')) {
      // Ищем последнее полное поле
      const lastCompleteField = recovered.lastIndexOf('",')
      if (lastCompleteField > 0) {
        recovered = recovered.substring(0, lastCompleteField + 1)
      }
      
      // Закрываем объект
      recovered += '}'
    }
    
    return recovered
  } catch (error) {
    console.warn('Error recovering incomplete object:', error)
    return null
  }
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
  if (!obj || typeof obj !== 'object') {
    console.warn('🔍 VALIDATION: Object is null or not an object')
    return false
  }
  
  console.log('🔍 VALIDATION: Validating object with keys:', Object.keys(obj))
  
  // Проверяем наличие основных полей (делаем проверку менее строгой)
  const requiredFields = ['screenDescription', 'uxSurvey', 'audience', 'behavior', 'problemsAndSolutions']
  const presentFields = requiredFields.filter(field => field in obj)
  
  console.log('🔍 VALIDATION: Present fields:', presentFields)
  console.log('🔍 VALIDATION: Missing fields:', requiredFields.filter(field => !(field in obj)))
  
  // Если есть хотя бы 3 из 5 обязательных полей, считаем валидным
  if (presentFields.length >= 3) {
    console.log('✅ VALIDATION: Object is valid (has', presentFields.length, 'of', requiredFields.length, 'required fields)')
    return true
  }
  
  // Альтернативная проверка - если есть любые из ключевых полей
  const alternativeFields = ['audience', 'behavior', 'metadata', 'uxSurvey', 'selfCheck', 'screenDescription', 'problemsAndSolutions']
  const hasAlternativeFields = alternativeFields.some(field => field in obj)
  
  if (hasAlternativeFields) {
    console.log('✅ VALIDATION: Object is valid (has alternative structure)')
    return true
  }
  
  console.warn('❌ VALIDATION: Object is not valid - insufficient fields')
  return false
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