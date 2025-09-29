#!/usr/bin/env node

/**
 * Скрипт для анализа качества промптов и сравнения ответов
 * между stable и main ветками
 */

const fs = require('fs');
const path = require('path');

class PromptQualityAnalyzer {
  constructor() {
    this.results = {
      stable: {},
      main: {},
      comparison: {}
    };
  }

  /**
   * Измеряет качество ответа
   */
  measureResponseQuality(response, language = 'ru') {
    const metrics = {
      completeness: this.checkCompleteness(response),
      languageAccuracy: this.checkLanguageAccuracy(response, language),
      tokenCount: this.countTokens(response),
      hasStructure: this.checkStructure(response),
      isTruncated: this.checkTruncation(response)
    };

    // Общий балл качества (0-100)
    metrics.qualityScore = this.calculateQualityScore(metrics);
    
    return metrics;
  }

  /**
   * Проверяет полноту ответа
   */
  checkCompleteness(response) {
    if (!response || typeof response !== 'string') return 0;
    
    const minLength = 1000; // Минимальная длина для полного ответа
    const hasConclusion = response.includes('Заключение') || response.includes('Conclusion');
    const hasRecommendations = response.includes('Рекомендации') || response.includes('Recommendations');
    
    let score = 0;
    if (response.length >= minLength) score += 40;
    if (hasConclusion) score += 30;
    if (hasRecommendations) score += 30;
    
    return Math.min(score, 100);
  }

  /**
   * Проверяет соответствие языка
   */
  checkLanguageAccuracy(response, expectedLanguage) {
    if (!response) return 0;
    
    const russianChars = (response.match(/[а-яё]/gi) || []).length;
    const englishChars = (response.match(/[a-z]/gi) || []).length;
    const totalChars = russianChars + englishChars;
    
    if (totalChars === 0) return 0;
    
    const russianRatio = russianChars / totalChars;
    
    if (expectedLanguage === 'ru') {
      return russianRatio > 0.7 ? 100 : russianRatio * 100;
    } else if (expectedLanguage === 'en') {
      return russianRatio < 0.3 ? 100 : (1 - russianRatio) * 100;
    }
    
    return 0;
  }

  /**
   * Подсчитывает приблизительное количество токенов
   */
  countTokens(text) {
    if (!text) return 0;
    // Приблизительная оценка: 1 токен ≈ 4 символа для русского текста
    return Math.ceil(text.length / 4);
  }

  /**
   * Проверяет структурированность ответа
   */
  checkStructure(response) {
    if (!response) return 0;
    
    const hasHeaders = /#{1,6}\s/.test(response) || /\*\*.*\*\*/.test(response);
    const hasLists = /^\s*[-*+]\s/m.test(response) || /^\s*\d+\.\s/m.test(response);
    const hasSections = response.split('\n\n').length > 3;
    
    let score = 0;
    if (hasHeaders) score += 40;
    if (hasLists) score += 30;
    if (hasSections) score += 30;
    
    return Math.min(score, 100);
  }

  /**
   * Проверяет, обрезан ли ответ
   */
  checkTruncation(response) {
    if (!response) return true;
    
    const endsAbruptly = !response.match(/[.!?]\s*$/);
    const tooShort = response.length < 500;
    const hasIncompleteSection = response.includes('...');
    
    return endsAbruptly || tooShort || hasIncompleteSection;
  }

  /**
   * Вычисляет общий балл качества
   */
  calculateQualityScore(metrics) {
    const weights = {
      completeness: 0.3,
      languageAccuracy: 0.25,
      hasStructure: 0.2,
      isTruncated: 0.25
    };

    let score = 0;
    score += metrics.completeness * weights.completeness;
    score += metrics.languageAccuracy * weights.languageAccuracy;
    score += metrics.hasStructure * weights.hasStructure;
    score += (metrics.isTruncated ? 0 : 100) * weights.isTruncated;

    return Math.round(score);
  }

  /**
   * Загружает промпт из файла
   */
  loadPrompt(language, type = 'main-prompt') {
    const promptPath = path.join(process.cwd(), 'public', 'prompts', language, `${type}.md`);
    
    try {
      return fs.readFileSync(promptPath, 'utf8');
    } catch (error) {
      console.error(`Ошибка загрузки промпта: ${promptPath}`, error.message);
      return null;
    }
  }

  /**
   * Сравнивает промпты между языками
   */
  comparePrompts() {
    const types = ['main-prompt', 'json-structured-prompt', 'business-analytics-prompt', 'hypotheses-prompt'];
    const comparison = {};

    for (const type of types) {
      const ruPrompt = this.loadPrompt('ru', type);
      const enPrompt = this.loadPrompt('en', type);

      comparison[type] = {
        ru: {
          exists: !!ruPrompt,
          length: ruPrompt ? ruPrompt.length : 0,
          tokenCount: ruPrompt ? this.countTokens(ruPrompt) : 0
        },
        en: {
          exists: !!enPrompt,
          length: enPrompt ? enPrompt.length : 0,
          tokenCount: enPrompt ? this.countTokens(enPrompt) : 0
        }
      };

      if (ruPrompt && enPrompt) {
        comparison[type].lengthDifference = Math.abs(ruPrompt.length - enPrompt.length);
        comparison[type].tokenDifference = Math.abs(
          comparison[type].ru.tokenCount - comparison[type].en.tokenCount
        );
      }
    }

    return comparison;
  }

  /**
   * Создает тестовые данные для анализа
   */
  generateTestData() {
    return {
      website: 'https://example.com',
      description: 'Тестовый сайт для анализа UX',
      targetAudience: 'Молодые пользователи 18-35 лет',
      goals: ['Увеличить конверсию', 'Улучшить пользовательский опыт']
    };
  }

  /**
   * Симулирует анализ (для тестирования без реального API)
   */
  simulateAnalysis(language, testData) {
    // Симуляция разных качеств ответов для демонстрации
    const responses = {
      ru: {
        good: `# Анализ UX сайта ${testData.website}

## Введение
Проведен комплексный анализ пользовательского опыта сайта...

## Основные проблемы
1. Медленная загрузка страниц
2. Неинтуитивная навигация
3. Отсутствие мобильной адаптации

## Рекомендации
- Оптимизировать изображения
- Упростить меню навигации
- Внедрить адаптивный дизайн

## Заключение
Реализация предложенных рекомендаций позволит значительно улучшить пользовательский опыт.`,
        
        bad: `Анализ сайта показал проблемы с навигацией и...` // Обрезанный ответ
      },
      en: {
        good: `# UX Analysis for ${testData.website}

## Introduction
A comprehensive user experience analysis has been conducted...

## Main Issues
1. Slow page loading
2. Unintuitive navigation
3. Lack of mobile adaptation

## Recommendations
- Optimize images
- Simplify navigation menu
- Implement responsive design

## Conclusion
Implementation of the proposed recommendations will significantly improve user experience.`,
        
        bad: `Site analysis showed navigation problems and...` // Truncated response
      }
    };

    return responses[language];
  }

  /**
   * Запускает полный анализ
   */
  async runAnalysis() {
    console.log('🔍 Запуск анализа качества промптов...\n');

    // 1. Сравнение промптов
    console.log('📋 Сравнение промптов между языками:');
    const promptComparison = this.comparePrompts();
    console.table(promptComparison);

    // 2. Тестирование качества ответов
    console.log('\n🧪 Тестирование качества ответов:');
    const testData = this.generateTestData();

    for (const language of ['ru', 'en']) {
      console.log(`\n--- Язык: ${language.toUpperCase()} ---`);
      
      const responses = this.simulateAnalysis(language, testData);
      
      console.log('✅ Хороший ответ:');
      const goodMetrics = this.measureResponseQuality(responses.good, language);
      console.log(`  Качество: ${goodMetrics.qualityScore}/100`);
      console.log(`  Полнота: ${goodMetrics.completeness}/100`);
      console.log(`  Язык: ${goodMetrics.languageAccuracy}/100`);
      console.log(`  Токены: ${goodMetrics.tokenCount}`);
      
      console.log('\n❌ Плохой ответ:');
      const badMetrics = this.measureResponseQuality(responses.bad, language);
      console.log(`  Качество: ${badMetrics.qualityScore}/100`);
      console.log(`  Полнота: ${badMetrics.completeness}/100`);
      console.log(`  Язык: ${badMetrics.languageAccuracy}/100`);
      console.log(`  Токены: ${badMetrics.tokenCount}`);
      console.log(`  Обрезан: ${badMetrics.isTruncated ? 'Да' : 'Нет'}`);
    }

    // 3. Сохранение результатов
    const results = {
      timestamp: new Date().toISOString(),
      promptComparison,
      testResults: {
        ru: {
          good: this.measureResponseQuality(this.simulateAnalysis('ru', testData).good, 'ru'),
          bad: this.measureResponseQuality(this.simulateAnalysis('ru', testData).bad, 'ru')
        },
        en: {
          good: this.measureResponseQuality(this.simulateAnalysis('en', testData).good, 'en'),
          bad: this.measureResponseQuality(this.simulateAnalysis('en', testData).bad, 'en')
        }
      }
    };

    const resultsPath = path.join(process.cwd(), 'scripts', 'quality-analysis-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    
    console.log(`\n💾 Результаты сохранены в: ${resultsPath}`);
    
    return results;
  }
}

// Запуск анализа если скрипт вызван напрямую
if (require.main === module) {
  const analyzer = new PromptQualityAnalyzer();
  analyzer.runAnalysis().catch(console.error);
}

module.exports = PromptQualityAnalyzer;