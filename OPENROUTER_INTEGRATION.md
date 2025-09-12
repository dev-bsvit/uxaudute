# 🔄 OpenRouter Integration - Документация изменений

> **Ветка**: `feature/openrouter-integration`  
> **Дата**: $(date)  
> **Статус**: В разработке  
> **Цель**: Добавить OpenRouter как альтернативу OpenAI без нарушения существующего функционала

## 📋 План интеграции

### ✅ **Этап 1: Безопасная подготовка**
- [x] Создана ветка `feature/openrouter-integration`
- [x] Зафиксировано рабочее состояние в main
- [x] Создана документация изменений

### ✅ **Этап 2: Конфигурация (ЗАВЕРШЕН)**
- [x] Добавить переменные окружения для OpenRouter
- [x] Создать отдельный файл конфигурации OpenRouter (`src/lib/openrouter.ts`)
- [x] Добавить функцию выбора провайдера с fallback (`src/lib/ai-provider.ts`)

### ✅ **Этап 3: API интеграция (ЗАВЕРШЕН)**
- [x] Создать тестовый endpoint для OpenRouter (`/api/test-openrouter`)
- [x] Добавить поддержку в существующие endpoints (`/api/research-with-fallback`)
- [x] Реализовать fallback систему

### 🔄 **Этап 4: Тестирование**
- [ ] Протестировать все существующие функции
- [ ] Протестировать новые OpenRouter функции
- [ ] Проверить fallback механизм

### 🔄 **Этап 5: Документация**
- [ ] Обновить env.example
- [ ] Обновить API_REFERENCE.md
- [ ] Создать руководство по использованию

## 🛡️ Принципы безопасности

### **Не нарушать существующий функционал:**
1. **Все изменения в отдельных файлах** или с четкими комментариями
2. **Fallback на OpenAI** если OpenRouter недоступен
3. **Опциональные переменные окружения** - если не заданы, работает как раньше
4. **Тестирование каждого изменения** перед следующим

### **Структура изменений:**
```
src/lib/
├── openai.ts              # Существующий (НЕ ТРОГАЕМ)
├── openrouter.ts          # НОВЫЙ файл для OpenRouter
└── ai-provider.ts         # НОВЫЙ файл для выбора провайдера
```

## 🔧 Переменные окружения

### **Новые переменные (опциональные):**
```bash
# OpenRouter (опционально)
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Приоритет провайдера (по умолчанию: openai)
AI_PROVIDER_PRIORITY=openai,openrouter
```

## 🚀 Новые API Endpoints

### **Тестирование OpenRouter:**
- **GET /api/test-openrouter** - Информация о конфигурации
- **POST /api/test-openrouter** - Тест подключения к OpenRouter

### **Анализ с fallback системой:**
- **POST /api/research-with-fallback** - UX анализ с автоматическим fallback между провайдерами

### **Экспериментальный анализ:**
- **POST /api/research-experimental** - UX анализ с возможностью выбора провайдера и модели

### **Примеры использования:**

#### Тест конфигурации:
```bash
curl -X GET https://uxaudute.vercel.app/api/test-openrouter
```

#### Тест подключения:
```bash
curl -X POST https://uxaudute.vercel.app/api/test-openrouter
```

#### Анализ с fallback:
```bash
curl -X POST https://uxaudute.vercel.app/api/research-with-fallback \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "context": "E-commerce site"}'
```

#### Экспериментальный анализ (OpenAI):
```bash
curl -X POST https://uxaudute.vercel.app/api/research-experimental \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com", 
    "context": "E-commerce site",
    "provider": "openai"
  }'
```

#### Экспериментальный анализ (OpenRouter Sonoma):
```bash
curl -X POST https://uxaudute.vercel.app/api/research-experimental \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com", 
    "context": "E-commerce site",
    "provider": "openrouter",
    "openrouterModel": "sonoma"
  }'
```

#### Тест конкретной модели:
```bash
curl -X POST https://uxaudute.vercel.app/api/test-openrouter \
  -H "Content-Type: application/json" \
  -d '{"model": "sonoma"}'
```

## 📊 Отслеживание проблем

### **Логи изменений:**
- Каждое изменение документируется
- Тестируется перед следующим шагом
- Возможность отката на любой этап

### **Контрольные точки:**
1. ✅ Рабочее состояние зафиксировано
2. 🔄 Создание конфигурации OpenRouter
3. ⏳ Интеграция в API endpoints
4. ⏳ Тестирование
5. ⏳ Документация

## 🚨 Процедура отката

Если что-то пойдет не так:
```bash
# Вернуться к рабочему состоянию
git checkout main
git branch -D feature/openrouter-integration

# Или откатить конкретные изменения
git checkout HEAD~1 -- src/lib/openrouter.ts
```

---
*Документ обновляется при каждом изменении*
