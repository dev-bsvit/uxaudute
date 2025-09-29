# Design Document

## Overview

Данный документ описывает техническое решение для восстановления качества ответов в мультиязычной системе UX Audit Platform. Проблема заключается в том, что stable ветка с русским промптом работает отлично, но main ветка с мультиязычностью дает обрезанные и неполные ответы. Необходимо исправить логику мультиязычности, сохранив качество из stable ветки.

## Architecture

### Current State Analysis

**Stable Branch (Working):**
- Использует фиксированный русский промпт
- Дает полные качественные ответы
- Простая логика без переключения языков

**Main Branch (Broken):**
- Мультиязычная система с переключением промптов
- Обрезанные ответы на русском и английском
- Английские запросы возвращают русские ответы

### Root Cause Hypothesis

1. **Prompt Loading Issues**: Неправильная загрузка промптов по языкам
2. **Language Detection Problems**: Некорректное определение языка
3. **Token Limit Issues**: Превышение лимитов токенов при мультиязычности
4. **API Route Logic**: Проблемы в route.ts файлах

## Components and Interfaces

### 1. Prompt Management System

**Current Structure:**
```
public/prompts/
├── ru/
│   ├── main-prompt.md
│   ├── json-structured-prompt.md
│   └── ...
└── en/
    ├── main-prompt.md
    ├── json-structured-prompt.md
    └── ...
```

**Enhanced Prompt Service:**
```typescript
interface PromptService {
  loadPrompt(type: string, language: string): Promise<string>
  validatePrompt(content: string): boolean
  getStablePrompt(type: string): Promise<string> // From stable branch
}
```

### 2. Language Detection and Management

**Current Issues:**
- Inconsistent language detection
- Language switching affects prompt quality

**Enhanced Language Manager:**
```typescript
interface LanguageManager {
  detectLanguage(request: any): string
  validateLanguageConsistency(input: string, output: string): boolean
  enforceLanguageConstraints(language: string, prompt: string): string
}
```

### 3. API Route Enhancement

**Target Routes:**
- `/api/research`
- `/api/research-with-credits`
- Other analysis endpoints

**Enhanced Route Logic:**
```typescript
interface AnalysisRequest {
  language: string
  promptType: string
  data: any
}

interface AnalysisResponse {
  result: string
  language: string
  promptUsed: string
  tokenCount: number
}
```

## Data Models

### Prompt Configuration Model
```typescript
interface PromptConfig {
  id: string
  language: 'ru' | 'en'
  type: 'main' | 'json-structured' | 'business' | 'hypotheses'
  content: string
  version: string
  isStable: boolean
  tokenCount: number
}
```

### Language Context Model
```typescript
interface LanguageContext {
  requestLanguage: string
  detectedLanguage: string
  promptLanguage: string
  responseLanguage: string
  isConsistent: boolean
}
```

### Analysis Session Model
```typescript
interface AnalysisSession {
  id: string
  language: string
  promptConfig: PromptConfig
  request: any
  response: any
  quality: {
    isComplete: boolean
    tokenCount: number
    hasCorrectLanguage: boolean
  }
}
```

## Error Handling

### Prompt Loading Errors
```typescript
class PromptLoadingError extends Error {
  constructor(
    public promptType: string,
    public language: string,
    public fallbackUsed: boolean
  ) {
    super(`Failed to load prompt: ${promptType} for ${language}`)
  }
}
```

### Language Consistency Errors
```typescript
class LanguageConsistencyError extends Error {
  constructor(
    public expectedLanguage: string,
    public actualLanguage: string
  ) {
    super(`Language mismatch: expected ${expectedLanguage}, got ${actualLanguage}`)
  }
}
```

### Quality Validation Errors
```typescript
class ResponseQualityError extends Error {
  constructor(
    public issue: 'truncated' | 'incomplete' | 'wrong_language',
    public details: string
  ) {
    super(`Response quality issue: ${issue} - ${details}`)
  }
}
```

## Testing Strategy

### 1. Prompt Quality Tests
- Compare responses between stable and main branches
- Validate response completeness
- Check language consistency

### 2. Integration Tests
```typescript
describe('Multilingual Analysis', () => {
  test('Russian analysis returns complete Russian response', async () => {
    const response = await analyzeInLanguage('ru', testData)
    expect(response.language).toBe('ru')
    expect(response.isComplete).toBe(true)
    expect(response.quality).toBeGreaterThan(stableThreshold)
  })

  test('English analysis returns complete English response', async () => {
    const response = await analyzeInLanguage('en', testData)
    expect(response.language).toBe('en')
    expect(response.isComplete).toBe(true)
    expect(response.quality).toBeGreaterThan(stableThreshold)
  })
})
```

### 3. Performance Tests
- Token usage comparison
- Response time analysis
- Memory usage monitoring

## Implementation Phases

### Phase 1: Diagnosis and Baseline
1. Create comparison tool between stable and main branches
2. Identify exact differences in prompt handling
3. Establish quality metrics baseline

### Phase 2: Prompt System Refactoring
1. Extract stable prompts as reference
2. Implement robust prompt loading mechanism
3. Add prompt validation and fallback logic

### Phase 3: Language Management Enhancement
1. Improve language detection accuracy
2. Implement language consistency validation
3. Add language-specific response formatting

### Phase 4: API Route Optimization
1. Refactor route.ts files for better language handling
2. Implement proper error handling and logging
3. Add response quality validation

### Phase 5: Testing and Validation
1. Comprehensive testing against stable branch quality
2. Performance optimization
3. Documentation and monitoring setup

## Migration Strategy

### Backward Compatibility
- Maintain existing API interfaces
- Gradual rollout with feature flags
- Fallback to stable prompts if issues detected

### Rollback Plan
- Quick revert to stable branch logic
- Preserve current working functionality
- Minimal disruption to users

## Monitoring and Metrics

### Quality Metrics
- Response completeness percentage
- Language accuracy rate
- Token usage efficiency
- User satisfaction scores

### Performance Metrics
- Response time per language
- Error rate by prompt type
- System resource usage
- API endpoint reliability

## Security Considerations

### Prompt Injection Prevention
- Validate all user inputs
- Sanitize prompt parameters
- Implement rate limiting

### Language-based Attacks
- Prevent language switching exploits
- Validate language consistency
- Monitor for suspicious patterns