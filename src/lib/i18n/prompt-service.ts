import { PromptType, FALLBACK_LANGUAGE } from './types'
import { errorHandler, ErrorType } from './error-handler'

class PromptService {
  private prompts: Record<string, Record<PromptType, string>> = {}
  private loadingPromises: Record<string, Promise<void> | undefined> = {}

  /**
   * Загружает промпт для указанного типа и языка
   */
  async loadPrompt(promptType: PromptType, language: string): Promise<string> {
    try {
      console.log(`🔍 Loading prompt: ${promptType} for language: ${language}`)

      // Убеждаемся, что промпты для языка загружены
      await this.ensurePromptsLoaded(language)

      // Пытаемся получить промпт на запрашиваемом языке
      const prompt = this.prompts[language]?.[promptType]
      if (prompt) {
        return prompt
      }

      // Fallback на основной язык
      if (language !== FALLBACK_LANGUAGE) {
        console.warn(`Prompt ${promptType} not found for ${language}, trying fallback`)
        await this.ensurePromptsLoaded(FALLBACK_LANGUAGE)
        const fallbackPrompt = this.prompts[FALLBACK_LANGUAGE]?.[promptType]
        if (fallbackPrompt) {
          errorHandler.createError(
            ErrorType.PROMPT_NOT_FOUND,
            { promptType, language }
          )
          return fallbackPrompt
        }
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
    // Временно: всегда перезагружаем промпты для отладки
    if (language === 'ru') {
      console.log('🔄 Force reloading Russian prompts for debugging')
      delete this.prompts[language]
      delete this.loadingPromises[language]
    }

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
   * Загружает все промпты для языка
   */
  private async loadPromptsForLanguage(language: string): Promise<void> {
    const promptTypes = Object.values(PromptType)
    const prompts: Record<PromptType, string> = {} as Record<PromptType, string>

    for (const promptType of promptTypes) {
      const prompt = await errorHandler.handleErrorWithFallback(
        async () => {
          return await this.fetchPromptFile(promptType, language)
        },
        () => {
          // Fallback: используем базовый промпт
          console.warn(`Using basic prompt for ${promptType} in ${language}`)
          return this.getBasicPrompt(promptType)
        },
        ErrorType.PROMPT_LOADING_FAILED,
        { promptType, language }
      )

      prompts[promptType] = prompt
    }

    this.prompts[language] = prompts
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
6. ALL TEXT IN JSON MUST BE IN RUSSIAN LANGUAGE**

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
${context}

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
}

export const promptService = new PromptService()