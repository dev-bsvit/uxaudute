/**
 * Тесты для системы инициализации языка
 */

import { languageDetector } from '../language-detector'
import { languageInitializer } from '../language-initializer'
import { languageReadinessChecker } from '../language-readiness-checker'

// Мокаем localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

// Мокаем navigator
const navigatorMock = {
  language: 'en-US',
  languages: ['en-US', 'en', 'ru'],
}

// Мокаем window
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

Object.defineProperty(window, 'navigator', {
  value: navigatorMock,
  writable: true
})

describe('Language Detection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  test('should detect browser language', async () => {
    const result = await languageDetector.detectLanguage()
    
    expect(result).toBeDefined()
    expect(result.language).toBeDefined()
    expect(result.source).toBeDefined()
    expect(result.confidence).toBeGreaterThan(0)
  })

  test('should prefer localStorage over browser language', async () => {
    localStorageMock.getItem.mockReturnValue('ru')
    
    const result = await languageDetector.detectLanguage()
    
    expect(result.language).toBe('ru')
    expect(result.source).toBe('user-preference')
    expect(result.confidence).toBeGreaterThan(0.8)
  })

  test('should fall back to default language', async () => {
    // Мокаем браузер без поддерживаемых языков
    Object.defineProperty(window, 'navigator', {
      value: {
        language: 'zh-CN',
        languages: ['zh-CN', 'zh']
      },
      writable: true
    })

    const result = await languageDetector.detectLanguage()
    
    expect(result.language).toBe('ru') // DEFAULT_LANGUAGE
    expect(result.source).toBe('default')
  })

  test('should normalize language codes', () => {
    const detector = languageDetector as any
    
    expect(detector.normalizeLanguageCode('en-US')).toBe('en')
    expect(detector.normalizeLanguageCode('ru-RU')).toBe('ru')
    expect(detector.normalizeLanguageCode('en')).toBe('en')
  })

  test('should get browser languages', () => {
    const detector = languageDetector as any
    const languages = detector.getBrowserLanguages()
    
    expect(languages).toContain('en-US')
    expect(languages).toContain('en')
    expect(languages).toContain('ru')
  })
})

describe('Language Initialization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    languageInitializer.reset()
  })

  test('should initialize language system', async () => {
    const result = await languageInitializer.initialize()
    
    expect(result).toBeDefined()
    expect(result.language).toBeDefined()
    expect(result.detectionResult).toBeDefined()
    expect(result.initializationTime).toBeGreaterThan(0)
  })

  test('should perform quick initialization', async () => {
    const result = await languageInitializer.quickInitialize()
    
    expect(result).toBeDefined()
    expect(result.language).toBeDefined()
    expect(result.initializationTime).toBeGreaterThan(0)
    expect(result.promptsLoaded).toBe(false) // Quick init не загружает промпты
  })

  test('should handle initialization errors gracefully', async () => {
    // Мокаем ошибку в детекторе языка
    jest.spyOn(languageDetector, 'detectLanguage').mockRejectedValue(new Error('Detection failed'))
    
    const result = await languageInitializer.initialize()
    
    expect(result).toBeDefined()
    expect(result.language).toBe('ru') // Fallback to default
    expect(result.errors.length).toBeGreaterThan(0)
  })

  test('should check if system is initialized', () => {
    expect(languageInitializer.isSystemInitialized()).toBe(false)
  })

  test('should reset initialization state', () => {
    languageInitializer.reset()
    expect(languageInitializer.isSystemInitialized()).toBe(false)
  })
})

describe('Language Readiness Checker', () => {
  test('should check system readiness', async () => {
    const result = await languageReadinessChecker.checkReadiness('ru')
    
    expect(result).toBeDefined()
    expect(result.language).toBe('ru')
    expect(result.checks).toBeDefined()
    expect(result.checks.initialization).toBeDefined()
    expect(result.checks.translations).toBeDefined()
    expect(result.checks.prompts).toBeDefined()
    expect(result.checks.userSettings).toBeDefined()
  })

  test('should perform quick readiness check', async () => {
    const isReady = await languageReadinessChecker.quickReadinessCheck('ru')
    
    expect(typeof isReady).toBe('boolean')
  })

  test('should check all languages readiness', async () => {
    const results = await languageReadinessChecker.checkAllLanguagesReadiness()
    
    expect(results).toBeDefined()
    expect(results.ru).toBeDefined()
    expect(results.en).toBeDefined()
  })

  test('should generate readiness report', async () => {
    const report = await languageReadinessChecker.generateReadinessReport()
    
    expect(typeof report).toBe('string')
    expect(() => JSON.parse(report)).not.toThrow()
    
    const parsed = JSON.parse(report)
    expect(parsed.timestamp).toBeDefined()
    expect(parsed.supportedLanguages).toBeDefined()
    expect(parsed.languageResults).toBeDefined()
    expect(parsed.summary).toBeDefined()
  })

  test('should wait for readiness with timeout', async () => {
    // Этот тест может занять время, поэтому используем короткий timeout
    try {
      const result = await languageReadinessChecker.waitForReadiness('ru', 1000, 100)
      expect(result).toBeDefined()
    } catch (error) {
      // Ожидаем timeout если система не готова
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toContain('timeout')
    }
  })
})

describe('Integration Tests', () => {
  test('should complete full initialization flow', async () => {
    // 1. Сбрасываем состояние
    languageInitializer.reset()
    
    // 2. Выполняем инициализацию
    const initResult = await languageInitializer.initialize()
    expect(initResult).toBeDefined()
    
    // 3. Проверяем готовность
    const readinessResult = await languageReadinessChecker.checkReadiness(initResult.language)
    expect(readinessResult).toBeDefined()
    
    // 4. Проверяем, что система инициализирована
    expect(languageInitializer.isSystemInitialized()).toBe(true)
  })

  test('should handle language switching during initialization', async () => {
    // Начинаем инициализацию
    const initPromise = languageInitializer.initialize()
    
    // Пытаемся переключить язык во время инициализации
    const detectionResult = await languageDetector.detectLanguage()
    expect(detectionResult).toBeDefined()
    
    // Ждем завершения инициализации
    const initResult = await initPromise
    expect(initResult).toBeDefined()
  })
})