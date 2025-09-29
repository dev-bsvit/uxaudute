import { describe, test, expect, beforeEach } from '@jest/test-globals';
import fs from 'fs';
import path from 'path';

/**
 * Тесты для валидации качества промптов и ответов
 */

interface QualityMetrics {
  completeness: number;
  languageAccuracy: number;
  tokenCount: number;
  hasStructure: number;
  isTruncated: boolean;
  qualityScore: number;
}

class PromptQualityValidator {
  /**
   * Измеряет качество ответа
   */
  measureResponseQuality(response: string, language: 'ru' | 'en' = 'ru'): QualityMetrics {
    const metrics = {
      completeness: this.checkCompleteness(response),
      languageAccuracy: this.checkLanguageAccuracy(response, language),
      tokenCount: this.countTokens(response),
      hasStructure: this.checkStructure(response),
      isTruncated: this.checkTruncation(response)
    };

    metrics.qualityScore = this.calculateQualityScore(metrics);
    
    return metrics;
  }

  private checkCompleteness(response: string): number {
    if (!response || typeof response !== 'string') return 0;
    
    const minLength = 1000;
    const hasConclusion = response.includes('Заключение') || response.includes('Conclusion');
    const hasRecommendations = response.includes('Рекомендации') || response.includes('Recommendations');
    
    let score = 0;
    if (response.length >= minLength) score += 40;
    if (hasConclusion) score += 30;
    if (hasRecommendations) score += 30;
    
    return Math.min(score, 100);
  }

  private checkLanguageAccuracy(response: string, expectedLanguage: 'ru' | 'en'): number {
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

  private countTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  private checkStructure(response: string): number {
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

  private checkTruncation(response: string): boolean {
    if (!response) return true;
    
    const endsAbruptly = !response.match(/[.!?]\s*$/);
    const tooShort = response.length < 500;
    const hasIncompleteSection = response.includes('...');
    
    return endsAbruptly || tooShort || hasIncompleteSection;
  }

  private calculateQualityScore(metrics: Omit<QualityMetrics, 'qualityScore'>): number {
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
  loadPrompt(language: 'ru' | 'en', type: string = 'main-prompt'): string | null {
    const promptPath = path.join(process.cwd(), 'public', 'prompts', language, `${type}.md`);
    
    try {
      return fs.readFileSync(promptPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  /**
   * Проверяет существование всех необходимых промптов
   */
  validatePromptFiles(): { [key: string]: boolean } {
    const types = ['main-prompt', 'json-structured-prompt', 'business-analytics-prompt', 'hypotheses-prompt'];
    const languages = ['ru', 'en'];
    const results: { [key: string]: boolean } = {};

    for (const language of languages) {
      for (const type of types) {
        const key = `${language}/${type}`;
        results[key] = !!this.loadPrompt(language as 'ru' | 'en', type);
      }
    }

    return results;
  }
}

describe('Prompt Quality Validation', () => {
  let validator: PromptQualityValidator;

  beforeEach(() => {
    validator = new PromptQualityValidator();
  });

  describe('Response Quality Measurement', () => {
    test('should measure high quality Russian response correctly', () => {
      const goodResponse = `# Анализ UX сайта

## Введение
Проведен комплексный анализ пользовательского опыта сайта с целью выявления основных проблем и разработки рекомендаций по их устранению.

## Основные проблемы
1. Медленная загрузка страниц (более 3 секунд)
2. Неинтуитивная навигация в главном меню
3. Отсутствие мобильной адаптации
4. Низкая контрастность текста

## Детальный анализ
### Производительность
Сайт показывает низкие показатели производительности из-за неоптимизированных изображений и избыточного JavaScript кода.

### Пользовательский интерфейс
Интерфейс требует значительных улучшений в области навигации и визуальной иерархии.

## Рекомендации
- Оптимизировать изображения и использовать современные форматы
- Упростить структуру меню навигации
- Внедрить адаптивный дизайн для мобильных устройств
- Увеличить контрастность текста для лучшей читаемости

## Заключение
Реализация предложенных рекомендаций позволит значительно улучшить пользовательский опыт и повысить конверсию сайта.`;

      const metrics = validator.measureResponseQuality(goodResponse, 'ru');

      expect(metrics.qualityScore).toBeGreaterThan(80);
      expect(metrics.completeness).toBeGreaterThan(70);
      expect(metrics.languageAccuracy).toBeGreaterThan(90);
      expect(metrics.hasStructure).toBeGreaterThan(70);
      expect(metrics.isTruncated).toBe(false);
      expect(metrics.tokenCount).toBeGreaterThan(200);
    });

    test('should detect low quality truncated response', () => {
      const badResponse = `Анализ сайта показал проблемы с навигацией и...`;

      const metrics = validator.measureResponseQuality(badResponse, 'ru');

      expect(metrics.qualityScore).toBeLessThan(50);
      expect(metrics.completeness).toBeLessThan(30);
      expect(metrics.isTruncated).toBe(true);
      expect(metrics.tokenCount).toBeLessThan(50);
    });

    test('should measure high quality English response correctly', () => {
      const goodResponse = `# UX Analysis Report

## Introduction
A comprehensive user experience analysis has been conducted to identify key issues and develop actionable recommendations for improvement.

## Main Issues
1. Slow page loading times (over 3 seconds)
2. Unintuitive navigation in the main menu
3. Lack of mobile responsiveness
4. Poor text contrast ratios

## Detailed Analysis
### Performance
The website shows poor performance metrics due to unoptimized images and excessive JavaScript code.

### User Interface
The interface requires significant improvements in navigation structure and visual hierarchy.

## Recommendations
- Optimize images and use modern formats
- Simplify navigation menu structure
- Implement responsive design for mobile devices
- Increase text contrast for better readability

## Conclusion
Implementation of the proposed recommendations will significantly improve user experience and increase website conversion rates.`;

      const metrics = validator.measureResponseQuality(goodResponse, 'en');

      expect(metrics.qualityScore).toBeGreaterThan(80);
      expect(metrics.completeness).toBeGreaterThan(70);
      expect(metrics.languageAccuracy).toBeGreaterThan(90);
      expect(metrics.hasStructure).toBeGreaterThan(70);
      expect(metrics.isTruncated).toBe(false);
    });

    test('should detect language mismatch', () => {
      const russianResponse = `Анализ показал проблемы с навигацией сайта.`;
      const metrics = validator.measureResponseQuality(russianResponse, 'en');

      expect(metrics.languageAccuracy).toBeLessThan(50);
    });
  });

  describe('Prompt File Validation', () => {
    test('should validate existence of all prompt files', () => {
      const results = validator.validatePromptFiles();

      // Проверяем что основные промпты существуют
      expect(results['ru/main-prompt']).toBe(true);
      expect(results['ru/json-structured-prompt']).toBe(true);
      
      // Логируем результаты для диагностики
      console.log('Prompt files validation:', results);
    });

    test('should load Russian main prompt successfully', () => {
      const prompt = validator.loadPrompt('ru', 'main-prompt');
      
      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.length).toBeGreaterThan(100);
        expect(prompt).toContain('анализ'); // Должен содержать русские слова
      }
    });

    test('should load English main prompt successfully', () => {
      const prompt = validator.loadPrompt('en', 'main-prompt');
      
      expect(prompt).not.toBeNull();
      if (prompt) {
        expect(prompt.length).toBeGreaterThan(100);
        expect(prompt).toContain('analysis'); // Должен содержать английские слова
      }
    });
  });

  describe('Quality Thresholds', () => {
    test('should define minimum quality thresholds', () => {
      const QUALITY_THRESHOLDS = {
        MINIMUM_SCORE: 70,
        MINIMUM_COMPLETENESS: 60,
        MINIMUM_LANGUAGE_ACCURACY: 80,
        MINIMUM_STRUCTURE: 50,
        MAXIMUM_TRUNCATION: false
      };

      // Эти пороги будут использоваться в реальных тестах
      expect(QUALITY_THRESHOLDS.MINIMUM_SCORE).toBe(70);
      expect(QUALITY_THRESHOLDS.MINIMUM_LANGUAGE_ACCURACY).toBe(80);
    });
  });

  describe('Token Count Validation', () => {
    test('should count tokens approximately correctly', () => {
      const shortText = 'Тест';
      const longText = 'Это длинный текст для тестирования подсчета токенов в системе анализа качества промптов';

      const shortMetrics = validator.measureResponseQuality(shortText, 'ru');
      const longMetrics = validator.measureResponseQuality(longText, 'ru');

      expect(shortMetrics.tokenCount).toBeLessThan(10);
      expect(longMetrics.tokenCount).toBeGreaterThan(15);
      expect(longMetrics.tokenCount).toBeGreaterThan(shortMetrics.tokenCount);
    });
  });
});