/**
 * Автоматическое исправление языковых несоответствий
 */

import { LanguageContext } from './language-manager'
import { ResponseQualityAnalyzer, QualityMetrics } from './quality-metrics'

export interface CorrectionResult {
  originalText: string
  correctedText: string
  corrections: Correction[]
  qualityImprovement: number
  success: boolean
}

export interface Correction {
  type: 'language_enforcement' | 'completeness_fix' | 'structure_improvement' | 'token_optimization'
  description: string
  applied: boolean
  impact: 'low' | 'medium' | 'high'
}

export class LanguageAutoCorrector {
  /**
   * Автоматически исправляет промпт для улучшения качества ответа
   */
  static async correctPrompt(
    originalPrompt: string,
    languageContext: LanguageContext,
    qualityIssues: string[]
  ): Promise<CorrectionResult> {
    console.log('🔧 Starting automatic prompt correction...')
    
    let correctedPrompt = originalPrompt
    const corrections: Correction[] = []
    
    // 1. Исправляем языковые проблемы
    if (this.hasLanguageIssues(qualityIssues)) {
      const languageCorrection = this.applyLanguageEnforcement(correctedPrompt, languageContext.responseLanguage)
      correctedPrompt = languageCorrection.text
      corrections.push({
        type: 'language_enforcement',
        description: `Added strict ${languageContext.responseLanguage} language enforcement`,
        applied: languageCorrection.applied,
        impact: 'high'
      })
    }

    // 2. Исправляем проблемы с полнотой
    if (this.hasCompletenessIssues(qualityIssues)) {
      const completenessCorrection = this.applyCompletenessEnforcement(correctedPrompt, languageContext.responseLanguage)
      correctedPrompt = completenessCorrection.text
      corrections.push({
        type: 'completeness_fix',
        description: 'Added completeness and anti-truncation instructions',
        applied: completenessCorrection.applied,
        impact: 'high'
      })
    }

    // 3. Улучшаем структуру
    if (this.hasStructureIssues(qualityIssues)) {
      const structureCorrection = this.applyStructureImprovement(correctedPrompt, languageContext.responseLanguage)
      correctedPrompt = structureCorrection.text
      corrections.push({
        type: 'structure_improvement',
        description: 'Enhanced response structure requirements',
        applied: structureCorrection.applied,
        impact: 'medium'
      })
    }

    // 4. Оптимизируем токены
    const tokenCorrection = this.optimizeTokenUsage(correctedPrompt)
    correctedPrompt = tokenCorrection.text
    if (tokenCorrection.applied) {
      corrections.push({
        type: 'token_optimization',
        description: 'Optimized prompt for better token efficiency',
        applied: true,
        impact: 'low'
      })
    }

    // Измеряем улучшение качества
    const originalQuality = ResponseQualityAnalyzer.measureQuality(originalPrompt, languageContext.responseLanguage as 'ru' | 'en')
    const correctedQuality = ResponseQualityAnalyzer.measureQuality(correctedPrompt, languageContext.responseLanguage as 'ru' | 'en')
    const qualityImprovement = correctedQuality.qualityScore - originalQuality.qualityScore

    const result: CorrectionResult = {
      originalText: originalPrompt,
      correctedText: correctedPrompt,
      corrections: corrections.filter(c => c.applied),
      qualityImprovement,
      success: corrections.some(c => c.applied)
    }

    console.log(`🔧 Correction completed. Applied ${result.corrections.length} corrections, quality improvement: ${qualityImprovement}`)
    
    return result
  }

  /**
   * Применяет строгое соблюдение языка
   */
  private static applyLanguageEnforcement(
    prompt: string, 
    language: string
  ): { text: string; applied: boolean } {
    const enforcementInstructions = {
      'ru': `

**🚨 КРИТИЧЕСКИ ВАЖНО - ЯЗЫКОВЫЕ ТРЕБОВАНИЯ:**
- Отвечай ИСКЛЮЧИТЕЛЬНО на русском языке
- ВСЕ разделы анализа должны быть на русском
- НЕ используй английские слова (кроме UX, UI, API)
- НЕ смешивай языки в одном ответе
- Если видишь английский текст в своем ответе - ИСПРАВЬ на русский
- Проверь КАЖДОЕ слово перед отправкой ответа`,

      'en': `

**🚨 CRITICALLY IMPORTANT - LANGUAGE REQUIREMENTS:**
- Respond EXCLUSIVELY in English language
- ALL analysis sections must be in English
- DO NOT use Russian words or phrases
- DO NOT mix languages in the response
- If you see Russian text in your response - FIX it to English
- Check EVERY word before sending the response`
    }

    const instruction = enforcementInstructions[language as keyof typeof enforcementInstructions]
    if (!instruction) return { text: prompt, applied: false }

    // Проверяем, нет ли уже такой инструкции
    if (prompt.includes('ЯЗЫКОВЫЕ ТРЕБОВАНИЯ') || prompt.includes('LANGUAGE REQUIREMENTS')) {
      return { text: prompt, applied: false }
    }

    return {
      text: prompt + instruction,
      applied: true
    }
  }

  /**
   * Применяет требования к полноте ответа
   */
  private static applyCompletenessEnforcement(
    prompt: string,
    language: string
  ): { text: string; applied: boolean } {
    const completenessInstructions = {
      'ru': `

**📋 ТРЕБОВАНИЯ К ПОЛНОТЕ ОТВЕТА:**
- Предоставь ПОЛНЫЙ и ДЕТАЛЬНЫЙ анализ (минимум 2000 символов)
- НЕ сокращай разделы и НЕ используй "..." или "и т.д."
- Включи ВСЕ обязательные разделы полностью
- Завершай каждый раздел законченными предложениями
- НЕ обрывай ответ на середине - доведи до логического конца
- Если места не хватает - сократи примеры, но НЕ основной анализ`,

      'en': `

**📋 RESPONSE COMPLETENESS REQUIREMENTS:**
- Provide COMPLETE and DETAILED analysis (minimum 2000 characters)
- DO NOT truncate sections or use "..." or "etc."
- Include ALL required sections completely
- End each section with complete sentences
- DO NOT cut off response mid-sentence - finish logically
- If space is limited - reduce examples, but NOT main analysis`
    }

    const instruction = completenessInstructions[language as keyof typeof completenessInstructions]
    if (!instruction) return { text: prompt, applied: false }

    // Проверяем, нет ли уже такой инструкции
    if (prompt.includes('ПОЛНОТЕ ОТВЕТА') || prompt.includes('COMPLETENESS REQUIREMENTS')) {
      return { text: prompt, applied: false }
    }

    return {
      text: prompt + instruction,
      applied: true
    }
  }

  /**
   * Улучшает требования к структуре
   */
  private static applyStructureImprovement(
    prompt: string,
    language: string
  ): { text: string; applied: boolean } {
    const structureInstructions = {
      'ru': `

**🏗️ ТРЕБОВАНИЯ К СТРУКТУРЕ:**
- Используй четкие заголовки для каждого раздела
- Применяй нумерованные списки для рекомендаций
- Выделяй ключевые моменты жирным шрифтом
- Структурируй информацию логично и последовательно`,

      'en': `

**🏗️ STRUCTURE REQUIREMENTS:**
- Use clear headings for each section
- Apply numbered lists for recommendations
- Highlight key points with bold formatting
- Structure information logically and sequentially`
    }

    const instruction = structureInstructions[language as keyof typeof structureInstructions]
    if (!instruction) return { text: prompt, applied: false }

    // Проверяем, нет ли уже такой инструкции
    if (prompt.includes('СТРУКТУРЕ') || prompt.includes('STRUCTURE REQUIREMENTS')) {
      return { text: prompt, applied: false }
    }

    return {
      text: prompt + instruction,
      applied: true
    }
  }

  /**
   * Оптимизирует использование токенов
   */
  private static optimizeTokenUsage(prompt: string): { text: string; applied: boolean } {
    let optimizedPrompt = prompt
    let applied = false

    // Удаляем избыточные пробелы и переносы
    const cleanedPrompt = prompt.replace(/\n{3,}/g, '\n\n').replace(/\s{2,}/g, ' ').trim()
    if (cleanedPrompt !== prompt) {
      optimizedPrompt = cleanedPrompt
      applied = true
    }

    // Удаляем дублирующиеся инструкции
    const lines = optimizedPrompt.split('\n')
    const uniqueLines = lines.filter((line, index) => {
      const trimmedLine = line.trim()
      if (trimmedLine === '') return true
      return lines.findIndex(l => l.trim() === trimmedLine) === index
    })

    if (uniqueLines.length !== lines.length) {
      optimizedPrompt = uniqueLines.join('\n')
      applied = true
    }

    return { text: optimizedPrompt, applied }
  }

  /**
   * Проверяет наличие языковых проблем
   */
  private static hasLanguageIssues(issues: string[]): boolean {
    return issues.some(issue => 
      issue.toLowerCase().includes('language') ||
      issue.toLowerCase().includes('язык') ||
      issue.toLowerCase().includes('mismatch')
    )
  }

  /**
   * Проверяет наличие проблем с полнотой
   */
  private static hasCompletenessIssues(issues: string[]): boolean {
    return issues.some(issue => 
      issue.toLowerCase().includes('truncated') ||
      issue.toLowerCase().includes('обрезан') ||
      issue.toLowerCase().includes('incomplete') ||
      issue.toLowerCase().includes('short')
    )
  }

  /**
   * Проверяет наличие проблем со структурой
   */
  private static hasStructureIssues(issues: string[]): boolean {
    return issues.some(issue => 
      issue.toLowerCase().includes('structure') ||
      issue.toLowerCase().includes('структур') ||
      issue.toLowerCase().includes('format')
    )
  }

  /**
   * Создает отчет о коррекции
   */
  static generateCorrectionReport(result: CorrectionResult): string {
    const lines = [
      'Prompt Correction Report',
      '='.repeat(30),
      `Success: ${result.success ? '✅' : '❌'}`,
      `Quality Improvement: ${result.qualityImprovement > 0 ? '+' : ''}${result.qualityImprovement}`,
      `Corrections Applied: ${result.corrections.length}`,
      ''
    ]

    if (result.corrections.length > 0) {
      lines.push('Applied Corrections:')
      result.corrections.forEach((correction, index) => {
        const impact = correction.impact === 'high' ? '🔴' : correction.impact === 'medium' ? '🟡' : '🟢'
        lines.push(`  ${index + 1}. ${impact} ${correction.description}`)
      })
      lines.push('')
    }

    lines.push(`Original Length: ${result.originalText.length} chars`)
    lines.push(`Corrected Length: ${result.correctedText.length} chars`)
    lines.push(`Length Change: ${result.correctedText.length - result.originalText.length} chars`)

    return lines.join('\n')
  }

  /**
   * Применяет экстренную коррекцию для критических проблем
   */
  static applyEmergencyCorrection(
    prompt: string,
    language: string,
    criticalIssues: string[]
  ): string {
    let correctedPrompt = prompt

    // Экстренная языковая коррекция
    if (criticalIssues.some(issue => issue.includes('language'))) {
      const emergencyLanguageInstruction = language === 'ru' 
        ? '\n\n🚨 ЭКСТРЕННО: Отвечай ТОЛЬКО на русском языке! Проверь каждое слово!'
        : '\n\n🚨 EMERGENCY: Respond ONLY in English! Check every word!'
      
      correctedPrompt += emergencyLanguageInstruction
    }

    // Экстренная коррекция обрезания
    if (criticalIssues.some(issue => issue.includes('truncated'))) {
      const emergencyCompletenessInstruction = language === 'ru'
        ? '\n\n🚨 ЭКСТРЕННО: НЕ обрывай ответ! Доведи до конца!'
        : '\n\n🚨 EMERGENCY: DO NOT truncate response! Complete it fully!'
      
      correctedPrompt += emergencyCompletenessInstruction
    }

    return correctedPrompt
  }
}