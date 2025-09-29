/**
 * Менеджер языков для обеспечения консистентности языка во всей системе
 */

import { languageDetector } from './i18n/language-detector'
import { promptService } from './i18n/prompt-service'
import { PromptType } from './i18n/types'

export interface LanguageContext {
  requestLanguage: string
  detectedLanguage: string
  promptLanguage: string
  responseLanguage: string
  isConsistent: boolean
  source: 'user-preference' | 'browser' | 'default' | 'request-header'
}

export class LanguageManager {
  /**
   * Определяет язык для запроса анализа
   */
  static async determineAnalysisLanguage(request: Request): Promise<LanguageContext> {
    console.log('🌐 Determining analysis language...')

    // 1. Проверяем заголовок Accept-Language
    const acceptLanguage = request.headers.get('accept-language')
    console.log('🔍 Accept-Language header:', acceptLanguage)

    // 2. Проверяем заголовок Content-Language
    const contentLanguage = request.headers.get('content-language')
    console.log('🔍 Content-Language header:', contentLanguage)

    // 3. Используем детектор языка
    const detectionResult = await languageDetector.detectLanguage()
    console.log('🔍 Language detector result:', detectionResult)

    // 4. Определяем финальный язык
    let finalLanguage = detectionResult.language
    let source = detectionResult.source

    // Приоритет заголовкам запроса
    if (contentLanguage && this.isSupportedLanguage(contentLanguage)) {
      finalLanguage = contentLanguage
      source = 'request-header'
      console.log('✅ Using Content-Language header:', finalLanguage)
    } else if (acceptLanguage) {
      const parsedLanguage = this.parseAcceptLanguage(acceptLanguage)
      if (parsedLanguage && this.isSupportedLanguage(parsedLanguage)) {
        finalLanguage = parsedLanguage
        source = 'request-header'
        console.log('✅ Using Accept-Language header:', finalLanguage)
      }
    }

    const context: LanguageContext = {
      requestLanguage: contentLanguage || acceptLanguage || 'auto',
      detectedLanguage: detectionResult.language,
      promptLanguage: finalLanguage,
      responseLanguage: finalLanguage,
      isConsistent: true,
      source
    }

    console.log('🌐 Final language context:', context)
    return context
  }

  /**
   * Загружает промпт с учетом языкового контекста
   */
  static async loadPromptForLanguage(
    promptType: PromptType,
    languageContext: LanguageContext
  ): Promise<string> {
    console.log(`🔍 Loading prompt ${promptType} for language: ${languageContext.promptLanguage}`)

    try {
      const prompt = await promptService.loadPrompt(promptType, languageContext.promptLanguage)
      console.log(`✅ Prompt loaded successfully (${prompt.length} chars)`)
      return prompt
    } catch (error) {
      console.error(`❌ Failed to load prompt ${promptType} for ${languageContext.promptLanguage}:`, error)
      
      // Fallback к английскому если не русский
      if (languageContext.promptLanguage !== 'en') {
        console.log('🔄 Trying fallback to English...')
        try {
          const fallbackPrompt = await promptService.loadPrompt(promptType, 'en')
          console.log('✅ Fallback prompt loaded')
          return fallbackPrompt
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError)
        }
      }

      throw error
    }
  }

  /**
   * Валидирует консистентность языка в запросе и ответе
   */
  static validateLanguageConsistency(
    input: string,
    output: string,
    expectedLanguage: string
  ): { isConsistent: boolean; issues: string[] } {
    const issues: string[] = []

    // Проверяем язык ответа
    const outputLanguage = this.detectTextLanguage(output)
    if (outputLanguage !== expectedLanguage && outputLanguage !== 'unknown') {
      issues.push(`Response language (${outputLanguage}) doesn't match expected (${expectedLanguage})`)
    }

    // Проверяем что ответ не обрезан
    if (this.isResponseTruncated(output)) {
      issues.push('Response appears to be truncated')
    }

    // Проверяем минимальную длину
    if (output.length < 500) {
      issues.push('Response is too short, may be incomplete')
    }

    return {
      isConsistent: issues.length === 0,
      issues
    }
  }

  /**
   * Принудительно устанавливает язык для ответа
   */
  static enforceResponseLanguage(prompt: string, language: string): string {
    const languageInstructions = {
      'ru': '\n\n**ВАЖНО: Отвечай ТОЛЬКО на русском языке. Весь анализ должен быть на русском.**',
      'en': '\n\n**IMPORTANT: Respond ONLY in English. All analysis must be in English.**'
    }

    const instruction = languageInstructions[language as keyof typeof languageInstructions]
    if (!instruction) {
      console.warn(`No language instruction for: ${language}`)
      return prompt
    }

    return prompt + instruction
  }

  /**
   * Создает языковой контекст из параметров запроса
   */
  static createLanguageContextFromParams(params: {
    language?: string
    acceptLanguage?: string
    contentLanguage?: string
  }): LanguageContext {
    const language = params.language || 
                    params.contentLanguage || 
                    this.parseAcceptLanguage(params.acceptLanguage || '') ||
                    'ru'

    return {
      requestLanguage: params.language || 'auto',
      detectedLanguage: language,
      promptLanguage: language,
      responseLanguage: language,
      isConsistent: true,
      source: params.language ? 'user-preference' : 'default'
    }
  }

  /**
   * Парсит заголовок Accept-Language
   */
  private static parseAcceptLanguage(acceptLanguage: string): string | null {
    if (!acceptLanguage) return null

    // Парсим "ru-RU,ru;q=0.9,en;q=0.8" -> ["ru", "en"]
    const languages = acceptLanguage
      .split(',')
      .map(lang => lang.split(';')[0].trim())
      .map(lang => lang.split('-')[0].toLowerCase())

    // Возвращаем первый поддерживаемый язык
    for (const lang of languages) {
      if (this.isSupportedLanguage(lang)) {
        return lang
      }
    }

    return null
  }

  /**
   * Проверяет поддерживается ли язык
   */
  private static isSupportedLanguage(language: string): boolean {
    return ['ru', 'en'].includes(language.toLowerCase())
  }

  /**
   * Определяет язык текста
   */
  private static detectTextLanguage(text: string): 'ru' | 'en' | 'unknown' {
    if (!text || text.length < 10) return 'unknown'

    const russianChars = (text.match(/[а-яё]/gi) || []).length
    const englishChars = (text.match(/[a-z]/gi) || []).length
    const totalChars = russianChars + englishChars

    if (totalChars === 0) return 'unknown'

    const russianRatio = russianChars / totalChars

    if (russianRatio > 0.6) return 'ru'
    if (russianRatio < 0.4) return 'en'
    return 'unknown'
  }

  /**
   * Проверяет обрезан ли ответ
   */
  private static isResponseTruncated(response: string): boolean {
    if (!response) return true

    // Проверяем что ответ заканчивается корректно
    const endsCorrectly = /[.!?]\s*$/.test(response.trim())
    
    // Проверяем на признаки обрезания
    const hasTruncationMarkers = response.includes('...') || 
                                response.includes('…') ||
                                response.endsWith('..') ||
                                /[а-яa-z]\s*$/i.test(response.trim())

    return !endsCorrectly || hasTruncationMarkers
  }

  /**
   * Логирует языковой контекст для отладки
   */
  static logLanguageContext(context: LanguageContext, stage: string): void {
    console.log(`🌐 Language Context [${stage}]:`, {
      requestLanguage: context.requestLanguage,
      detectedLanguage: context.detectedLanguage,
      promptLanguage: context.promptLanguage,
      responseLanguage: context.responseLanguage,
      isConsistent: context.isConsistent,
      source: context.source
    })
  }

  /**
   * Создает отчет о языковых проблемах
   */
  static generateLanguageReport(context: LanguageContext, response?: string): string {
    const lines = [
      'Language Analysis Report',
      '========================',
      `Request Language: ${context.requestLanguage}`,
      `Detected Language: ${context.detectedLanguage}`,
      `Prompt Language: ${context.promptLanguage}`,
      `Response Language: ${context.responseLanguage}`,
      `Is Consistent: ${context.isConsistent ? '✅' : '❌'}`,
      `Source: ${context.source}`,
      ''
    ]

    if (response) {
      const validation = this.validateLanguageConsistency(
        '', 
        response, 
        context.responseLanguage
      )

      lines.push('Response Validation:')
      lines.push(`Consistent: ${validation.isConsistent ? '✅' : '❌'}`)
      
      if (validation.issues.length > 0) {
        lines.push('Issues:')
        validation.issues.forEach(issue => {
          lines.push(`  - ${issue}`)
        })
      }
    }

    return lines.join('\n')
  }
}