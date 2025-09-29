/**
 * Валидатор промптов для обеспечения качества и целостности
 */

import { PromptType } from './i18n/types'
import { ResponseQualityAnalyzer } from './quality-metrics'
import { StablePromptsLoader } from './stable-prompts-loader'

export interface PromptValidationResult {
  isValid: boolean
  score: number
  issues: ValidationIssue[]
  recommendations: string[]
  metadata: {
    tokenCount: number
    language: 'ru' | 'en' | 'unknown'
    promptType: PromptType
    validatedAt: string
  }
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info'
  code: string
  message: string
  severity: number // 1-10, где 10 - критическая ошибка
}

export class PromptValidator {
  private static readonly MIN_PROMPT_LENGTH = 50
  private static readonly MAX_PROMPT_LENGTH = 10000
  private static readonly MIN_QUALITY_SCORE = 70

  /**
   * Валидирует промпт по всем критериям
   */
  static async validatePrompt(
    content: string,
    promptType: PromptType,
    expectedLanguage: 'ru' | 'en'
  ): Promise<PromptValidationResult> {
    const issues: ValidationIssue[] = []
    const recommendations: string[] = []
    let score = 100

    // 1. Базовые проверки
    const basicValidation = this.validateBasicStructure(content)
    issues.push(...basicValidation.issues)
    score -= basicValidation.penalty

    // 2. Проверка языка
    const languageValidation = this.validateLanguage(content, expectedLanguage)
    issues.push(...languageValidation.issues)
    score -= languageValidation.penalty

    // 3. Проверка специфики типа промпта
    const typeValidation = this.validatePromptType(content, promptType)
    issues.push(...typeValidation.issues)
    score -= typeValidation.penalty

    // 4. Проверка токенов
    const tokenValidation = this.validateTokenCount(content)
    issues.push(...tokenValidation.issues)
    score -= tokenValidation.penalty

    // 5. Сравнение со стабильным промптом
    const stableValidation = this.validateAgainstStable(content, promptType)
    issues.push(...stableValidation.issues)
    score -= stableValidation.penalty

    // 6. Проверка качества с помощью анализатора
    const qualityMetrics = ResponseQualityAnalyzer.measureQuality(content, expectedLanguage)
    if (qualityMetrics.qualityScore < this.MIN_QUALITY_SCORE) {
      issues.push({
        type: 'warning',
        code: 'LOW_QUALITY_SCORE',
        message: `Quality score ${qualityMetrics.qualityScore} is below minimum ${this.MIN_QUALITY_SCORE}`,
        severity: 6
      })
      score -= 15
    }

    // Генерируем рекомендации
    recommendations.push(...this.generateRecommendations(issues, content, promptType))

    const finalScore = Math.max(0, Math.min(100, score))
    const isValid = finalScore >= this.MIN_QUALITY_SCORE && 
                   !issues.some(issue => issue.type === 'error')

    return {
      isValid,
      score: finalScore,
      issues,
      recommendations,
      metadata: {
        tokenCount: qualityMetrics.tokenCount,
        language: this.detectLanguage(content),
        promptType,
        validatedAt: new Date().toISOString()
      }
    }
  }

  /**
   * Валидирует базовую структуру промпта
   */
  private static validateBasicStructure(content: string): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    // Проверка длины
    if (!content || content.trim().length === 0) {
      issues.push({
        type: 'error',
        code: 'EMPTY_PROMPT',
        message: 'Prompt is empty',
        severity: 10
      })
      penalty += 50
    } else if (content.length < this.MIN_PROMPT_LENGTH) {
      issues.push({
        type: 'error',
        code: 'PROMPT_TOO_SHORT',
        message: `Prompt is too short (${content.length} chars, minimum ${this.MIN_PROMPT_LENGTH})`,
        severity: 8
      })
      penalty += 30
    } else if (content.length > this.MAX_PROMPT_LENGTH) {
      issues.push({
        type: 'warning',
        code: 'PROMPT_TOO_LONG',
        message: `Prompt is very long (${content.length} chars, maximum recommended ${this.MAX_PROMPT_LENGTH})`,
        severity: 4
      })
      penalty += 10
    }

    // Проверка на наличие инструкций
    const hasInstructions = /(?:анализ|analyze|instruction|инструкция)/i.test(content)
    if (!hasInstructions) {
      issues.push({
        type: 'warning',
        code: 'NO_CLEAR_INSTRUCTIONS',
        message: 'Prompt does not contain clear analysis instructions',
        severity: 5
      })
      penalty += 15
    }

    // Проверка на наличие структуры
    const hasStructure = content.includes('\n') || content.includes('1.') || content.includes('-')
    if (!hasStructure && content.length > 200) {
      issues.push({
        type: 'info',
        code: 'NO_STRUCTURE',
        message: 'Prompt lacks clear structure (lists, numbering, etc.)',
        severity: 3
      })
      penalty += 5
    }

    return { issues, penalty }
  }

  /**
   * Валидирует соответствие языка
   */
  private static validateLanguage(content: string, expectedLanguage: 'ru' | 'en'): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    const detectedLanguage = this.detectLanguage(content)
    
    if (detectedLanguage === 'unknown') {
      issues.push({
        type: 'warning',
        code: 'UNKNOWN_LANGUAGE',
        message: 'Could not reliably detect prompt language',
        severity: 4
      })
      penalty += 10
    } else if (detectedLanguage !== expectedLanguage) {
      issues.push({
        type: 'error',
        code: 'LANGUAGE_MISMATCH',
        message: `Expected ${expectedLanguage} but detected ${detectedLanguage}`,
        severity: 9
      })
      penalty += 40
    }

    return { issues, penalty }
  }

  /**
   * Валидирует специфику типа промпта
   */
  private static validatePromptType(content: string, promptType: PromptType): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    const requiredElements = this.getRequiredElementsForType(promptType)
    const missingElements = requiredElements.filter(element => 
      !new RegExp(element, 'i').test(content)
    )

    if (missingElements.length > 0) {
      issues.push({
        type: 'error',
        code: 'MISSING_REQUIRED_ELEMENTS',
        message: `Missing required elements for ${promptType}: ${missingElements.join(', ')}`,
        severity: 8
      })
      penalty += missingElements.length * 10
    }

    // Специальные проверки для JSON промптов
    if (promptType === PromptType.JSON_STRUCTURED) {
      const jsonValidation = this.validateJsonPrompt(content)
      issues.push(...jsonValidation.issues)
      penalty += jsonValidation.penalty
    }

    return { issues, penalty }
  }

  /**
   * Валидирует JSON промпт
   */
  private static validateJsonPrompt(content: string): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    const requiredJsonFields = [
      'screenDescription',
      'uxSurvey',
      'problemsAndSolutions',
      'selfCheck'
    ]

    const missingFields = requiredJsonFields.filter(field => !content.includes(field))
    if (missingFields.length > 0) {
      issues.push({
        type: 'error',
        code: 'MISSING_JSON_FIELDS',
        message: `Missing required JSON fields: ${missingFields.join(', ')}`,
        severity: 9
      })
      penalty += missingFields.length * 15
    }

    // Проверка на наличие инструкций по JSON формату
    const hasJsonInstructions = /JSON.*format|формат.*JSON/i.test(content)
    if (!hasJsonInstructions) {
      issues.push({
        type: 'warning',
        code: 'NO_JSON_INSTRUCTIONS',
        message: 'JSON prompt should contain explicit JSON format instructions',
        severity: 6
      })
      penalty += 10
    }

    // Проверка на запрет markdown блоков
    const hasMarkdownWarning = /не.*оборачивай|do not.*wrap|НЕ.*markdown/i.test(content)
    if (!hasMarkdownWarning) {
      issues.push({
        type: 'warning',
        code: 'NO_MARKDOWN_WARNING',
        message: 'JSON prompt should explicitly warn against markdown wrapping',
        severity: 5
      })
      penalty += 8
    }

    return { issues, penalty }
  }

  /**
   * Валидирует количество токенов
   */
  private static validateTokenCount(content: string): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    const tokenCount = Math.ceil(content.length / 4) // Приблизительная оценка
    
    if (tokenCount > 2000) {
      issues.push({
        type: 'warning',
        code: 'HIGH_TOKEN_COUNT',
        message: `High token count (${tokenCount}), may impact performance`,
        severity: 4
      })
      penalty += 5
    }

    if (tokenCount < 50) {
      issues.push({
        type: 'warning',
        code: 'LOW_TOKEN_COUNT',
        message: `Very low token count (${tokenCount}), prompt may be too simple`,
        severity: 5
      })
      penalty += 10
    }

    return { issues, penalty }
  }

  /**
   * Валидирует против стабильного промпта
   */
  private static validateAgainstStable(content: string, promptType: PromptType): { issues: ValidationIssue[], penalty: number } {
    const issues: ValidationIssue[] = []
    let penalty = 0

    try {
      const stableValidation = StablePromptsLoader.validateAgainstStable(content, promptType)
      
      if (!stableValidation.isValid) {
        issues.push({
          type: 'warning',
          code: 'DIFFERS_FROM_STABLE',
          message: `Differs significantly from stable prompt (similarity: ${stableValidation.similarity}%)`,
          severity: 6
        })
        penalty += Math.max(0, 20 - stableValidation.similarity / 5)
      }

      if (stableValidation.issues.length > 0) {
        issues.push({
          type: 'info',
          code: 'STABLE_COMPARISON_ISSUES',
          message: `Issues compared to stable: ${stableValidation.issues.join('; ')}`,
          severity: 3
        })
      }
    } catch (error) {
      issues.push({
        type: 'info',
        code: 'STABLE_COMPARISON_FAILED',
        message: 'Could not compare with stable prompt',
        severity: 2
      })
    }

    return { issues, penalty }
  }

  /**
   * Определяет язык контента
   */
  private static detectLanguage(content: string): 'ru' | 'en' | 'unknown' {
    const russianChars = (content.match(/[а-яё]/gi) || []).length
    const englishChars = (content.match(/[a-z]/gi) || []).length
    const totalChars = russianChars + englishChars

    if (totalChars === 0) return 'unknown'

    const russianRatio = russianChars / totalChars
    
    if (russianRatio > 0.6) return 'ru'
    if (russianRatio < 0.4) return 'en'
    return 'unknown'
  }

  /**
   * Получает обязательные элементы для типа промпта
   */
  private static getRequiredElementsForType(promptType: PromptType): string[] {
    const requirements: Record<PromptType, string[]> = {
      [PromptType.MAIN]: ['анализ|analysis', 'интерфейс|interface', 'UX'],
      [PromptType.JSON_STRUCTURED]: ['JSON', 'screenDescription', 'uxSurvey'],
      [PromptType.SONOMA_STRUCTURED]: ['структурированный|structured', 'анализ|analysis'],
      [PromptType.AB_TEST]: ['A/B', 'тест|test', 'конверсия|conversion'],
      [PromptType.BUSINESS_ANALYTICS]: ['бизнес|business', 'аналитика|analytics', 'метрики|metrics'],
      [PromptType.HYPOTHESES]: ['гипотеза|hypothesis', 'улучшение|improvement']
    }

    return requirements[promptType] || []
  }

  /**
   * Генерирует рекомендации на основе найденных проблем
   */
  private static generateRecommendations(
    issues: ValidationIssue[],
    content: string,
    promptType: PromptType
  ): string[] {
    const recommendations: string[] = []

    // Рекомендации на основе типов проблем
    const errorCodes = issues.map(issue => issue.code)

    if (errorCodes.includes('EMPTY_PROMPT')) {
      recommendations.push('Add content to the prompt with clear analysis instructions')
    }

    if (errorCodes.includes('PROMPT_TOO_SHORT')) {
      recommendations.push('Expand the prompt with more detailed instructions and examples')
    }

    if (errorCodes.includes('LANGUAGE_MISMATCH')) {
      recommendations.push('Ensure the prompt is written in the correct language')
    }

    if (errorCodes.includes('MISSING_REQUIRED_ELEMENTS')) {
      recommendations.push(`Add required elements for ${promptType} prompt type`)
    }

    if (errorCodes.includes('MISSING_JSON_FIELDS') && promptType === PromptType.JSON_STRUCTURED) {
      recommendations.push('Include all required JSON structure fields in the prompt')
      recommendations.push('Add explicit instructions about JSON format requirements')
    }

    if (errorCodes.includes('NO_CLEAR_INSTRUCTIONS')) {
      recommendations.push('Add clear, specific instructions for the analysis task')
    }

    if (errorCodes.includes('DIFFERS_FROM_STABLE')) {
      recommendations.push('Consider using the stable prompt version as a reference')
      recommendations.push('Ensure changes maintain the quality and structure of the stable version')
    }

    // Общие рекомендации
    if (recommendations.length === 0 && issues.length > 0) {
      recommendations.push('Review and address the identified issues to improve prompt quality')
    }

    return recommendations
  }

  /**
   * Быстрая проверка валидности промпта
   */
  static async quickValidate(content: string, promptType: PromptType): Promise<boolean> {
    if (!content || content.trim().length < this.MIN_PROMPT_LENGTH) {
      return false
    }

    const requiredElements = this.getRequiredElementsForType(promptType)
    const hasRequiredElements = requiredElements.some(element => 
      new RegExp(element, 'i').test(content)
    )

    return hasRequiredElements
  }

  /**
   * Создает отчет о валидации в текстовом формате
   */
  static formatValidationReport(result: PromptValidationResult): string {
    const status = result.isValid ? '✅ VALID' : '❌ INVALID'
    const lines = [
      `Prompt Validation Report ${status}`,
      '='.repeat(40),
      `Score: ${result.score}/100`,
      `Language: ${result.metadata.language}`,
      `Type: ${result.metadata.promptType}`,
      `Token Count: ${result.metadata.tokenCount}`,
      `Validated: ${result.metadata.validatedAt}`,
      ''
    ]

    if (result.issues.length > 0) {
      lines.push('Issues:')
      result.issues.forEach(issue => {
        const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️'
        lines.push(`  ${icon} [${issue.code}] ${issue.message} (severity: ${issue.severity})`)
      })
      lines.push('')
    }

    if (result.recommendations.length > 0) {
      lines.push('Recommendations:')
      result.recommendations.forEach(rec => {
        lines.push(`  💡 ${rec}`)
      })
    }

    return lines.join('\n')
  }
}