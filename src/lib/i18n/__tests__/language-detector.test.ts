/**
 * Тесты для LanguageDetector
 */

import { languageDetector } from '../language-detector'
import { DEFAULT_LANGUAGE } from '../types'

// Мокаем window и navigator для тестов
const mockNavigator = {
  language: 'en-US',
  languages: ['en-US', 'en', 'ru'],
  userLanguage: undefined,
  browserLanguage: undefined,
  systemLanguage: undefined
}

const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}

// Мокаем глобальные объекты
Object.defineProperty(window, 'navigator', {
  value: mockNavigator,
  writable: true
})

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true
})

describe('LanguageDetector', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockLocalStorage.getItem.mockReturnValue(null)
  })

  describe('detectLanguage', () => {
    it('should return default language when no preferences found', async () => {
      const result = await languageDetector.detectLanguage()
      
      expect(result.language).toBe('en') // Должен определить английский из браузера
      expect(result.source).toBe('browser')
      expect(result.confidence).toBe(0.7)
    })

    it('should return localStorage language when available', async () => {
      mockLocalStorage.getItem.mockReturnValue('ru')
      
      const result = await languageDetector.detectLanguage()
      
      expect(result.language).toBe('ru')
      expect(result.source).toBe('user-preference')
      expect(result.confidence).toBe(0.9)
    })

    it('should fallback to default language for unsupported browser language', async () => {
      // Мокаем неподдерживаемый язык
      Object.defineProperty(window, 'navigator', {
        value: {
          ...mockNavigator,
          language: 'zh-CN',
          languages: ['zh-CN', 'zh']
        },
        writable: true
      })

      const result = await languageDetector.detectLanguage()
      
      expect(result.language).toBe(DEFAULT_LANGUAGE)
      expect(result.source).toBe('default')
    })
  })

  describe('getSupportedLanguages', () => {
    it('should return list of supported languages', () => {
      const languages = languageDetector.getSupportedLanguages()
      
      expect(languages).toHaveLength(2)
      expect(languages[0]).toHaveProperty('code')
      expect(languages[0]).toHaveProperty('name')
      expect(languages[0]).toHaveProperty('nativeName')
      expect(languages[0]).toHaveProperty('flag')
    })
  })

  describe('isLanguageSupported', () => {
    it('should return true for supported languages', () => {
      expect(languageDetector.isLanguageSupported('en')).toBe(true)
      expect(languageDetector.isLanguageSupported('ru')).toBe(true)
    })

    it('should return false for unsupported languages', () => {
      expect(languageDetector.isLanguageSupported('fr')).toBe(false)
      expect(languageDetector.isLanguageSupported('de')).toBe(false)
    })
  })

  describe('getBestMatchLanguage', () => {
    it('should return first supported language from list', () => {
      const result = languageDetector.getBestMatchLanguage(['fr', 'en', 'de'])
      expect(result).toBe('en')
    })

    it('should return default language when no matches found', () => {
      const result = languageDetector.getBestMatchLanguage(['fr', 'de', 'zh'])
      expect(result).toBe(DEFAULT_LANGUAGE)
    })

    it('should normalize language codes', () => {
      const result = languageDetector.getBestMatchLanguage(['en-US', 'fr-FR'])
      expect(result).toBe('en')
    })
  })
})