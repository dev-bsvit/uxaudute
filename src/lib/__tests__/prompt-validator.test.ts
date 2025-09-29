import { describe, test, expect } from '@jest/test-globals';
import { PromptValidator } from '../prompt-validator';
import { PromptType } from '../i18n/types';

describe('PromptValidator', () => {
  describe('Basic Structure Validation', () => {
    test('should reject empty prompts', async () => {
      const result = await PromptValidator.validatePrompt('', PromptType.MAIN, 'ru');
      
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.code === 'EMPTY_PROMPT')).toBe(true);
      expect(result.score).toBeLessThan(50);
    });

    test('should reject too short prompts', async () => {
      const shortPrompt = 'Анализируй';
      const result = await PromptValidator.validatePrompt(shortPrompt, PromptType.MAIN, 'ru');
      
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.code === 'PROMPT_TOO_SHORT')).toBe(true);
    });

    test('should accept well-formed prompts', async () => {
      const goodPrompt = `Ты опытный UX-дизайнер-исследователь с 20-летним стажем. 
      Анализируй интерфейсы на основе проверенных UX-методологий: эвристики Нильсена, WCAG 2.2, закон Фиттса.
      
      Входные данные: статичный скриншот + контекст и целевая аудитория при наличии.
      
      Результат анализа:
      1. Описание экрана
      2. UX-опрос с 5 вопросами
      3. Проблемы и рекомендации
      4. Самопроверка и уверенность`;

      const result = await PromptValidator.validatePrompt(goodPrompt, PromptType.MAIN, 'ru');
      
      expect(result.score).toBeGreaterThan(70);
      expect(result.metadata.language).toBe('ru');
      expect(result.metadata.tokenCount).toBeGreaterThan(50);
    });
  });

  describe('Language Detection', () => {
    test('should detect Russian language correctly', async () => {
      const russianPrompt = 'Анализируй интерфейс пользователя и предоставь рекомендации по улучшению UX дизайна';
      const result = await PromptValidator.validatePrompt(russianPrompt, PromptType.MAIN, 'ru');
      
      expect(result.metadata.language).toBe('ru');
      expect(result.issues.some(issue => issue.code === 'LANGUAGE_MISMATCH')).toBe(false);
    });

    test('should detect English language correctly', async () => {
      const englishPrompt = 'Analyze the user interface and provide recommendations for improving UX design';
      const result = await PromptValidator.validatePrompt(englishPrompt, PromptType.MAIN, 'en');
      
      expect(result.metadata.language).toBe('en');
      expect(result.issues.some(issue => issue.code === 'LANGUAGE_MISMATCH')).toBe(false);
    });

    test('should detect language mismatch', async () => {
      const russianPrompt = 'Анализируй интерфейс пользователя';
      const result = await PromptValidator.validatePrompt(russianPrompt, PromptType.MAIN, 'en');
      
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.code === 'LANGUAGE_MISMATCH')).toBe(true);
    });
  });

  describe('Prompt Type Validation', () => {
    test('should validate JSON structured prompt requirements', async () => {
      const jsonPrompt = `Анализируй интерфейс и возвращай результат в JSON формате.
      
      Используй структуру: {"screenDescription": {...}, "uxSurvey": {...}, "problemsAndSolutions": [...], "selfCheck": {...}}
      
      НЕ оборачивай JSON в markdown блоки.`;

      const result = await PromptValidator.validatePrompt(jsonPrompt, PromptType.JSON_STRUCTURED, 'ru');
      
      expect(result.score).toBeGreaterThan(60);
      expect(result.issues.some(issue => issue.code === 'MISSING_JSON_FIELDS')).toBe(false);
    });

    test('should detect missing JSON fields', async () => {
      const incompleteJsonPrompt = 'Анализируй интерфейс в JSON формате';
      const result = await PromptValidator.validatePrompt(incompleteJsonPrompt, PromptType.JSON_STRUCTURED, 'ru');
      
      expect(result.isValid).toBe(false);
      expect(result.issues.some(issue => issue.code === 'MISSING_JSON_FIELDS')).toBe(true);
    });

    test('should validate A/B test prompt requirements', async () => {
      const abTestPrompt = 'Анализируй интерфейс на предмет возможностей A/B тестирования. Сосредоточься на элементах конверсии.';
      const result = await PromptValidator.validatePrompt(abTestPrompt, PromptType.AB_TEST, 'ru');
      
      expect(result.score).toBeGreaterThan(50);
      expect(result.issues.some(issue => issue.code === 'MISSING_REQUIRED_ELEMENTS')).toBe(false);
    });
  });

  describe('Quick Validation', () => {
    test('should quickly validate good prompts', async () => {
      const goodPrompt = 'Анализируй интерфейс пользователя с точки зрения UX принципов';
      const isValid = await PromptValidator.quickValidate(goodPrompt, PromptType.MAIN);
      
      expect(isValid).toBe(true);
    });

    test('should quickly reject bad prompts', async () => {
      const badPrompt = 'Плохой промпт';
      const isValid = await PromptValidator.quickValidate(badPrompt, PromptType.MAIN);
      
      expect(isValid).toBe(false);
    });

    test('should reject empty prompts quickly', async () => {
      const isValid = await PromptValidator.quickValidate('', PromptType.MAIN);
      
      expect(isValid).toBe(false);
    });
  });

  describe('Validation Report', () => {
    test('should format validation report correctly', async () => {
      const prompt = 'Анализируй интерфейс';
      const result = await PromptValidator.validatePrompt(prompt, PromptType.MAIN, 'ru');
      const report = PromptValidator.formatValidationReport(result);
      
      expect(report).toContain('Prompt Validation Report');
      expect(report).toContain('Score:');
      expect(report).toContain('Language:');
      expect(report).toContain('Type:');
      
      if (result.issues.length > 0) {
        expect(report).toContain('Issues:');
      }
      
      if (result.recommendations.length > 0) {
        expect(report).toContain('Recommendations:');
      }
    });
  });

  describe('Token Count Validation', () => {
    test('should validate reasonable token counts', async () => {
      const mediumPrompt = 'Анализируй интерфейс пользователя на основе UX принципов. '.repeat(10);
      const result = await PromptValidator.validatePrompt(mediumPrompt, PromptType.MAIN, 'ru');
      
      expect(result.metadata.tokenCount).toBeGreaterThan(50);
      expect(result.metadata.tokenCount).toBeLessThan(2000);
    });

    test('should warn about very long prompts', async () => {
      const longPrompt = 'Очень длинный промпт для анализа интерфейса. '.repeat(200);
      const result = await PromptValidator.validatePrompt(longPrompt, PromptType.MAIN, 'ru');
      
      expect(result.issues.some(issue => issue.code === 'HIGH_TOKEN_COUNT')).toBe(true);
    });
  });

  describe('Recommendations Generation', () => {
    test('should generate helpful recommendations for issues', async () => {
      const badPrompt = 'Плохой';
      const result = await PromptValidator.validatePrompt(badPrompt, PromptType.JSON_STRUCTURED, 'ru');
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => rec.includes('instructions'))).toBe(true);
    });

    test('should provide specific recommendations for JSON prompts', async () => {
      const incompleteJsonPrompt = 'JSON анализ';
      const result = await PromptValidator.validatePrompt(incompleteJsonPrompt, PromptType.JSON_STRUCTURED, 'ru');
      
      expect(result.recommendations.some(rec => rec.includes('JSON'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null and undefined inputs gracefully', async () => {
      const result1 = await PromptValidator.validatePrompt(null as any, PromptType.MAIN, 'ru');
      const result2 = await PromptValidator.validatePrompt(undefined as any, PromptType.MAIN, 'ru');
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    test('should handle mixed language content', async () => {
      const mixedPrompt = 'Analyze интерфейс and provide рекомендации for UX улучшения';
      const result = await PromptValidator.validatePrompt(mixedPrompt, PromptType.MAIN, 'ru');
      
      expect(result.metadata.language).toBe('unknown');
    });

    test('should handle special characters and formatting', async () => {
      const formattedPrompt = `
        # Анализ UX
        
        **Инструкции:**
        1. Анализируй интерфейс
        2. Предоставь рекомендации
        
        > Важно: используй UX принципы
      `;
      
      const result = await PromptValidator.validatePrompt(formattedPrompt, PromptType.MAIN, 'ru');
      
      expect(result.score).toBeGreaterThan(0);
      expect(result.metadata.tokenCount).toBeGreaterThan(0);
    });
  });
});