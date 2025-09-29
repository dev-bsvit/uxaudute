/**
 * Система измерения качества ответов для UX анализа
 */

export interface QualityMetrics {
  completeness: number;
  languageAccuracy: number;
  tokenCount: number;
  hasStructure: number;
  isTruncated: boolean;
  qualityScore: number;
  timestamp: string;
}

export interface QualityThresholds {
  minimumScore: number;
  minimumCompleteness: number;
  minimumLanguageAccuracy: number;
  minimumStructure: number;
  maximumTokens: number;
}

export class ResponseQualityAnalyzer {
  private static readonly DEFAULT_THRESHOLDS: QualityThresholds = {
    minimumScore: 70,
    minimumCompleteness: 60,
    minimumLanguageAccuracy: 80,
    minimumStructure: 50,
    maximumTokens: 4000
  };

  /**
   * Измеряет качество ответа
   */
  static measureQuality(
    response: string, 
    language: 'ru' | 'en' = 'ru',
    thresholds: QualityThresholds = this.DEFAULT_THRESHOLDS
  ): QualityMetrics {
    const metrics = {
      completeness: this.checkCompleteness(response),
      languageAccuracy: this.checkLanguageAccuracy(response, language),
      tokenCount: this.countTokens(response),
      hasStructure: this.checkStructure(response),
      isTruncated: this.checkTruncation(response),
      timestamp: new Date().toISOString()
    };

    const qualityScore = this.calculateQualityScore(metrics);

    return {
      ...metrics,
      qualityScore
    };
  }

  /**
   * Проверяет, соответствует ли ответ минимальным требованиям качества
   */
  static meetsQualityStandards(
    metrics: QualityMetrics,
    thresholds: QualityThresholds = this.DEFAULT_THRESHOLDS
  ): boolean {
    return (
      metrics.qualityScore >= thresholds.minimumScore &&
      metrics.completeness >= thresholds.minimumCompleteness &&
      metrics.languageAccuracy >= thresholds.minimumLanguageAccuracy &&
      metrics.hasStructure >= thresholds.minimumStructure &&
      !metrics.isTruncated &&
      metrics.tokenCount <= thresholds.maximumTokens
    );
  }

  /**
   * Создает отчет о качестве ответа
   */
  static generateQualityReport(metrics: QualityMetrics): string {
    const status = this.meetsQualityStandards(metrics) ? '✅ PASSED' : '❌ FAILED';
    
    return `
Quality Report ${status}
========================
Overall Score: ${metrics.qualityScore}/100
Completeness: ${metrics.completeness}/100
Language Accuracy: ${metrics.languageAccuracy}/100
Structure: ${metrics.hasStructure}/100
Token Count: ${metrics.tokenCount}
Truncated: ${metrics.isTruncated ? 'Yes' : 'No'}
Timestamp: ${metrics.timestamp}
    `.trim();
  }

  /**
   * Проверяет полноту ответа
   */
  private static checkCompleteness(response: string): number {
    if (!response || typeof response !== 'string') return 0;
    
    const minLength = 1000;
    const hasConclusion = response.includes('Заключение') || 
                         response.includes('Conclusion') ||
                         response.includes('Выводы') ||
                         response.includes('Summary');
    
    const hasRecommendations = response.includes('Рекомендации') || 
                              response.includes('Recommendations') ||
                              response.includes('Предложения') ||
                              response.includes('Suggestions');
    
    const hasAnalysis = response.includes('Анализ') ||
                       response.includes('Analysis') ||
                       response.includes('Исследование') ||
                       response.includes('Research');
    
    let score = 0;
    if (response.length >= minLength) score += 30;
    if (response.length >= minLength * 1.5) score += 10; // Бонус за подробность
    if (hasConclusion) score += 25;
    if (hasRecommendations) score += 25;
    if (hasAnalysis) score += 10;
    
    return Math.min(score, 100);
  }

  /**
   * Проверяет соответствие языка
   */
  private static checkLanguageAccuracy(response: string, expectedLanguage: 'ru' | 'en'): number {
    if (!response) return 0;
    
    const russianChars = (response.match(/[а-яё]/gi) || []).length;
    const englishChars = (response.match(/[a-z]/gi) || []).length;
    const totalChars = russianChars + englishChars;
    
    if (totalChars === 0) return 0;
    
    const russianRatio = russianChars / totalChars;
    
    if (expectedLanguage === 'ru') {
      // Для русского языка ожидаем минимум 70% кириллицы
      return russianRatio >= 0.7 ? 100 : Math.max(0, russianRatio * 100);
    } else if (expectedLanguage === 'en') {
      // Для английского языка ожидаем максимум 30% кириллицы
      return russianRatio <= 0.3 ? 100 : Math.max(0, (1 - russianRatio) * 100);
    }
    
    return 0;
  }

  /**
   * Подсчитывает приблизительное количество токенов
   */
  private static countTokens(text: string): number {
    if (!text) return 0;
    
    // Более точная оценка токенов:
    // - Русский текст: ~4 символа на токен
    // - Английский текст: ~4 символа на токен
    // - Учитываем пробелы и знаки препинания
    const words = text.split(/\s+/).length;
    const chars = text.length;
    
    // Комбинированная оценка
    return Math.ceil((chars / 4 + words) / 2);
  }

  /**
   * Проверяет структурированность ответа
   */
  private static checkStructure(response: string): number {
    if (!response) return 0;
    
    const hasMarkdownHeaders = /#{1,6}\s/.test(response);
    const hasBoldText = /\*\*.*\*\*/.test(response);
    const hasNumberedLists = /^\s*\d+\.\s/m.test(response);
    const hasBulletLists = /^\s*[-*+]\s/m.test(response);
    const hasSections = response.split('\n\n').length > 3;
    const hasCodeBlocks = /```/.test(response);
    
    let score = 0;
    if (hasMarkdownHeaders) score += 25;
    if (hasBoldText) score += 15;
    if (hasNumberedLists) score += 20;
    if (hasBulletLists) score += 15;
    if (hasSections) score += 20;
    if (hasCodeBlocks) score += 5;
    
    return Math.min(score, 100);
  }

  /**
   * Проверяет, обрезан ли ответ
   */
  private static checkTruncation(response: string): boolean {
    if (!response) return true;
    
    const endsAbruptly = !response.match(/[.!?]\s*$/);
    const tooShort = response.length < 500;
    const hasIncompleteSection = response.includes('...');
    const endsWithIncomplete = response.endsWith('..') || response.endsWith('…');
    const hasUnfinishedSentence = /[а-яa-z]\s*$/i.test(response.trim());
    
    return endsAbruptly || tooShort || hasIncompleteSection || endsWithIncomplete || hasUnfinishedSentence;
  }

  /**
   * Вычисляет общий балл качества
   */
  private static calculateQualityScore(metrics: Omit<QualityMetrics, 'qualityScore' | 'timestamp'>): number {
    const weights = {
      completeness: 0.35,      // Самый важный фактор
      languageAccuracy: 0.25,  // Критично для мультиязычности
      hasStructure: 0.20,      // Важно для читаемости
      isTruncated: 0.20        // Критично для полноты
    };

    let score = 0;
    score += metrics.completeness * weights.completeness;
    score += metrics.languageAccuracy * weights.languageAccuracy;
    score += metrics.hasStructure * weights.hasStructure;
    score += (metrics.isTruncated ? 0 : 100) * weights.isTruncated;

    return Math.round(score);
  }

  /**
   * Сравнивает качество двух ответов
   */
  static compareQuality(metrics1: QualityMetrics, metrics2: QualityMetrics): {
    better: 'first' | 'second' | 'equal';
    difference: number;
    details: string;
  } {
    const diff = metrics1.qualityScore - metrics2.qualityScore;
    
    let better: 'first' | 'second' | 'equal';
    if (Math.abs(diff) < 5) {
      better = 'equal';
    } else if (diff > 0) {
      better = 'first';
    } else {
      better = 'second';
    }

    const details = `
Comparison Details:
First:  ${metrics1.qualityScore}/100 (C:${metrics1.completeness}, L:${metrics1.languageAccuracy}, S:${metrics1.hasStructure}, T:${metrics1.isTruncated})
Second: ${metrics2.qualityScore}/100 (C:${metrics2.completeness}, L:${metrics2.languageAccuracy}, S:${metrics2.hasStructure}, T:${metrics2.isTruncated})
    `.trim();

    return {
      better,
      difference: Math.abs(diff),
      details
    };
  }

  /**
   * Логирует метрики качества для мониторинга
   */
  static logQualityMetrics(metrics: QualityMetrics, context: string = ''): void {
    const logData = {
      context,
      timestamp: metrics.timestamp,
      qualityScore: metrics.qualityScore,
      completeness: metrics.completeness,
      languageAccuracy: metrics.languageAccuracy,
      hasStructure: metrics.hasStructure,
      isTruncated: metrics.isTruncated,
      tokenCount: metrics.tokenCount,
      meetsStandards: this.meetsQualityStandards(metrics)
    };

    console.log('Quality Metrics:', JSON.stringify(logData, null, 2));
  }
}