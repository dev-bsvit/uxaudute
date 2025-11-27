import { PromptType, FALLBACK_LANGUAGE } from './types'
import { errorHandler, ErrorType } from './error-handler'
import { ResponseQualityAnalyzer } from '../quality-metrics'

interface PromptMetadata {
  version: string
  language: string
  type: PromptType
  loadedAt: string
  tokenCount: number
  isStable: boolean
  hash: string
}

interface CachedPrompt {
  content: string
  metadata: PromptMetadata
  lastValidated: string
}

class PromptService {
  private prompts: Record<string, Record<PromptType, CachedPrompt>> = {}
  private loadingPromises: Record<string, Promise<void> | undefined> = {}
  private stablePrompts: Partial<Record<PromptType, string>> = {} // Эталонные промпты из stable ветки
  private validationEnabled: boolean = true

  /**
   * Загружает промпт для указанного типа и языка с валидацией и fallback
   */
  async loadPrompt(promptType: PromptType, language: string): Promise<string> {
    try {
      console.log(`🔍 Loading prompt: ${promptType} for language: ${language}`)

      // Убеждаемся, что промпты для языка загружены
      await this.ensurePromptsLoaded(language)

      // Пытаемся получить промпт на запрашиваемом языке
      const cachedPrompt = this.prompts[language]?.[promptType]
      if (cachedPrompt) {
        // Валидируем промпт если включена валидация
        if (this.validationEnabled && await this.validatePrompt(cachedPrompt, language)) {
          console.log(`✅ Using validated prompt: ${promptType} for ${language}`)
          return cachedPrompt.content
        } else if (!this.validationEnabled) {
          return cachedPrompt.content
        }
      }

      // Fallback на основной язык
      if (language !== FALLBACK_LANGUAGE) {
        console.warn(`Prompt ${promptType} not found or invalid for ${language}, trying fallback`)
        await this.ensurePromptsLoaded(FALLBACK_LANGUAGE)
        const fallbackPrompt = this.prompts[FALLBACK_LANGUAGE]?.[promptType]
        if (fallbackPrompt && await this.validatePrompt(fallbackPrompt, FALLBACK_LANGUAGE)) {
          errorHandler.createError(
            ErrorType.PROMPT_NOT_FOUND,
            { promptType, language }
          )
          console.log(`✅ Using fallback prompt: ${promptType} for ${FALLBACK_LANGUAGE}`)
          return fallbackPrompt.content
        }
      }

      // Fallback на стабильный промпт
      const stablePrompt = this.getStablePrompt(promptType)
      if (stablePrompt) {
        console.warn(`Using stable prompt for ${promptType} as final fallback`)
        return stablePrompt
      }

      throw new Error(`Prompt ${promptType} not found for any language`)
    } catch (error) {
      // Последний fallback - базовый промпт
      console.warn(`Using basic prompt for ${promptType} due to error:`, error)
      errorHandler.createError(
        ErrorType.PROMPT_LOADING_FAILED,
        { promptType, language },
        error as Error
      )
      return this.getBasicPrompt(promptType)
    }
  }

  /**
   * Убеждается, что промпты для языка загружены
   */
  private async ensurePromptsLoaded(language: string): Promise<void> {
    if (this.prompts[language]) {
      console.log(`✅ Prompts already loaded for ${language}`)
      return
    }

    const existingPromise = this.loadingPromises[language]
    if (existingPromise) {
      await existingPromise
      return
    }

    this.loadingPromises[language] = this.loadPromptsForLanguage(language)
    await this.loadingPromises[language]
  }

  /**
   * Загружает все промпты для языка с метаданными и валидацией
   */
  private async loadPromptsForLanguage(language: string): Promise<void> {
    const promptTypes = Object.values(PromptType)
    const prompts: Record<PromptType, CachedPrompt> = {} as Record<PromptType, CachedPrompt>

    for (const promptType of promptTypes) {
      try {
        const content = await this.fetchPromptFile(promptType, language)
        const metadata = this.createPromptMetadata(content, promptType, language)
        
        const cachedPrompt: CachedPrompt = {
          content,
          metadata,
          lastValidated: new Date().toISOString()
        }

        // Валидируем промпт при загрузке
        if (this.validationEnabled) {
          const isValid = await this.validatePromptContent(content, promptType, language)
          if (!isValid) {
            console.warn(`⚠️ Prompt validation failed for ${promptType} in ${language}`)
            // Пытаемся использовать стабильный промпт
            const stablePrompt = this.getStablePrompt(promptType)
            if (stablePrompt) {
              cachedPrompt.content = stablePrompt
              cachedPrompt.metadata.isStable = true
              console.log(`✅ Using stable prompt for ${promptType} in ${language}`)
            }
          }
        }

        prompts[promptType] = cachedPrompt
        console.log(`✅ Loaded prompt: ${promptType} for ${language} (${content.length} chars)`)
      } catch (error) {
        console.error(`❌ Failed to load ${promptType} for ${language}:`, error)
        
        // Fallback chain: stable -> basic
        let fallbackContent = this.getStablePrompt(promptType) || this.getBasicPrompt(promptType)
        
        const metadata = this.createPromptMetadata(fallbackContent, promptType, language, true)
        prompts[promptType] = {
          content: fallbackContent,
          metadata,
          lastValidated: new Date().toISOString()
        }
        
        errorHandler.createError(
          ErrorType.PROMPT_LOADING_FAILED,
          { promptType, language },
          error as Error
        )
      }
    }

    this.prompts[language] = prompts
    console.log(`✅ All prompts loaded for language: ${language}`)
  }

  /**
   * Загружает файл промпта (поддерживает и сервер, и клиент)
   */
  private async fetchPromptFile(promptType: PromptType, language: string): Promise<string> {
    const fileName = this.getPromptFileName(promptType)

    // Проверяем, выполняется ли код на сервере
    if (typeof window === 'undefined') {
      // Серверный контекст - используем fs.readFileSync
      const filePath = this.getPromptFilePath(fileName, language)
      console.log(`📝 Loading prompt file (server): ${filePath}`)

      try {
        const { readFileSync } = await import('fs')
        const content = readFileSync(filePath, 'utf-8')

        console.log(`✅ Prompt loaded successfully: ${filePath} (${content.length} chars)`)
        console.log(`📄 Prompt preview: ${content.substring(0, 200)}...`)

        // Проверяем, что промпт содержит нашу структуру
        if (promptType === PromptType.JSON_STRUCTURED && content.includes('screenDescription')) {
          console.log(`✅ Detailed JSON prompt loaded with screenDescription structure`)
        } else if (promptType === PromptType.JSON_STRUCTURED) {
          console.warn(`⚠️ JSON prompt loaded but doesn't contain screenDescription - might be wrong file`)
        }

        return content
      } catch (error) {
        console.error(`❌ Failed to load prompt file: ${filePath}`)
        console.error(`❌ Error:`, error)
        throw error // Пробрасываем ошибку для fallback
      }
    } else {
      // Браузерный контекст - используем fetch
      const url = `/prompts/${language}/${fileName}`
      console.log(`📝 Loading prompt file (client): ${url}`)

      const response = await fetch(url)

      if (!response.ok) {
        console.error(`❌ Failed to load prompt: ${url} - ${response.status}: ${response.statusText}`)
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const content = await response.text()
      console.log(`✅ Prompt loaded successfully: ${url} (${content.length} chars)`)
      console.log(`📄 Prompt preview: ${content.substring(0, 200)}...`)

      // Проверяем, что промпт содержит нашу структуру
      if (promptType === PromptType.JSON_STRUCTURED && content.includes('screenDescription')) {
        console.log(`✅ Detailed JSON prompt loaded with screenDescription structure`)
      } else if (promptType === PromptType.JSON_STRUCTURED) {
        console.warn(`⚠️ JSON prompt loaded but doesn't contain screenDescription - might be wrong file`)
      }

      return content
    }
  }

  /**
   * Получает полный путь к файлу промпта
   */
  private getPromptFilePath(fileName: string, language: string): string {
    const { join } = require('path')
    const filePath = join(process.cwd(), 'public', 'prompts', language, fileName)
    console.log(`🔍 Building file path: cwd=${process.cwd()}, language=${language}, fileName=${fileName}`)
    console.log(`🔍 Final path: ${filePath}`)
    return filePath
  }

  /**
   * Получает имя файла для типа промпта
   */
  private getPromptFileName(promptType: PromptType): string {
    const fileNames: Record<PromptType, string> = {
      [PromptType.MAIN]: 'json-structured-prompt.md', // Используем JSON промпт как основной
      [PromptType.JSON_STRUCTURED]: 'json-structured-prompt.md',
      [PromptType.SONOMA_STRUCTURED]: 'sonoma-structured-prompt.md',
      [PromptType.AB_TEST]: 'ab-test-prompt.md',
      [PromptType.BUSINESS_ANALYTICS]: 'business-analytics-prompt.md',
      [PromptType.HYPOTHESES]: 'hypotheses-prompt.md'
    }

    return fileNames[promptType]
  }

  /**
   * Возвращает базовый промпт для типа
   */
  private getBasicPrompt(promptType: PromptType): string {
    const basicPrompts: Record<PromptType, string> = {
      [PromptType.MAIN]: `You are an experienced UX designer-researcher with 20 years of experience. Analyze the interface based on proven UX methodologies: Nielsen's heuristics, WCAG 2.2, Fitts' Law, Hick-Hyman, ISO 9241, etc.

Input: static screenshot (required) + context and target audience if available.

Output:
1. Screen description
2. UX survey with 5 questions
3. Problems and recommendations
4. Self-check & confidence

Respond in the selected language.`,

      [PromptType.JSON_STRUCTURED]: `You are an experienced UX designer-researcher. Analyze the interface and return the result in JSON format.

**CRITICALLY IMPORTANT: 
1. Respond ONLY in JSON format
2. Do NOT add any text before or after JSON
3. Do NOT wrap JSON in markdown blocks
4. Start response with { and end with }
5. Use this structure: {"screenDescription": {"screenType": "...", "userGoal": "...", "keyElements": [], "confidence": 85, "confidenceReason": "..."}, "uxSurvey": {"questions": [], "overallConfidence": 85}, "audience": {"targetAudience": "...", "mainPain": "...", "fears": []}, "behavior": {"userScenarios": {"idealPath": "...", "typicalError": "...", "alternativeWorkaround": "..."}, "behavioralPatterns": "...", "frictionPoints": [], "actionMotivation": "..."}, "problemsAndSolutions": [], "selfCheck": {"checklist": {}, "confidence": {}}, "metadata": {}}
6. Use actual field names, not placeholder brackets like [metadata] or [model]
7. Single values should not be wrapped in arrays**

Respond in the selected language.`,

      [PromptType.SONOMA_STRUCTURED]: `You are an experienced UX designer-researcher. Analyze the interface and return structured results.

Respond ONLY in JSON format in the selected language.`,

      [PromptType.AB_TEST]: `Analyze the interface for A/B testing opportunities. Focus on elements that could impact conversion rates.

Respond in the selected language.`,

      [PromptType.BUSINESS_ANALYTICS]: `Analyze the interface from a business analytics perspective. Focus on metrics and KPIs.

Respond in the selected language.`,

      [PromptType.HYPOTHESES]: `Generate hypotheses for interface improvements based on UX principles.

Respond in the selected language.`
    }

    return basicPrompts[promptType]
  }

  /**
   * Получает доступные промпты для языка
   */
  async getAvailablePrompts(language: string): Promise<PromptType[]> {
    await this.ensurePromptsLoaded(language)
    const prompts = this.prompts[language]

    if (!prompts) return []

    return Object.keys(prompts).filter(key => prompts[key as PromptType]) as PromptType[]
  }

  /**
   * Объединяет промпт с контекстом
   */
  combineWithContext(prompt: string, context?: string, language: string = 'ru'): string {
    if (!context || context.trim() === '') {
      return prompt
    }

    // Ограничиваем длину контекста для предотвращения слишком больших промптов
    const MAX_CONTEXT_LENGTH = 2000
    let trimmedContext = context.trim()

    if (trimmedContext.length > MAX_CONTEXT_LENGTH) {
      console.warn(`⚠️ Context слишком длинный (${trimmedContext.length} символов), обрезаем до ${MAX_CONTEXT_LENGTH}`)
      trimmedContext = trimmedContext.substring(0, MAX_CONTEXT_LENGTH) + '...'
    }

    const contextLabels: Record<string, string> = {
      'ru': '## Дополнительный контекст',
      'en': '## Additional Context'
    }

    const contextInstructions: Record<string, string> = {
      'ru': 'Учти этот контекст при анализе и адаптируй вопросы под специфику бизнеса и аудитории.',
      'en': 'Consider this context in your analysis and adapt questions to the business specifics and audience.'
    }

    const contextLabel = contextLabels[language] || contextLabels['en']
    const contextInstruction = contextInstructions[language] || contextInstructions['en']

    return `${prompt}

${contextLabel}
${trimmedContext}

${contextInstruction}`
  }

  /**
   * Очищает кэш промптов
   */
  clearCache(): void {
    console.log('🗑️ Clearing prompts cache')
    this.prompts = {}
    this.loadingPromises = {}
  }

  /**
   * Принудительно перезагружает промпт (игнорирует кэш)
   */
  async forceReloadPrompt(promptType: PromptType, language: string): Promise<string> {
    console.log(`🔄 Force reloading prompt: ${promptType} for language: ${language}`)

    // Очищаем кэш для этого языка
    delete this.prompts[language]
    delete this.loadingPromises[language]

    // Загружаем заново
    return this.loadPrompt(promptType, language)
  }

  /**
   * Предзагружает промпты для языка
   */
  async preloadPrompts(language: string): Promise<void> {
    try {
      await this.ensurePromptsLoaded(language)
    } catch (error) {
      console.error(`Failed to preload prompts for ${language}:`, error)
    }
  }

  /**
   * Валидирует кэшированный промпт
   */
  private async validatePrompt(cachedPrompt: CachedPrompt, language: string): Promise<boolean> {
    if (!this.validationEnabled) return true

    // Проверяем возраст валидации (перевалидируем каждые 24 часа)
    const lastValidated = new Date(cachedPrompt.lastValidated)
    const now = new Date()
    const hoursSinceValidation = (now.getTime() - lastValidated.getTime()) / (1000 * 60 * 60)
    
    if (hoursSinceValidation < 24) {
      return true // Считаем валидным если проверяли недавно
    }

    // Выполняем валидацию контента
    const isValid = await this.validatePromptContent(cachedPrompt.content, cachedPrompt.metadata.type, language)
    
    if (isValid) {
      cachedPrompt.lastValidated = now.toISOString()
    }

    return isValid
  }

  /**
   * Валидирует содержимое промпта
   */
  private async validatePromptContent(content: string, promptType: PromptType, language: string): Promise<boolean> {
    try {
      // Базовые проверки
      if (!content || content.trim().length < 50) {
        console.warn(`❌ Prompt too short: ${promptType} for ${language}`)
        return false
      }

      // Проверка языка
      const expectedLanguage = language === 'ru' ? 'ru' : 'en'
      const metrics = ResponseQualityAnalyzer.measureQuality('Sample text for validation', expectedLanguage)
      
      // Проверяем что промпт содержит ключевые слова для своего типа
      const requiredKeywords = this.getRequiredKeywords(promptType, language)
      const hasRequiredKeywords = requiredKeywords.some(keyword => 
        content.toLowerCase().includes(keyword.toLowerCase())
      )

      if (!hasRequiredKeywords) {
        console.warn(`❌ Prompt missing required keywords: ${promptType} for ${language}`)
        return false
      }

      // Проверка на корректность JSON структуры для JSON промптов
      if (promptType === PromptType.JSON_STRUCTURED) {
        const hasJsonStructure = content.includes('screenDescription') && 
                                content.includes('uxSurvey') &&
                                content.includes('problemsAndSolutions')
        
        if (!hasJsonStructure) {
          console.warn(`❌ JSON prompt missing required structure: ${promptType} for ${language}`)
          return false
        }
      }

      console.log(`✅ Prompt validation passed: ${promptType} for ${language}`)
      return true
    } catch (error) {
      console.error(`❌ Prompt validation error: ${promptType} for ${language}:`, error)
      return false
    }
  }

  /**
   * Получает обязательные ключевые слова для типа промпта
   */
  private getRequiredKeywords(promptType: PromptType, language: string): string[] {
    const keywords: Record<PromptType, Record<string, string[]>> = {
      [PromptType.MAIN]: {
        'ru': ['анализ', 'интерфейс', 'UX', 'пользователь'],
        'en': ['analysis', 'interface', 'UX', 'user']
      },
      [PromptType.JSON_STRUCTURED]: {
        'ru': ['JSON', 'screenDescription', 'uxSurvey', 'анализ'],
        'en': ['JSON', 'screenDescription', 'uxSurvey', 'analysis']
      },
      [PromptType.SONOMA_STRUCTURED]: {
        'ru': ['структурированный', 'анализ', 'интерфейс'],
        'en': ['structured', 'analysis', 'interface']
      },
      [PromptType.AB_TEST]: {
        'ru': ['A/B', 'тест', 'конверсия'],
        'en': ['A/B', 'test', 'conversion']
      },
      [PromptType.BUSINESS_ANALYTICS]: {
        'ru': ['бизнес', 'аналитика', 'метрики'],
        'en': ['business', 'analytics', 'metrics']
      },
      [PromptType.HYPOTHESES]: {
        'ru': ['гипотеза', 'улучшение', 'предположение'],
        'en': ['hypothesis', 'improvement', 'assumption']
      }
    }

    return keywords[promptType]?.[language] || keywords[promptType]?.['en'] || []
  }

  /**
   * Создает метаданные для промпта
   */
  private createPromptMetadata(
    content: string, 
    promptType: PromptType, 
    language: string, 
    isStable: boolean = false
  ): PromptMetadata {
    return {
      version: '1.0.0',
      language,
      type: promptType,
      loadedAt: new Date().toISOString(),
      tokenCount: ResponseQualityAnalyzer.measureQuality(content, language as 'ru' | 'en').tokenCount,
      isStable,
      hash: this.generateContentHash(content)
    }
  }

  /**
   * Генерирует хэш содержимого для отслеживания изменений
   */
  private generateContentHash(content: string): string {
    // Простой хэш для отслеживания изменений
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Конвертируем в 32-битное число
    }
    return hash.toString(16)
  }

  /**
   * Получает стабильный промпт (из stable ветки)
   */
  private getStablePrompt(promptType: PromptType): string | null {
    return this.stablePrompts[promptType] || null
  }

  /**
   * Устанавливает стабильные промпты (эталонные из stable ветки)
   */
  setStablePrompts(stablePrompts: Partial<Record<PromptType, string>>): void {
    this.stablePrompts = { ...stablePrompts }
    console.log(`✅ Stable prompts loaded: ${Object.keys(stablePrompts).length} prompts`)
  }

  /**
   * Включает/выключает валидацию промптов
   */
  setValidationEnabled(enabled: boolean): void {
    this.validationEnabled = enabled
    console.log(`🔧 Prompt validation ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Получает метаданные промпта
   */
  getPromptMetadata(promptType: PromptType, language: string): PromptMetadata | null {
    return this.prompts[language]?.[promptType]?.metadata || null
  }

  /**
   * Получает статистику загруженных промптов
   */
  getLoadedPromptsStats(): {
    languages: string[]
    promptTypes: PromptType[]
    totalPrompts: number
    stablePrompts: number
    lastLoaded: string | null
  } {
    const languages = Object.keys(this.prompts)
    const promptTypes = languages.length > 0 ? Object.keys(this.prompts[languages[0]]) as PromptType[] : []
    const totalPrompts = languages.reduce((total, lang) => total + Object.keys(this.prompts[lang]).length, 0)
    const stablePrompts = Object.keys(this.stablePrompts).length
    
    let lastLoaded: string | null = null
    for (const lang of languages) {
      for (const type of promptTypes) {
        const loadedAt = this.prompts[lang]?.[type]?.metadata?.loadedAt
        if (loadedAt && (!lastLoaded || loadedAt > lastLoaded)) {
          lastLoaded = loadedAt
        }
      }
    }

    return {
      languages,
      promptTypes,
      totalPrompts,
      stablePrompts,
      lastLoaded
    }
  }
}

// Создаем и инициализируем сервис промптов
const promptService = new PromptService()

// Загружаем стабильные промпты при инициализации
import('../stable-prompts-loader').then(({ StablePromptsLoader }) => {
  const stablePrompts = StablePromptsLoader.loadAllStablePrompts()
  promptService.setStablePrompts(stablePrompts)
  console.log('✅ PromptService initialized with stable prompts')
}).catch(error => {
  console.error('❌ Failed to load stable prompts:', error)
})

export { promptService }