#!/usr/bin/env node

/**
 * Тестирование исправлений качества промптов
 */

const { ResponseQualityAnalyzer } = require('../src/lib/quality-metrics')
const { LanguageManager } = require('../src/lib/language-manager')
const { PromptValidator } = require('../src/lib/prompt-validator')
const { StablePromptsLoader } = require('../src/lib/stable-prompts-loader')
const { PromptType } = require('../src/lib/i18n/types')

class PromptQualityTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      tests: []
    }
  }

  /**
   * Запускает все тесты
   */
  async runAllTests() {
    console.log('🧪 Starting Prompt Quality Fix Tests...\n')

    // 1. Тест загрузки стабильных промптов
    await this.testStablePromptsLoading()

    // 2. Тест валидации промптов
    await this.testPromptValidation()

    // 3. Тест определения языка
    await this.testLanguageDetection()

    // 4. Тест качества ответов
    await this.testResponseQuality()

    // 5. Тест языковой консистентности
    await this.testLanguageConsistency()

    // Выводим результаты
    this.printResults()
  }

  /**
   * Тест загрузки стабильных промптов
   */
  async testStablePromptsLoading() {
    console.log('📋 Testing stable prompts loading...')

    try {
      const stablePrompts = StablePromptsLoader.loadAllStablePrompts()
      const stats = StablePromptsLoader.getStablePromptsStats()

      this.assert(
        Object.keys(stablePrompts).length > 0,
        'Should load stable prompts',
        `Loaded ${Object.keys(stablePrompts).length} stable prompts`
      )

      this.assert(
        stats.averageQuality > 80,
        'Stable prompts should have high quality',
        `Average quality: ${stats.averageQuality}`
      )

      // Тест получения конкретного промпта
      const mainPrompt = StablePromptsLoader.getStablePrompt(PromptType.MAIN)
      this.assert(
        mainPrompt && mainPrompt.length > 100,
        'Should get main stable prompt',
        `Main prompt length: ${mainPrompt?.length || 0}`
      )

      console.log('✅ Stable prompts loading tests passed\n')
    } catch (error) {
      this.assert(false, 'Stable prompts loading failed', error.message)
    }
  }

  /**
   * Тест валидации промптов
   */
  async testPromptValidation() {
    console.log('🔍 Testing prompt validation...')

    try {
      // Тест хорошего промпта
      const goodPrompt = `Ты опытный UX-дизайнер-исследователь с 20-летним стажем. 
      Анализируй интерфейсы на основе проверенных UX-методологий.
      
      Результат анализа:
      1. Описание экрана
      2. UX-опрос с 5 вопросами
      3. Проблемы и рекомендации
      4. Самопроверка и уверенность`

      const goodResult = await PromptValidator.validatePrompt(goodPrompt, PromptType.MAIN, 'ru')
      
      this.assert(
        goodResult.isValid,
        'Good prompt should be valid',
        `Score: ${goodResult.score}, Issues: ${goodResult.issues.length}`
      )

      // Тест плохого промпта
      const badPrompt = 'Плохой промпт'
      const badResult = await PromptValidator.validatePrompt(badPrompt, PromptType.MAIN, 'ru')
      
      this.assert(
        !badResult.isValid,
        'Bad prompt should be invalid',
        `Score: ${badResult.score}, Issues: ${badResult.issues.length}`
      )

      // Тест быстрой валидации
      const quickValid = await PromptValidator.quickValidate(goodPrompt, PromptType.MAIN)
      const quickInvalid = await PromptValidator.quickValidate(badPrompt, PromptType.MAIN)

      this.assert(
        quickValid && !quickInvalid,
        'Quick validation should work correctly',
        `Good: ${quickValid}, Bad: ${quickInvalid}`
      )

      console.log('✅ Prompt validation tests passed\n')
    } catch (error) {
      this.assert(false, 'Prompt validation failed', error.message)
    }
  }

  /**
   * Тест определения языка
   */
  async testLanguageDetection() {
    console.log('🌐 Testing language detection...')

    try {
      // Создаем мок запроса
      const mockRequest = {
        headers: new Map([
          ['accept-language', 'ru-RU,ru;q=0.9,en;q=0.8'],
          ['content-language', 'ru']
        ])
      }

      // Тест создания языкового контекста из параметров
      const contextFromParams = LanguageManager.createLanguageContextFromParams({
        language: 'ru',
        acceptLanguage: 'ru-RU,ru;q=0.9,en;q=0.8'
      })

      this.assert(
        contextFromParams.promptLanguage === 'ru',
        'Should detect Russian from parameters',
        `Detected: ${contextFromParams.promptLanguage}`
      )

      // Тест принудительного установления языка
      const originalPrompt = 'Analyze the interface'
      const enforcedPrompt = LanguageManager.enforceResponseLanguage(originalPrompt, 'ru')

      this.assert(
        enforcedPrompt.includes('русском'),
        'Should enforce Russian language',
        'Language enforcement applied'
      )

      console.log('✅ Language detection tests passed\n')
    } catch (error) {
      this.assert(false, 'Language detection failed', error.message)
    }
  }

  /**
   * Тест качества ответов
   */
  async testResponseQuality() {
    console.log('📊 Testing response quality...')

    try {
      // Тест хорошего ответа
      const goodResponse = `# Анализ UX интерфейса

## Описание экрана
Данный интерфейс представляет собой современную веб-страницу с четкой структурой и интуитивной навигацией.

## UX-опрос
1. Насколько понятна навигация? (1-5)
2. Легко ли найти нужную информацию? (1-5)
3. Соответствует ли дизайн ожиданиям? (1-5)

## Проблемы и рекомендации
- Улучшить контрастность текста
- Добавить breadcrumbs для навигации
- Оптимизировать загрузку изображений

## Заключение
Интерфейс имеет хорошую основу, но требует доработки в области доступности и производительности.`

      const goodMetrics = ResponseQualityAnalyzer.measureQuality(goodResponse, 'ru')

      this.assert(
        goodMetrics.qualityScore > 70,
        'Good response should have high quality score',
        `Quality score: ${goodMetrics.qualityScore}`
      )

      this.assert(
        goodMetrics.languageAccuracy > 90,
        'Russian response should have high language accuracy',
        `Language accuracy: ${goodMetrics.languageAccuracy}`
      )

      this.assert(
        !goodMetrics.isTruncated,
        'Good response should not be truncated',
        `Is truncated: ${goodMetrics.isTruncated}`
      )

      // Тест плохого ответа
      const badResponse = 'Плохой анализ...'
      const badMetrics = ResponseQualityAnalyzer.measureQuality(badResponse, 'ru')

      this.assert(
        badMetrics.qualityScore < 50,
        'Bad response should have low quality score',
        `Quality score: ${badMetrics.qualityScore}`
      )

      // Тест соответствия стандартам
      const meetsStandards = ResponseQualityAnalyzer.meetsQualityStandards(goodMetrics)
      const doesntMeetStandards = ResponseQualityAnalyzer.meetsQualityStandards(badMetrics)

      this.assert(
        meetsStandards && !doesntMeetStandards,
        'Quality standards check should work correctly',
        `Good meets: ${meetsStandards}, Bad meets: ${doesntMeetStandards}`
      )

      console.log('✅ Response quality tests passed\n')
    } catch (error) {
      this.assert(false, 'Response quality testing failed', error.message)
    }
  }

  /**
   * Тест языковой консистентности
   */
  async testLanguageConsistency() {
    console.log('🔄 Testing language consistency...')

    try {
      // Тест валидации консистентности
      const russianResponse = 'Анализ показывает хорошие результаты пользовательского опыта.'
      const englishResponse = 'Analysis shows good user experience results.'
      const mixedResponse = 'Analysis показывает good результаты.'

      const russianValidation = LanguageManager.validateLanguageConsistency(
        '', russianResponse, 'ru'
      )

      const englishValidation = LanguageManager.validateLanguageConsistency(
        '', englishResponse, 'en'
      )

      const mixedValidation = LanguageManager.validateLanguageConsistency(
        '', mixedResponse, 'ru'
      )

      this.assert(
        russianValidation.isConsistent,
        'Russian response should be consistent',
        `Issues: ${russianValidation.issues.length}`
      )

      this.assert(
        englishValidation.isConsistent,
        'English response should be consistent',
        `Issues: ${englishValidation.issues.length}`
      )

      this.assert(
        !mixedValidation.isConsistent,
        'Mixed language response should be inconsistent',
        `Issues: ${mixedValidation.issues.length}`
      )

      // Тест генерации отчета
      const languageContext = {
        requestLanguage: 'ru',
        detectedLanguage: 'ru',
        promptLanguage: 'ru',
        responseLanguage: 'ru',
        isConsistent: true,
        source: 'user-preference'
      }

      const report = LanguageManager.generateLanguageReport(languageContext, russianResponse)
      
      this.assert(
        report.includes('Language Analysis Report'),
        'Should generate language report',
        'Report generated successfully'
      )

      console.log('✅ Language consistency tests passed\n')
    } catch (error) {
      this.assert(false, 'Language consistency testing failed', error.message)
    }
  }

  /**
   * Утилита для проверки утверждений
   */
  assert(condition, testName, details = '') {
    const result = {
      name: testName,
      passed: condition,
      details: details,
      timestamp: new Date().toISOString()
    }

    this.testResults.tests.push(result)

    if (condition) {
      this.testResults.passed++
      console.log(`  ✅ ${testName} ${details ? `(${details})` : ''}`)
    } else {
      this.testResults.failed++
      console.log(`  ❌ ${testName} ${details ? `(${details})` : ''}`)
    }
  }

  /**
   * Выводит результаты тестирования
   */
  printResults() {
    console.log('\n' + '='.repeat(50))
    console.log('🧪 PROMPT QUALITY FIX TEST RESULTS')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${this.testResults.tests.length}`)
    console.log(`Passed: ${this.testResults.passed} ✅`)
    console.log(`Failed: ${this.testResults.failed} ❌`)
    console.log(`Success Rate: ${Math.round((this.testResults.passed / this.testResults.tests.length) * 100)}%`)

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults.tests
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`)
        })
    }

    console.log('\n' + '='.repeat(50))
    
    if (this.testResults.failed === 0) {
      console.log('🎉 All tests passed! Prompt quality fixes are working correctly.')
    } else {
      console.log('⚠️ Some tests failed. Please review the issues above.')
    }
  }
}

// Запуск тестов если скрипт вызван напрямую
if (require.main === module) {
  const tester = new PromptQualityTester()
  tester.runAllTests().catch(console.error)
}

module.exports = PromptQualityTester