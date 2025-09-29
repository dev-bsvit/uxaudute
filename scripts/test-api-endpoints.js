#!/usr/bin/env node

/**
 * Тестирование API endpoints после исправлений
 */

const fetch = require('node-fetch')

class APIEndpointTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl
    this.testResults = []
  }

  /**
   * Запускает тесты API endpoints
   */
  async runTests() {
    console.log('🌐 Testing API Endpoints after Prompt Quality Fix...\n')

    // Тест research endpoint
    await this.testResearchEndpoint()

    // Тест research-with-credits endpoint (требует авторизации)
    // await this.testResearchWithCreditsEndpoint()

    // Тест business-analytics endpoint
    // await this.testBusinessAnalyticsEndpoint()

    // Тест hypotheses endpoint
    // await this.testHypothesesEndpoint()

    this.printResults()
  }

  /**
   * Тест research endpoint
   */
  async testResearchEndpoint() {
    console.log('🔍 Testing /api/research endpoint...')

    try {
      // Тест с русским языком
      const russianTest = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'ru-RU,ru;q=0.9',
          'Content-Language': 'ru'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          language: 'ru',
          context: 'Тестовый контекст для анализа'
        })
      })

      if (russianTest.success) {
        this.logTest('Research API (Russian)', true, 'Request successful')
        
        if (russianTest.data.quality) {
          this.logTest('Research API Quality Metrics', true, 
            `Score: ${russianTest.data.quality.score}, Language: ${russianTest.data.quality.language_accuracy}`)
        }

        if (russianTest.data.language) {
          this.logTest('Research API Language Context', true,
            `Language: ${russianTest.data.language.context.responseLanguage}`)
        }
      } else {
        this.logTest('Research API (Russian)', false, russianTest.error || 'Unknown error')
      }

      // Тест с английским языком
      const englishTest = await this.makeRequest('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Content-Language': 'en'
        },
        body: JSON.stringify({
          url: 'https://example.com',
          language: 'en',
          context: 'Test context for analysis'
        })
      })

      if (englishTest.success) {
        this.logTest('Research API (English)', true, 'Request successful')
      } else {
        this.logTest('Research API (English)', false, englishTest.error || 'Unknown error')
      }

    } catch (error) {
      this.logTest('Research API', false, error.message)
    }

    console.log('')
  }

  /**
   * Тест research-with-credits endpoint (требует авторизации)
   */
  async testResearchWithCreditsEndpoint() {
    console.log('💳 Testing /api/research-with-credits endpoint...')

    try {
      // Этот тест требует авторизации, поэтому просто проверяем что endpoint отвечает
      const response = await this.makeRequest('/api/research-with-credits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: 'https://example.com'
        })
      })

      // Ожидаем 401 (Unauthorized) что означает что endpoint работает
      if (response.status === 401) {
        this.logTest('Research with Credits API', true, 'Endpoint responds (401 expected)')
      } else {
        this.logTest('Research with Credits API', false, `Unexpected status: ${response.status}`)
      }

    } catch (error) {
      this.logTest('Research with Credits API', false, error.message)
    }

    console.log('')
  }

  /**
   * Выполняет HTTP запрос
   */
  async makeRequest(endpoint, options = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      console.log(`  📡 Making request to: ${url}`)

      const response = await fetch(url, {
        ...options,
        timeout: 30000 // 30 секунд таймаут
      })

      const data = await response.json()

      return {
        success: response.ok,
        status: response.status,
        data: data,
        error: data.error
      }

    } catch (error) {
      console.log(`  ❌ Request failed: ${error.message}`)
      return {
        success: false,
        error: error.message
      }
    }
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

    console.log('\n' + '='.repeat(50))
    console.log('🌐 API ENDPOINTS TEST RESULTS')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${total}`)
    console.log(`Passed: ${passed} ✅`)
    console.log(`Failed: ${failed} ❌`)
    console.log(`Success Rate: ${total > 0 ? Math.round((passed / total) * 100) : 0}%`)

    if (failed > 0) {
      console.log('\n❌ Failed Tests:')
      this.testResults
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.details}`)
        })
    }

    console.log('\n' + '='.repeat(50))
    
    if (failed === 0 && total > 0) {
      console.log('🎉 All API tests passed! Endpoints are working correctly.')
    } else if (total === 0) {
      console.log('⚠️ No tests were run. Make sure the server is running.')
    } else {
      console.log('⚠️ Some API tests failed. Please review the issues above.')
    }

    console.log('\n💡 To run full tests, start the development server:')
    console.log('   npm run dev')
    console.log('   Then run this script again.')
  }
}

// Запуск тестов если скрипт вызван напрямую
if (require.main === module) {
  const tester = new APIEndpointTester()
  tester.runTests().catch(console.error)
}

module.exports = APIEndpointTester