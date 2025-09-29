#!/usr/bin/env node

/**
 * Тестирование исправлений качества промптов на продакшене
 */

const https = require('https')
const http = require('http')

class ProductionTester {
  constructor() {
    this.baseUrl = 'https://uxaudute.vercel.app'
    this.testResults = []
  }

  /**
   * Запускает тесты на продакшене
   */
  async runProductionTests() {
    console.log('🚀 Testing Prompt Quality Fix on Production...')
    console.log(`🌐 Base URL: ${this.baseUrl}\n`)

    // 1. Проверяем доступность сайта
    await this.testSiteAvailability()

    // 2. Тестируем research endpoint с русским языком
    await this.testResearchRussian()

    // 3. Тестируем research endpoint с английским языком
    await this.testResearchEnglish()

    // 4. Тестируем качество ответов
    await this.testResponseQuality()

    // 5. Тестируем языковую консистентность
    await this.testLanguageConsistency()

    this.printResults()
  }

  /**
   * Проверяет доступность сайта
   */
  async testSiteAvailability() {
    console.log('🌐 Testing site availability...')

    try {
      const response = await this.makeRequest('/')
      
      if (response.success) {
        this.logTest('Site Availability', true, `Status: ${response.status}`)
      } else {
        this.logTest('Site Availability', false, `Status: ${response.status}`)
      }
    } catch (error) {
      this.logTest('Site Availability', false, error.message)
    }

    console.log('')
  }

  /**
   * Тестирует research endpoint с русским языком
   */
  async testResearchRussian() {
    console.log('🇷🇺 Testing Research API with Russian language...')

    try {
      const testData = {
        url: 'https://google.com',
        language: 'ru',
        context: 'Тестовый анализ для проверки качества русского ответа'
      }

      const response = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9',
          'Content-Language': 'ru'
        },
        body: JSON.stringify(testData)
      })

      if (response.success && response.data) {
        this.logTest('Research API (Russian)', true, 'Request successful')

        // Проверяем наличие результата
        if (response.data.result) {
          const resultLength = response.data.result.length
          this.logTest('Russian Response Length', resultLength > 500, `${resultLength} chars`)

          // Проверяем язык ответа
          const russianChars = (response.data.result.match(/[а-яё]/gi) || []).length
          const totalChars = response.data.result.length
          const russianRatio = russianChars / totalChars

          this.logTest('Russian Language Ratio', russianRatio > 0.7, `${Math.round(russianRatio * 100)}%`)

          // Проверяем структуру
          const hasStructure = response.data.result.includes('#') || 
                              response.data.result.includes('##') ||
                              response.data.result.includes('1.') ||
                              response.data.result.includes('-')

          this.logTest('Russian Response Structure', hasStructure, hasStructure ? 'Has structure' : 'No structure')

          // Проверяем полноту (не обрезан)
          const isComplete = response.data.result.match(/[.!?]\s*$/) && 
                           !response.data.result.includes('...')

          this.logTest('Russian Response Completeness', isComplete, isComplete ? 'Complete' : 'Truncated')
        }

        // Проверяем метрики качества если есть
        if (response.data.quality) {
          this.logTest('Russian Quality Score', 
            response.data.quality.score > 70, 
            `Score: ${response.data.quality.score}`
          )

          this.logTest('Russian Language Accuracy', 
            response.data.quality.language_accuracy > 80, 
            `Accuracy: ${response.data.quality.language_accuracy}`
          )
        }

      } else {
        this.logTest('Research API (Russian)', false, response.error || 'No data received')
      }

    } catch (error) {
      this.logTest('Research API (Russian)', false, error.message)
    }

    console.log('')
  }

  /**
   * Тестирует research endpoint с английским языком
   */
  async testResearchEnglish() {
    console.log('🇺🇸 Testing Research API with English language...')

    try {
      const testData = {
        url: 'https://google.com',
        language: 'en',
        context: 'Test analysis to check English response quality'
      }

      const response = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Language': 'en'
        },
        body: JSON.stringify(testData)
      })

      if (response.success && response.data) {
        this.logTest('Research API (English)', true, 'Request successful')

        if (response.data.result) {
          const resultLength = response.data.result.length
          this.logTest('English Response Length', resultLength > 500, `${resultLength} chars`)

          // Проверяем язык ответа
          const russianChars = (response.data.result.match(/[а-яё]/gi) || []).length
          const englishChars = (response.data.result.match(/[a-z]/gi) || []).length
          const totalChars = russianChars + englishChars
          const englishRatio = totalChars > 0 ? englishChars / totalChars : 0

          this.logTest('English Language Ratio', englishRatio > 0.7, `${Math.round(englishRatio * 100)}%`)

          // Проверяем что нет русских слов
          const hasRussianWords = russianChars > 10
          this.logTest('No Russian in English Response', !hasRussianWords, 
            hasRussianWords ? `${russianChars} Russian chars found` : 'Clean English')
        }

      } else {
        this.logTest('Research API (English)', false, response.error || 'No data received')
      }

    } catch (error) {
      this.logTest('Research API (English)', false, error.message)
    }

    console.log('')
  }

  /**
   * Тестирует качество ответов
   */
  async testResponseQuality() {
    console.log('📊 Testing response quality metrics...')

    try {
      // Тест с минимальными данными для быстрого ответа
      const testData = {
        url: 'https://example.com',
        language: 'ru'
      }

      const response = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9'
        },
        body: JSON.stringify(testData)
      })

      if (response.success && response.data && response.data.result) {
        const result = response.data.result

        // Проверяем минимальную длину
        this.logTest('Minimum Response Length', result.length >= 300, `${result.length} chars`)

        // Проверяем наличие ключевых разделов
        const hasAnalysis = result.includes('анализ') || result.includes('Анализ')
        const hasRecommendations = result.includes('рекомендаци') || result.includes('Рекомендаци')
        const hasConclusion = result.includes('заключени') || result.includes('Заключени') ||
                             result.includes('вывод') || result.includes('Вывод')

        this.logTest('Has Analysis Section', hasAnalysis, hasAnalysis ? 'Found' : 'Missing')
        this.logTest('Has Recommendations', hasRecommendations, hasRecommendations ? 'Found' : 'Missing')
        this.logTest('Has Conclusion', hasConclusion, hasConclusion ? 'Found' : 'Missing')

        // Проверяем что ответ не обрезан
        const endsCorrectly = /[.!?]\s*$/.test(result.trim())
        const hasEllipsis = result.includes('...') || result.includes('…')

        this.logTest('Response Not Truncated', endsCorrectly && !hasEllipsis, 
          endsCorrectly ? 'Ends correctly' : 'May be truncated')

      } else {
        this.logTest('Response Quality Test', false, 'No response data')
      }

    } catch (error) {
      this.logTest('Response Quality Test', false, error.message)
    }

    console.log('')
  }

  /**
   * Тестирует языковую консистентность
   */
  async testLanguageConsistency() {
    console.log('🔄 Testing language consistency...')

    try {
      // Тест переключения языков
      const russianTest = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          language: 'ru'
        })
      })

      const englishTest = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          language: 'en'
        })
      })

      if (russianTest.success && englishTest.success) {
        this.logTest('Language Switching', true, 'Both languages work')

        // Проверяем что ответы действительно на разных языках
        if (russianTest.data.result && englishTest.data.result) {
          const ruResult = russianTest.data.result
          const enResult = englishTest.data.result

          const ruHasRussian = (ruResult.match(/[а-яё]/gi) || []).length > 50
          const enHasEnglish = (enResult.match(/[a-z]/gi) || []).length > 50

          this.logTest('Russian Response in Russian', ruHasRussian, 
            ruHasRussian ? 'Correct language' : 'Wrong language')

          this.logTest('English Response in English', enHasEnglish, 
            enHasEnglish ? 'Correct language' : 'Wrong language')
        }

      } else {
        this.logTest('Language Switching', false, 'One or both requests failed')
      }

    } catch (error) {
      this.logTest('Language Consistency Test', false, error.message)
    }

    console.log('')
  }

  /**
   * Выполняет HTTP запрос
   */
  async makeRequest(endpoint, options = {}) {
    return new Promise((resolve) => {
      const url = `${this.baseUrl}${endpoint}`
      const urlObj = new URL(url)
      
      const requestOptions = {
        hostname: urlObj.hostname,
        port: urlObj.port || 443,
        path: urlObj.pathname + urlObj.search,
        method: options.method || 'GET',
        headers: {
          'User-Agent': 'Production-Tester/1.0',
          ...options.headers
        },
        timeout: 30000
      }

      const client = urlObj.protocol === 'https:' ? https : http

      const req = client.request(requestOptions, (res) => {
        let data = ''

        res.on('data', (chunk) => {
          data += chunk
        })

        res.on('end', () => {
          try {
            const jsonData = data ? JSON.parse(data) : {}
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: jsonData,
              error: jsonData.error
            })
          } catch (parseError) {
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              status: res.statusCode,
              data: { result: data },
              error: null
            })
          }
        })
      })

      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message
        })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({
          success: false,
          error: 'Request timeout'
        })
      })

      if (options.body) {
        req.write(options.body)
      }

      req.end()
    })
  }

  /**
   * Логирует результат теста
   */
  logTest(testName, passed, details = '') {
    const result = {
      name: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    }

    this.testResults.push(result)

    const icon = passed ? '✅' : '❌'
    const detailsText = details ? ` (${details})` : ''
    console.log(`  ${icon} ${testName}${detailsText}`)
  }

  /**
   * Выводит результаты тестирования
   */
  printResults() {
    const passed = this.testResults.filter(t => t.passed).length
    const failed = this.testResults.filter(t => !t.passed).length
    const total = this.testResults.length

    console.log('\n' + '='.repeat(60))
    console.log('🚀 PRODUCTION TEST RESULTS')
    console.log('='.repeat(60))
    console.log(`🌐 Tested URL: ${this.baseUrl}`)
    console.log(`📊 Total Tests: ${total}`)
    console.log(`✅ Passed: ${passed}`)
    console.log(`❌ Failed: ${failed}`)
    console.log(`📈 Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`)
        })
    }

    console.log('\n' + '='.repeat(60))
    
    if (failed === 0 && total > 0) {
      console.log('🎉 All production tests passed! Prompt quality fixes are working on production.')
    } else if (total === 0) {
      console.log('⚠️ No tests were run. Check the production URL.')
    } else {
      console.log('⚠️ Some production tests failed. The fixes may need adjustment.')
    }

    console.log('\n💡 Next steps:')
    if (failed === 0) {
      console.log('   ✅ Quality fixes are working correctly on production')
      console.log('   ✅ Russian and English responses are properly handled')
      console.log('   ✅ Language consistency is maintained')
    } else {
      console.log('   🔧 Review failed tests and adjust the implementation')
      console.log('   🔄 Re-deploy and test again')
    }
  }
}

// Запуск тестов если скрипт вызван напрямую
if (require.main === module) {
  const tester = new ProductionTester()
  tester.runProductionTests().catch(console.error)
}

module.exports = ProductionTester