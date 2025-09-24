import { PromptType, FALLBACK_LANGUAGE } from './types'

class PromptService {
  private prompts: Record<string, Record<PromptType, string>> = {}
  private loadingPromises: Record<string, Promise<void>> = {}

  /**
   * Загружает промпт для указанного типа и языка
   */
  async loadPrompt(promptType: PromptType, language: string): Promise<string> {
    // Убеждаемся, что промпты для языка загружены
    await this.ensurePromptsLoaded(language)

    // Пытаемся получить промпт на запрашиваемом языке
    const prompt = this.prompts[language]?.[promptType]
    if (prompt) {
      return prompt
    }

    // Fallback на основной язык
    if (language !== FALLBACK_LANGUAGE) {
      await this.ensurePromptsLoaded(FALLBACK_LANGUAGE)
      const fallbackPrompt = this.prompts[FALLBACK_LANGUAGE]?.[promptType]
      if (fallbackPrompt) {
        console.warn(`Prompt ${promptType} not found for ${language}, using fallback`)
        return fallbackPrompt
      }
    }

    // Возвращаем базовый промпт
    console.error(`Prompt ${promptType} not found for any language`)
    return this.getBasicPrompt(promptType)
  }

  /**
   * Убеждается, что промпты для языка загружены
   */
  private async ensurePromptsLoaded(language: string): Promise<void> {
    if (this.prompts[language]) {
      return
    }

    if (this.loadingPromises[language]) {
      await this.loadingPromises[language]
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
      try {
        const prompt = await this.fetchPromptFile(promptType, language)
        prompts[promptType] = prompt
      } catch (error) {
        console.warn(`Failed to load prompt ${promptType} for ${language}:`, error)
      }
    }

    this.prompts[language] = prompts
  }

  /**
   * Загружает файл промпта
   */
  private async fetchPromptFile(promptType: PromptType, language: string): Promise<string> {
    const fileName = this.getPromptFileName(promptType)
    const response = await fetch(`/prompts/${language}/${fileName}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return response.text()
  }

  /**
   * Получает имя файла для типа промпта
   */
  private getPromptFileName(promptType: PromptType): string {
    const fileNames: Record<PromptType, string> = {
      [PromptType.MAIN]: 'main-prompt.md',
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
4. Do NOT add explanations or comments
5. Start response with { and end with }
6. Ensure JSON is valid and complete**

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
    this.prompts = {}
    this.loadingPromises = {}
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