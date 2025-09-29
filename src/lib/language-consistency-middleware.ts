/**
 * Middleware для контроля языковой консистентности во всех API запросах
 */

import { NextRequest, NextResponse } from 'next/server'
import { LanguageManager, LanguageContext } from './language-manager'
import { ResponseQualityAnalyzer } from './quality-metrics'

export interface LanguageConsistencyConfig {
  enforceLanguage: boolean
  logInconsistencies: boolean
  rejectInconsistentResponses: boolean
  minQualityScore: number
}

export interface LanguageConsistencyResult {
  isConsistent: boolean
  languageContext: LanguageContext
  qualityScore: number
  issues: string[]
  correctionApplied: boolean
}

export class LanguageConsistencyMiddleware {
  private static readonly DEFAULT_CONFIG: LanguageConsistencyConfig = {
    enforceLanguage: true,
    logInconsistencies: true,
    rejectInconsistentResponses: false, // Не отклоняем, а исправляем
    minQualityScore: 70
  }

  /**
   * Обрабатывает входящий запрос и определяет языковой контекст
   */
  static async processRequest(
    request: NextRequest,
    config: Partial<LanguageConsistencyConfig> = {}
  ): Promise<{
    languageContext: LanguageContext
    enhancedRequest: NextRequest
  }> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    console.log('🌐 Processing request for language consistency...')
    
    // Определяем языковой контекст
    const languageContext = await LanguageManager.determineAnalysisLanguage(request)
    
    // Логируем контекст если включено
    if (finalConfig.logInconsistencies) {
      LanguageManager.logLanguageContext(languageContext, 'Request Processing')
    }

    // Создаем улучшенный запрос с языковыми заголовками
    const enhancedRequest = this.enhanceRequestWithLanguage(request, languageContext)

    return {
      languageContext,
      enhancedRequest
    }
  }

  /**
   * Валидирует ответ на языковую консистентность
   */
  static async validateResponse(
    response: string,
    languageContext: LanguageContext,
    config: Partial<LanguageConsistencyConfig> = {}
  ): Promise<LanguageConsistencyResult> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config }
    
    console.log('🔍 Validating response language consistency...')
    
    // Измеряем качество ответа
    const qualityMetrics = ResponseQualityAnalyzer.measureQuality(
      response,
      languageContext.responseLanguage as 'ru' | 'en'
    )

    // Проверяем языковую консистентность
    const languageValidation = LanguageManager.validateLanguageConsistency(
      '',
      response,
      languageContext.responseLanguage
    )

    const issues: string[] = []
    let correctionApplied = false

    // Проверяем качество
    if (qualityMetrics.qualityScore < finalConfig.minQualityScore) {
      issues.push(`Quality score ${qualityMetrics.qualityScore} below minimum ${finalConfig.minQualityScore}`)
    }

    // Проверяем языковую консистентность
    if (!languageValidation.isConsistent) {
      issues.push(...languageValidation.issues)
    }

    // Проверяем обрезание
    if (qualityMetrics.isTruncated) {
      issues.push('Response appears to be truncated')
    }

    const result: LanguageConsistencyResult = {
      isConsistent: issues.length === 0,
      languageContext,
      qualityScore: qualityMetrics.qualityScore,
      issues,
      correctionApplied
    }

    // Логируем если есть проблемы
    if (finalConfig.logInconsistencies && issues.length > 0) {
      console.warn('⚠️ Language consistency issues detected:', issues)
      this.logInconsistency(result)
    }

    return result
  }

  /**
   * Исправляет языковые несоответствия в промпте
   */
  static correctPromptLanguage(
    prompt: string,
    targetLanguage: string,
    issues: string[]
  ): { correctedPrompt: string; correctionApplied: boolean } {
    let correctedPrompt = prompt
    let correctionApplied = false

    // Добавляем строгие языковые инструкции если есть проблемы с языком
    if (issues.some(issue => issue.includes('language') || issue.includes('язык'))) {
      const languageEnforcement = this.getLanguageEnforcementInstruction(targetLanguage)
      correctedPrompt = `${prompt}\n\n${languageEnforcement}`
      correctionApplied = true
      
      console.log('🔧 Applied language enforcement to prompt')
    }

    // Добавляем инструкции против обрезания если есть проблемы с полнотой
    if (issues.some(issue => issue.includes('truncated') || issue.includes('обрезан'))) {
      const completenessInstruction = this.getCompletenessInstruction(targetLanguage)
      correctedPrompt = `${correctedPrompt}\n\n${completenessInstruction}`
      correctionApplied = true
      
      console.log('🔧 Applied completeness instruction to prompt')
    }

    return { correctedPrompt, correctionApplied }
  }

  /**
   * Создает отчет о языковой консистентности
   */
  static generateConsistencyReport(
    results: LanguageConsistencyResult[],
    timeframe: string = '24h'
  ): string {
    const totalRequests = results.length
    const consistentRequests = results.filter(r => r.isConsistent).length
    const averageQuality = results.reduce((sum, r) => sum + r.qualityScore, 0) / totalRequests
    const commonIssues = this.analyzeCommonIssues(results)

    const lines = [
      `Language Consistency Report (${timeframe})`,
      '='.repeat(50),
      `Total Requests: ${totalRequests}`,
      `Consistent Requests: ${consistentRequests} (${Math.round(consistentRequests / totalRequests * 100)}%)`,
      `Average Quality Score: ${Math.round(averageQuality)}`,
      '',
      'Common Issues:',
      ...commonIssues.map(issue => `  - ${issue.issue}: ${issue.count} times`),
      '',
      'Language Distribution:',
      ...this.getLanguageDistribution(results).map(lang => `  - ${lang.language}: ${lang.count} requests`),
      ''
    ]

    return lines.join('\n')
  }

  /**
   * Добавляет языковые заголовки к запросу
   */
  private static enhanceRequestWithLanguage(
    request: NextRequest,
    languageContext: LanguageContext
  ): NextRequest {
    // Клонируем заголовки
    const headers = new Headers(request.headers)
    
    // Добавляем языковые заголовки
    headers.set('X-Analysis-Language', languageContext.promptLanguage)
    headers.set('X-Response-Language', languageContext.responseLanguage)
    headers.set('X-Language-Source', languageContext.source)

    // Создаем новый запрос с обновленными заголовками
    return new NextRequest(request.url, {
      method: request.method,
      headers,
      body: request.body
    })
  }

  /**
   * Получает инструкцию для принудительного соблюдения языка
   */
  private static getLanguageEnforcementInstruction(language: string): string {
    const instructions = {
      'ru': `**КРИТИЧЕСКИ ВАЖНО - ЯЗЫКОВЫЕ ТРЕБОВАНИЯ:**
- Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке
- Все разделы анализа должны быть на русском
- НЕ используй английские слова кроме технических терминов
- НЕ смешивай языки в одном ответе
- Проверь что весь текст на русском перед отправкой`,

      'en': `**CRITICALLY IMPORTANT - LANGUAGE REQUIREMENTS:**
- Respond EXCLUSIVELY in English
- All analysis sections must be in English
- DO NOT use Russian words or phrases
- DO NOT mix languages in the response
- Verify all text is in English before sending`
    }

    return instructions[language as keyof typeof instructions] || instructions['en']
  }

  /**
   * Получает инструкцию для обеспечения полноты ответа
   */
  private static getCompletenessInstruction(language: string): string {
    const instructions = {
      'ru': `**ТРЕБОВАНИЯ К ПОЛНОТЕ ОТВЕТА:**
- Предоставь ПОЛНЫЙ и ДЕТАЛЬНЫЙ анализ
- НЕ сокращай разделы и НЕ используй "..."
- Включи ВСЕ обязательные разделы
- Завершай каждый раздел полным предложением
- Минимальная длина ответа: 1500 символов`,

      'en': `**RESPONSE COMPLETENESS REQUIREMENTS:**
- Provide COMPLETE and DETAILED analysis
- DO NOT truncate sections or use "..."
- Include ALL required sections
- End each section with complete sentences
- Minimum response length: 1500 characters`
    }

    return instructions[language as keyof typeof instructions] || instructions['en']
  }

  /**
   * Логирует случай языковой несогласованности
   */
  private static logInconsistency(result: LanguageConsistencyResult): void {
    const logData = {
      timestamp: new Date().toISOString(),
      isConsistent: result.isConsistent,
      qualityScore: result.qualityScore,
      issues: result.issues,
      languageContext: result.languageContext,
      correctionApplied: result.correctionApplied
    }

    console.warn('⚠️ Language Inconsistency Log:', JSON.stringify(logData, null, 2))
  }

  /**
   * Анализирует частые проблемы
   */
  private static analyzeCommonIssues(results: LanguageConsistencyResult[]): Array<{issue: string, count: number}> {
    const issueCount: Record<string, number> = {}

    results.forEach(result => {
      result.issues.forEach(issue => {
        // Группируем похожие проблемы
        const normalizedIssue = this.normalizeIssue(issue)
        issueCount[normalizedIssue] = (issueCount[normalizedIssue] || 0) + 1
      })
    })

    return Object.entries(issueCount)
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Топ 5 проблем
  }

  /**
   * Нормализует описание проблемы для группировки
   */
  private static normalizeIssue(issue: string): string {
    if (issue.includes('language') || issue.includes('язык')) {
      return 'Language mismatch'
    }
    if (issue.includes('truncated') || issue.includes('обрезан')) {
      return 'Response truncated'
    }
    if (issue.includes('quality') || issue.includes('качество')) {
      return 'Low quality score'
    }
    if (issue.includes('short') || issue.includes('короткий')) {
      return 'Response too short'
    }
    return issue
  }

  /**
   * Получает распределение по языкам
   */
  private static getLanguageDistribution(results: LanguageConsistencyResult[]): Array<{language: string, count: number}> {
    const langCount: Record<string, number> = {}

    results.forEach(result => {
      const lang = result.languageContext.responseLanguage
      langCount[lang] = (langCount[lang] || 0) + 1
    })

    return Object.entries(langCount)
      .map(([language, count]) => ({ language, count }))
      .sort((a, b) => b.count - a.count)
  }

  /**
   * Создает middleware функцию для Next.js
   */
  static createMiddleware(config: Partial<LanguageConsistencyConfig> = {}) {
    return async (request: NextRequest) => {
      const { languageContext, enhancedRequest } = await this.processRequest(request, config)
      
      // Добавляем языковой контекст в заголовки для использования в API routes
      enhancedRequest.headers.set('X-Language-Context', JSON.stringify(languageContext))
      
      return enhancedRequest
    }
  }
}