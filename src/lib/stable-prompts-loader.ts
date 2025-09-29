/**
 * Загрузчик стабильных промптов из stable ветки
 * Используется как fallback для обеспечения качества ответов
 */

import { PromptType } from './i18n/types'

export interface StablePromptConfig {
  version: string
  source: 'stable-branch' | 'manual' | 'backup'
  extractedAt: string
  quality: {
    tested: boolean
    qualityScore: number
    language: 'ru' | 'en'
  }
}

export class StablePromptsLoader {
  private static readonly STABLE_PROMPTS: Record<PromptType, { content: string; config: StablePromptConfig }> = {
    [PromptType.MAIN]: {
      content: `Ты опытный UX-дизайнер-исследователь с 20-летним стажем. Анализируй интерфейсы на основе проверенных UX-методологий: эвристики Нильсена, WCAG 2.2, закон Фиттса, закон Хика-Хаймана, ISO 9241 и др.

Входные данные: статичный скриншот (обязательно) + контекст и целевая аудитория при наличии.

Результат анализа:
1. Описание экрана
2. UX-опрос с 5 вопросами
3. Проблемы и рекомендации
4. Самопроверка и уверенность

Отвечай на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 95,
          language: 'ru'
        }
      }
    },

    [PromptType.JSON_STRUCTURED]: {
      content: `Ты опытный UX-дизайнер-исследователь. Анализируй интерфейс и возвращай результат в JSON формате.

**КРИТИЧЕСКИ ВАЖНО: 
1. Отвечай ТОЛЬКО в JSON формате
2. НЕ добавляй никакого текста до или после JSON
3. НЕ оборачивай JSON в markdown блоки
4. Начинай ответ с { и заканчивай }
5. Используй эту структуру: {"screenDescription": {"screenType": "...", "userGoal": "...", "keyElements": [], "confidence": 85, "confidenceReason": "..."}, "uxSurvey": {"questions": [], "overallConfidence": 85}, "audience": {"targetAudience": "...", "mainPain": "...", "fears": []}, "behavior": {"userScenarios": {"idealPath": "...", "typicalError": "...", "alternativeWorkaround": "..."}, "behavioralPatterns": "...", "frictionPoints": [], "actionMotivation": "..."}, "problemsAndSolutions": [], "selfCheck": {"checklist": {}, "confidence": {}}, "metadata": {}}
6. Используй реальные названия полей, а не заглушки в скобках типа [metadata] или [model]
7. Одиночные значения не должны быть обернуты в массивы**

Отвечай на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 92,
          language: 'ru'
        }
      }
    },

    [PromptType.SONOMA_STRUCTURED]: {
      content: `Ты опытный UX-дизайнер-исследователь. Анализируй интерфейс и возвращай структурированные результаты.

Отвечай ТОЛЬКО в JSON формате на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 88,
          language: 'ru'
        }
      }
    },

    [PromptType.AB_TEST]: {
      content: `Анализируй интерфейс на предмет возможностей A/B тестирования. Сосредоточься на элементах, которые могут повлиять на конверсию.

Отвечай на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 85,
          language: 'ru'
        }
      }
    },

    [PromptType.BUSINESS_ANALYTICS]: {
      content: `Анализируй интерфейс с точки зрения бизнес-аналитики. Сосредоточься на метриках и KPI.

Отвечай на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 87,
          language: 'ru'
        }
      }
    },

    [PromptType.HYPOTHESES]: {
      content: `Генерируй гипотезы для улучшения интерфейса на основе UX принципов.

Отвечай на выбранном языке.`,
      config: {
        version: '1.0.0',
        source: 'stable-branch',
        extractedAt: '2024-01-15T10:00:00Z',
        quality: {
          tested: true,
          qualityScore: 86,
          language: 'ru'
        }
      }
    }
  }

  /**
   * Загружает все стабильные промпты
   */
  static loadAllStablePrompts(): Record<PromptType, string> {
    const prompts: Record<PromptType, string> = {} as Record<PromptType, string>
    
    for (const [type, data] of Object.entries(this.STABLE_PROMPTS)) {
      prompts[type as PromptType] = data.content
    }

    console.log(`✅ Loaded ${Object.keys(prompts).length} stable prompts`)
    return prompts
  }

  /**
   * Получает стабильный промпт по типу
   */
  static getStablePrompt(promptType: PromptType): string | null {
    return this.STABLE_PROMPTS[promptType]?.content || null
  }

  /**
   * Получает конфигурацию стабильного промпта
   */
  static getStablePromptConfig(promptType: PromptType): StablePromptConfig | null {
    return this.STABLE_PROMPTS[promptType]?.config || null
  }

  /**
   * Проверяет качество стабильного промпта
   */
  static getStablePromptQuality(promptType: PromptType): number {
    return this.STABLE_PROMPTS[promptType]?.config.quality.qualityScore || 0
  }

  /**
   * Получает статистику стабильных промптов
   */
  static getStablePromptsStats(): {
    totalPrompts: number
    averageQuality: number
    testedPrompts: number
    languages: string[]
    lastExtracted: string
  } {
    const prompts = Object.values(this.STABLE_PROMPTS)
    const totalPrompts = prompts.length
    const averageQuality = prompts.reduce((sum, p) => sum + p.config.quality.qualityScore, 0) / totalPrompts
    const testedPrompts = prompts.filter(p => p.config.quality.tested).length
    const languages = [...new Set(prompts.map(p => p.config.quality.language))]
    const lastExtracted = prompts.reduce((latest, p) => 
      p.config.extractedAt > latest ? p.config.extractedAt : latest, 
      prompts[0]?.config.extractedAt || ''
    )

    return {
      totalPrompts,
      averageQuality: Math.round(averageQuality),
      testedPrompts,
      languages,
      lastExtracted
    }
  }

  /**
   * Создает английские версии промптов (переводы)
   */
  static generateEnglishPrompts(): Record<PromptType, string> {
    const englishPrompts: Record<PromptType, string> = {
      [PromptType.MAIN]: `You are an experienced UX designer-researcher with 20 years of experience. Analyze interfaces based on proven UX methodologies: Nielsen's heuristics, WCAG 2.2, Fitts' Law, Hick-Hyman Law, ISO 9241, etc.

Input: static screenshot (required) + context and target audience if available.

Analysis result:
1. Screen description
2. UX survey with 5 questions
3. Problems and recommendations
4. Self-check and confidence

Respond in the selected language.`,

      [PromptType.JSON_STRUCTURED]: `You are an experienced UX designer-researcher. Analyze the interface and return the result in JSON format.

**CRITICALLY IMPORTANT: 
1. Respond ONLY in JSON format
2. Do NOT add any text before or after JSON
3. Do NOT wrap JSON in markdown blocks
4. Start response with { and end with }
5. Use this structure: {"screenDescription": {"screenType": "...", "userGoal": "...", "keyElements": [], "confidence": 85, "confidenceReason": "..."}, "uxSurvey": {"questions": [], "overallConfidence": 85}, "audience": {"targetAudience": "...", "mainPain": "...", "fears": []}, "behavior": {"userScenarios": {"idealPath": "...", "typicalError": "...", "alternativeWorkaround": "..."}, "behavioralPatterns": "...", "frictionPoints": [], "actionMotivation": "..."}, "problemsAndSolutions": [], "selfCheck": {"checklist": {}, "confidence": {}}, "metadata": {}}
6. Use actual field names, not placeholder brackets like [metadata] or [model]
7. Single values should not be wrapped in arrays**

Respond in the selected language.`,

      [PromptType.SONOMA_STRUCTURED]: `You are an experienced UX designer-researcher. Analyze the interface and return structured results.

Respond ONLY in JSON format in the selected language.`,

      [PromptType.AB_TEST]: `Analyze the interface for A/B testing opportunities. Focus on elements that could impact conversion rates.

Respond in the selected language.`,

      [PromptType.BUSINESS_ANALYTICS]: `Analyze the interface from a business analytics perspective. Focus on metrics and KPIs.

Respond in the selected language.`,

      [PromptType.HYPOTHESES]: `Generate hypotheses for interface improvements based on UX principles.

Respond in the selected language.`
    }

    console.log(`✅ Generated ${Object.keys(englishPrompts).length} English prompts`)
    return englishPrompts
  }

  /**
   * Валидирует что промпт соответствует стабильному
   */
  static validateAgainstStable(content: string, promptType: PromptType): {
    isValid: boolean
    similarity: number
    issues: string[]
  } {
    const stablePrompt = this.getStablePrompt(promptType)
    if (!stablePrompt) {
      return {
        isValid: false,
        similarity: 0,
        issues: ['No stable prompt available for comparison']
      }
    }

    const issues: string[] = []
    
    // Проверяем длину (не должна сильно отличаться)
    const lengthDiff = Math.abs(content.length - stablePrompt.length) / stablePrompt.length
    if (lengthDiff > 0.5) {
      issues.push(`Length difference too large: ${Math.round(lengthDiff * 100)}%`)
    }

    // Проверяем ключевые фразы
    const stableKeyPhrases = this.extractKeyPhrases(stablePrompt)
    const contentKeyPhrases = this.extractKeyPhrases(content)
    const missingPhrases = stableKeyPhrases.filter(phrase => 
      !contentKeyPhrases.some(cp => cp.toLowerCase().includes(phrase.toLowerCase()))
    )

    if (missingPhrases.length > 0) {
      issues.push(`Missing key phrases: ${missingPhrases.join(', ')}`)
    }

    // Простая оценка схожести
    const similarity = Math.max(0, 1 - lengthDiff - (missingPhrases.length * 0.1))

    return {
      isValid: issues.length === 0 && similarity > 0.7,
      similarity: Math.round(similarity * 100),
      issues
    }
  }

  /**
   * Извлекает ключевые фразы из промпта
   */
  private static extractKeyPhrases(content: string): string[] {
    // Простое извлечение ключевых фраз
    const phrases = content
      .toLowerCase()
      .split(/[.!?;]/)
      .map(s => s.trim())
      .filter(s => s.length > 10 && s.length < 100)
      .slice(0, 5) // Берем первые 5 предложений как ключевые

    return phrases
  }
}