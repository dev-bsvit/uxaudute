# 🧪 Тестирование OpenRouter интеграции

> **Ветка**: `feature/openrouter-integration`  
> **Статус**: Готово к тестированию

## 🚀 Быстрый тест на продакшене

### 1. **Продакшен URL:**
```
https://uxaudute.vercel.app
```

### 2. **Тест конфигурации OpenRouter:**
```bash
curl -X GET https://uxaudute.vercel.app/api/test-openrouter
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "message": "OpenRouter тест endpoint",
  "openrouter": {
    "available": false,
    "baseURL": "https://openrouter.ai/api/v1",
    "model": "anthropic/claude-3.5-sonnet",
    "hasApiKey": false
  },
  "providers": {
    "priority": ["openai", "openrouter"],
    "openai": { "available": true, "model": "gpt-4o" },
    "openrouter": { "available": false, "model": "anthropic/claude-3.5-sonnet" }
  }
}
```

### 3. **Тест подключения (без API ключа):**
```bash
curl -X POST https://uxaudute.vercel.app/api/test-openrouter
```

**Ожидаемый результат:**
```json
{
  "success": true,
  "message": "Тестирование провайдеров завершено",
  "openrouter": {
    "success": false,
    "message": "OpenRouter не настроен (отсутствует API ключ)"
  },
  "allProviders": {
    "openai": {
      "available": true,
      "working": true,
      "message": "OpenAI работает",
      "model": "gpt-4o"
    },
    "openrouter": {
      "available": false,
      "working": false,
      "message": "OpenRouter не настроен"
    }
  }
}
```

## 🔧 Настройка OpenRouter для полного тестирования

### 1. **Получить API ключ OpenRouter:**
- Зайти на https://openrouter.ai/
- Зарегистрироваться и получить API ключ

### 2. **Добавить в .env.local:**
```bash
# OpenRouter
OPENROUTER_API_KEY=your_actual_openrouter_api_key
OPENROUTER_MODEL=anthropic/claude-3.5-sonnet

# Приоритет (можно изменить порядок)
AI_PROVIDER_PRIORITY=openrouter,openai
```

### 3. **Деплой на Vercel:**
```bash
git push origin feature/openrouter-integration
# Vercel автоматически задеплоит изменения
```

### 4. **Повторить тесты на продакшене:**
```bash
# Тест конфигурации
curl -X GET https://uxaudute.vercel.app/api/test-openrouter

# Тест подключения
curl -X POST https://uxaudute.vercel.app/api/test-openrouter
```

## 🎯 Тест экспериментального режима

### **Тест анализа через OpenAI (основной):**
```bash
curl -X POST https://uxaudute.vercel.app/api/research-experimental \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "context": "E-commerce website",
    "provider": "openai"
  }'
```

**Ожидаемый результат:**
```json
{
  "result": "UX анализ сайта...",
  "provider": "openai",
  "model": "gpt-4o",
  "usage": { "prompt_tokens": 150, "completion_tokens": 500, "total_tokens": 650 },
  "experimental": true
}
```

### **Тест анализа через OpenRouter Sonoma (экспериментальный):**
```bash
curl -X POST https://uxaudute.vercel.app/api/research-experimental \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "context": "E-commerce website",
    "provider": "openrouter",
    "openrouterModel": "sonoma"
  }'
```

**Ожидаемый результат:**
```json
{
  "result": "UX анализ сайта...",
  "provider": "openrouter",
  "model": "openrouter/sonoma-sky-alpha",
  "usage": { "prompt_tokens": 150, "completion_tokens": 500, "total_tokens": 650 },
  "experimental": true
}
```

### **Тест fallback системы:**
```bash
curl -X POST https://uxaudute.vercel.app/api/research-with-fallback \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "context": "E-commerce website"
  }'
```

## 🔍 Проверка безопасности

### **Существующий функционал должен работать:**
```bash
# Оригинальный endpoint должен работать как раньше
curl -X POST https://uxaudute.vercel.app/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "context": "E-commerce website"
  }'
```

### **Все остальные endpoints:**
- `https://uxaudute.vercel.app/api/health` - должен работать
- `https://uxaudute.vercel.app/api/debug` - должен работать
- `https://uxaudute.vercel.app/api/collect` - должен работать
- `https://uxaudute.vercel.app/api/business` - должен работать

## 🚨 Что проверить

### ✅ **Без OpenRouter API ключа:**
- [ ] OpenRouter показывает `available: false`
- [ ] Все запросы идут через OpenAI
- [ ] Никаких ошибок в консоли
- [ ] Существующий функционал работает

### ✅ **С OpenRouter API ключом:**
- [ ] OpenRouter показывает `available: true`
- [ ] Тест подключения проходит успешно
- [ ] Fallback система работает
- [ ] Можно переключать приоритет провайдеров

### ✅ **Fallback система:**
- [ ] При ошибке OpenRouter автоматически переключается на OpenAI
- [ ] В логах видно переключение провайдеров
- [ ] Пользователь получает результат независимо от проблем провайдера

## 📊 Мониторинг

### **Логи в консоли:**
```
✅ Успешно использован провайдер: openrouter
❌ Ошибка провайдера openrouter: ...
Переключаемся на следующий провайдер...
✅ Успешно использован провайдер: openai
```

### **Метрики в ответах:**
- `provider` - какой провайдер был использован
- `model` - какая модель была использована
- `usage` - статистика использования токенов

---
*Инструкция обновляется по мере тестирования*
