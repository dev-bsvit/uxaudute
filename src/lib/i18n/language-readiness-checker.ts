/**
 * Утилита для проверки готовности языковой системы
 */

import { languageInitializer } from './language-initializer'
import { translationService } from './translation-service'
import { promptService } from './prompt-service'
import { DEFAULT_LANGUAGE, SUPPORTED_LANGUAGES } from './types'

export interface ReadinessCheckResult {
  isReady: boolean
  language: string
  checks: {
    initialization: boolean
    translations: boolean
    prompts: boolean
    userSettings: boolean
  }
  errors: string[]
  warnings: string[]
}

export class LanguageReadinessChecker {
  private static instance: LanguageReadinessChecker

  static getInstance(): LanguageReadinessChecker {
    if (!LanguageReadinessChecker.instance) {
      LanguageReadinessChecker.instance = new LanguageReadinessChecker()
    }
    return LanguageReadinessChecker.instance
  }

  /**
   * Выполняет полную проверку готовности языковой системы
   */
  async checkReadiness(language?: string): Promise<ReadinessCheckResult> {
    const targetLanguage = language || DEFAULT_LANGUAGE
    const errors: string[] = []
    const warnings: string[] = []
    
    const checks = {
      initialization: false,
      translations: false,
      prompts: false,
      userSettings: false
    }

    try {
      // 1. Проверяем инициализацию системы
      checks.initialization = languageInitializer.isSystemInitialized()
      if (!checks.initialization) {
        warnings.push('Language system is not initialized')
      }

      // 2. Проверяем доступность переводов
      try {
        const testTranslation = translationService.getTranslation('common.loading', targetLanguage)
        checks.translations = testTranslation !== `[common.loading]`
        
        if (!checks.translations) {
          errors.push(`Translations not available for language: ${targetLanguage}`)
        }
      } catch (error) {
        errors.push(`Translation check failed: ${error}`)
      }

      // 3. Проверяем доступность промптов
      try {
        const availablePrompts = await promptService.getAvailablePrompts(targetLanguage)
        checks.prompts = availablePrompts.length > 0
        
        if (!checks.prompts) {
          warnings.push(`No prompts available for language: ${targetLanguage}`)
        }
      } catch (error) {
        warnings.push(`Prompt check failed: ${error}`)
      }

      // 4. Проверяем пользовательские настройки
      try {
        if (typeof window !== 'undefined') {
          const savedLanguage = localStorage.getItem('preferred_language')
          checks.userSettings = savedLanguage !== null
          
          if (!checks.userSettings) {
            warnings.push('No user language preference saved')
          }
        }
      } catch (error) {
        warnings.push(`User settings check failed: ${error}`)
      }

    } catch (error) {
      errors.push(`Readiness check failed: ${error}`)
    }

    const isReady = checks.initialization && checks.translations && errors.length === 0

    return {
      isReady,
      language: targetLanguage,
      checks,
      errors,
      warnings
    }
  }

  /**
   * Быстрая проверка готовности (только критичные компоненты)
   */
  async quickReadinessCheck(language?: string): Promise<boolean> {
    try {
      const targetLanguage = language || DEFAULT_LANGUAGE
      
      // Проверяем только критичные компоненты
      const hasTranslations = translationService.getTranslation('common.loading', targetLanguage) !== `[common.loading]`
      const isInitialized = languageInitializer.isSystemInitialized()
      
      return hasTranslations && isInitialized
    } catch (error) {
      console.warn('Quick readiness check failed:', error)
      return false
    }
  }

  /**
   * Проверяет готовность для всех поддерживаемых языков
   */
  async checkAllLanguagesReadiness(): Promise<Record<string, ReadinessCheckResult>> {
    const results: Record<string, ReadinessCheckResult> = {}
    
    for (const language of SUPPORTED_LANGUAGES) {
      try {
        results[language.code] = await this.checkReadiness(language.code)
      } catch (error) {
        results[language.code] = {
          isReady: false,
          language: language.code,
          checks: {
            initialization: false,
            translations: false,
            prompts: false,
            userSettings: false
          },
          errors: [`Failed to check readiness: ${error}`],
          warnings: []
        }
      }
    }
    
    return results
  }

  /**
   * Ожидает готовности языковой системы
   */
  async waitForReadiness(
    language?: string, 
    timeout = 10000,
    checkInterval = 100
  ): Promise<ReadinessCheckResult> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const result = await this.checkReadiness(language)
      
      if (result.isReady) {
        return result
      }
      
      // Ждем перед следующей проверкой
      await new Promise(resolve => setTimeout(resolve, checkInterval))
    }
    
    throw new Error(`Language system readiness timeout after ${timeout}ms`)
  }

  /**
   * Создает отчет о готовности системы
   */
  async generateReadinessReport(): Promise<string> {
    const allResults = await this.checkAllLanguagesReadiness()
    
    const report = {
      timestamp: new Date().toISOString(),
      systemInitialized: languageInitializer.isSystemInitialized(),
      supportedLanguages: SUPPORTED_LANGUAGES.map(lang => lang.code),
      languageResults: allResults,
      summary: {
        totalLanguages: SUPPORTED_LANGUAGES.length,
        readyLanguages: Object.values(allResults).filter(r => r.isReady).length,
        languagesWithErrors: Object.values(allResults).filter(r => r.errors.length > 0).length,
        languagesWithWarnings: Object.values(allResults).filter(r => r.warnings.length > 0).length
      }
    }
    
    return JSON.stringify(report, null, 2)
  }
}

// Экспортируем singleton instance
export const languageReadinessChecker = LanguageReadinessChecker.getInstance()