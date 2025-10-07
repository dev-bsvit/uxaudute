/**
 * Сервис для инициализации языковой системы при запуске приложения
 */

import { languageDetector, LanguageDetectionResult } from './language-detector'
import { translationService } from './translation-service'
import { promptService } from './prompt-service'
import { userSettingsService } from './user-settings'
import { errorHandler, ErrorType } from './error-handler'
import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE } from './types'

export interface InitializationResult {
  language: string
  detectionResult: LanguageDetectionResult
  translationsLoaded: boolean
  promptsLoaded: boolean
  userPreferenceSynced: boolean
  initializationTime: number
  errors: string[]
}

export class LanguageInitializer {
  private static instance: LanguageInitializer
  private isInitialized = false
  private initializationPromise: Promise<InitializationResult> | null = null

  static getInstance(): LanguageInitializer {
    if (!LanguageInitializer.instance) {
      LanguageInitializer.instance = new LanguageInitializer()
    }
    return LanguageInitializer.instance
  }

  /**
   * Инициализирует языковую систему
   */
  async initialize(): Promise<InitializationResult> {
    // Если уже инициализируется, возвращаем существующий промис
    if (this.initializationPromise) {
      return this.initializationPromise
    }

    // Если уже инициализирован, возвращаем кэшированный результат
    if (this.isInitialized) {
      return this.getCachedResult()
    }

    // Начинаем инициализацию
    this.initializationPromise = this.performInitialization()
    
    try {
      const result = await this.initializationPromise
      this.isInitialized = true
      return result
    } catch (error) {
      // Сбрасываем промис при ошибке, чтобы можно было повторить попытку
      this.initializationPromise = null
      throw error
    }
  }

  /**
   * Выполняет инициализацию
   */
  private async performInitialization(): Promise<InitializationResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      console.log('🌐 Starting language system initialization...')

      // 1. Определяем предпочтительный язык
      const detectionResult = await languageDetector.detectLanguage()
      console.log('🔍 Language detected:', detectionResult)

      // 2. Предзагружаем переводы для определенного языка
      let translationsLoaded = false
      try {
        await translationService.preloadTranslations(detectionResult.language)
        translationsLoaded = true
        console.log('📚 Translations loaded for:', detectionResult.language)
      } catch (error) {
        errors.push(`Failed to load translations: ${error}`)
        console.warn('⚠️ Failed to load translations for:', detectionResult.language)
      }

      // 3. Предзагружаем fallback переводы если нужно
      if (detectionResult.language !== FALLBACK_LANGUAGE) {
        try {
          await translationService.preloadTranslations(FALLBACK_LANGUAGE)
          console.log('📚 Fallback translations loaded for:', FALLBACK_LANGUAGE)
        } catch (error) {
          errors.push(`Failed to load fallback translations: ${error}`)
          console.warn('⚠️ Failed to load fallback translations')
        }
      }

      // 4. Пропускаем предзагрузку промптов на лендинге (они загружаются по требованию)
      // Это ускоряет загрузку лендинга на 10+ секунд
      let promptsLoaded = false
      console.log('⏩ Skipping prompts preload for faster landing page')

      // 6. Синхронизируем настройки пользователя
      let userPreferenceSynced = false
      try {
        await userSettingsService.syncLanguageSettings()
        userPreferenceSynced = true
        console.log('👤 User preferences synced')
      } catch (error) {
        errors.push(`Failed to sync user preferences: ${error}`)
        console.warn('⚠️ Failed to sync user preferences:', error)
      }

      // 7. Сохраняем выбранный язык в localStorage для быстрого доступа
      try {
        userSettingsService.saveToLocalStorage(detectionResult.language)
      } catch (error) {
        errors.push(`Failed to save to localStorage: ${error}`)
        console.warn('⚠️ Failed to save language to localStorage:', error)
      }

      const initializationTime = Date.now() - startTime
      
      const result: InitializationResult = {
        language: detectionResult.language,
        detectionResult,
        translationsLoaded,
        promptsLoaded,
        userPreferenceSynced,
        initializationTime,
        errors
      }

      console.log('✅ Language system initialized successfully:', result)
      return result

    } catch (error) {
      const initializationTime = Date.now() - startTime
      
      errorHandler.createError(
        ErrorType.GENERAL_UNKNOWN_ERROR,
        { context: 'language_initialization' },
        error as Error
      )

      // Возвращаем результат с ошибкой, но с базовыми настройками
      const fallbackResult: InitializationResult = {
        language: DEFAULT_LANGUAGE,
        detectionResult: {
          language: DEFAULT_LANGUAGE,
          source: 'default',
          confidence: 0.0
        },
        translationsLoaded: false,
        promptsLoaded: false,
        userPreferenceSynced: false,
        initializationTime,
        errors: [...errors, `Critical initialization error: ${error}`]
      }

      console.error('❌ Language system initialization failed:', fallbackResult)
      return fallbackResult
    }
  }

  /**
   * Возвращает кэшированный результат инициализации
   */
  private getCachedResult(): InitializationResult {
    // В реальном приложении здесь бы был кэшированный результат
    // Для простоты возвращаем базовый результат
    return {
      language: DEFAULT_LANGUAGE,
      detectionResult: {
        language: DEFAULT_LANGUAGE,
        source: 'default',
        confidence: 1.0
      },
      translationsLoaded: true,
      promptsLoaded: true,
      userPreferenceSynced: true,
      initializationTime: 0,
      errors: []
    }
  }

  /**
   * Проверяет, инициализирована ли система
   */
  isSystemInitialized(): boolean {
    return this.isInitialized
  }

  /**
   * Сбрасывает состояние инициализации (для тестов или переинициализации)
   */
  reset(): void {
    this.isInitialized = false
    this.initializationPromise = null
  }

  /**
   * Выполняет быструю инициализацию только с критически важными компонентами
   */
  async quickInitialize(language?: string): Promise<InitializationResult> {
    const startTime = Date.now()
    const errors: string[] = []

    try {
      const targetLanguage = language || DEFAULT_LANGUAGE

      // Быстрая загрузка только основных переводов
      let translationsLoaded = false
      try {
        await translationService.loadTranslations(targetLanguage)
        translationsLoaded = true
      } catch (error) {
        errors.push(`Quick init: Failed to load translations: ${error}`)
      }

      const initializationTime = Date.now() - startTime

      return {
        language: targetLanguage,
        detectionResult: {
          language: targetLanguage,
          source: language ? 'user-preference' : 'default',
          confidence: language ? 1.0 : 0.5
        },
        translationsLoaded,
        promptsLoaded: false, // Промпты загружаются по требованию
        userPreferenceSynced: false, // Синхронизация в фоне
        initializationTime,
        errors
      }
    } catch (error) {
      const initializationTime = Date.now() - startTime
      
      return {
        language: DEFAULT_LANGUAGE,
        detectionResult: {
          language: DEFAULT_LANGUAGE,
          source: 'default',
          confidence: 0.0
        },
        translationsLoaded: false,
        promptsLoaded: false,
        userPreferenceSynced: false,
        initializationTime,
        errors: [...errors, `Quick init failed: ${error}`]
      }
    }
  }

  /**
   * Создает отчет о состоянии инициализации
   */
  async generateInitializationReport(): Promise<string> {
    const detectionReport = await languageDetector.generateDetectionReport()
    const errorReport = errorHandler.generateErrorReport()

    return JSON.stringify({
      initialized: this.isInitialized,
      detectionReport: JSON.parse(detectionReport),
      errorReport: JSON.parse(errorReport),
      timestamp: new Date().toISOString()
    }, null, 2)
  }
}

// Экспортируем singleton instance
export const languageInitializer = LanguageInitializer.getInstance()