# 🔧 Проблема с загрузкой промптов в многоязычной системе

## 📋 Краткое описание проблемы

**Дата обнаружения**: 26.09.2025  
**Статус**: Временно решено через обходной путь  
**Приоритет**: Средний (функциональность работает, но не через многоязычную систему)

## 🎯 Суть проблемы

### Симптомы:
- `promptService.loadPrompt()` возвращает **упрощенный результат** (1,313 символов)
- `loadJSONPromptV2()` возвращает **полный результат** (4,416+ символов)
- AI дает разные по качеству ответы в зависимости от способа загрузки промпта

### Корень проблемы:
**`promptService.loadPrompt()` использует fallback на базовый промпт вместо загрузки полного файла**

## 🔍 Техническая диагностика

### Что происходит в `promptService.loadPrompt()`:

1. **Вызов**: `promptService.loadPrompt(PromptType.JSON_STRUCTURED, 'ru')`
2. **Путь файла**: `/prompts/ru/json-structured-prompt.md`
3. **Метод загрузки**: `fetch('/prompts/ru/json-structured-prompt.md')` в `fetchPromptFile()`
4. **Проблема**: `fetch()` не работает для локальных файлов в Next.js API routes (серверный контекст)
5. **Результат**: Срабатывает fallback на `getBasicPrompt()` который возвращает короткий промпт

### Базовый промпт (fallback):
```typescript
[PromptType.JSON_STRUCTURED]: `You are an experienced UX designer-researcher. Analyze the interface and return the result in JSON format.
// ... короткий промпт без детальных инструкций
`
```

### Полный промпт (v2):
- **Файл**: `prompts/json-structured-prompt-v2.md`
- **Размер**: 25,193 символов
- **Содержит**: Детальные инструкции, примеры, требования к структуре

## ✅ Текущее решение (временное)

### В `src/app/api/research-with-credits/route.ts`:

```typescript
// РАБОТАЕТ (используется сейчас):
const { loadJSONPromptV2 } = await import('@/lib/prompt-loader')
jsonPrompt = await loadJSONPromptV2()

// НЕ РАБОТАЕТ (fallback на базовый промпт):
jsonPrompt = await promptService.loadPrompt(PromptType.JSON_STRUCTURED, language)
```

### Результаты:
- ✅ **loadJSONPromptV2()**: 4,416+ символов, полная структура
- ❌ **promptService.loadPrompt()**: 1,313 символов, упрощенная структура

## 🔧 Постоянное решение (TODO)

### Нужно исправить `fetchPromptFile()` в `src/lib/i18n/prompt-service.ts`:

```typescript
// ТЕКУЩИЙ КОД (не работает в API routes):
private async fetchPromptFile(promptType: PromptType, language: string): Promise<string> {
  const fileName = this.getPromptFileName(promptType)
  const url = `/prompts/${language}/${fileName}`
  
  const response = await fetch(url) // ❌ Не работает на сервере
  // ...
}

// ИСПРАВЛЕННЫЙ КОД (нужно реализовать):
private async fetchPromptFile(promptType: PromptType, language: string): Promise<string> {
  const fileName = this.getPromptFileName(promptType)
  const filePath = join(process.cwd(), 'public', 'prompts', language, fileName)
  
  const content = readFileSync(filePath, 'utf-8') // ✅ Работает на сервере
  return content
}
```

### Необходимые импорты:
```typescript
import { readFileSync } from 'fs'
import { join } from 'path'
```

## 📊 Сравнение результатов

| Метод загрузки | Размер ответа | Качество | Многоязычность |
|----------------|---------------|----------|----------------|
| `loadJSONPromptV2()` | 4,416+ символов | ✅ Полный | ❌ Только русский |
| `promptService.loadPrompt()` | 1,313 символов | ❌ Упрощенный | ✅ Поддерживает |

## 🎯 План действий

### Краткосрочно (сделано):
- [x] Используем `loadJSONPromptV2()` для стабильной работы
- [x] Документируем проблему

### Долгосрочно (TODO):
- [ ] Исправить `fetchPromptFile()` для работы с `fs.readFileSync()`
- [ ] Протестировать многоязычную систему
- [ ] Переключиться обратно на `promptService.loadPrompt()`
- [ ] Удалить временный код с `loadJSONPromptV2()`

## 🔍 Файлы для изучения

### Проблемные файлы:
- `src/lib/i18n/prompt-service.ts` - метод `fetchPromptFile()`
- `src/app/api/research-with-credits/route.ts` - временное решение

### Рабочие файлы:
- `src/lib/prompt-loader.ts` - `loadJSONPromptV2()` работает
- `prompts/json-structured-prompt-v2.md` - полный промпт

### Файлы промптов:
- `prompts/json-structured-prompt-v2.md` (25,193 символов) - полный
- `public/prompts/ru/json-structured-prompt.md` (25,193 символов) - идентичный
- Базовый промпт в коде (короткий fallback)

## 🚨 Важные заметки

1. **НЕ УДАЛЯТЬ** `loadJSONPromptV2()` пока не исправлена многоязычная система
2. **Файлы промптов синхронизированы** - содержимое одинаковое
3. **Проблема только в способе загрузки** - fetch vs fs.readFileSync
4. **Stable ветка работает** потому что использует `loadJSONPromptV2()`

---

**Автор**: Kiro AI Assistant  
**Дата создания**: 26.09.2025  
**Последнее обновление**: 26.09.2025