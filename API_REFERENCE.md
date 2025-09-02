# 🔌 API Reference - UX Audit Platform

> **Версия API**: 1.1.0  
> **Базовый URL**: `https://uxaudute.vercel.app/api`  
> **Авторизация**: Supabase JWT Token  

## 📋 Общая информация

### 🔐 Авторизация
Все API endpoints требуют авторизации через Supabase JWT токен в заголовке:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### 📝 Формат ответов
```typescript
// Успешный ответ
{
  "result": string,
  "timestamp": string
}

// Ошибка
{
  "error": string,
  "timestamp": string
}
```

---

## 🎯 Основные endpoints

### **POST /api/research**
**Описание**: Основной UX анализ интерфейса

**Тело запроса**:
```json
{
  "url": "https://example.com",           // Опционально
  "screenshot": "data:image/png;base64,..." // Опционально
}
```

**Ответ**:
```json
{
  "result": "# UX Анализ интерфейса\n\n## Описание интерфейса\n...",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

**Процесс обработки**:
1. Валидация входных данных
2. Если есть скриншот: GPT-4 Vision анализ
3. Если есть URL: Текстовый анализ GPT-4
4. Возврат структурированного результата

---

### **POST /api/collect**
**Описание**: Генерация вопросов для сбора требований

**Тело запроса**:
```json
{
  "context": "Результат предыдущего UX анализа..."
}
```

**Ответ**:
```json
{
  "result": "# Вопросы для сбора требований\n\n1. Кто ваша целевая аудитория?...",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

### **POST /api/business**
**Описание**: Бизнес-анализ UX решений

**Тело запроса**:
```json
{
  "context": "Результат предыдущего UX анализа..."
}
```

**Ответ**:
```json
{
  "result": "# Бизнес-анализ\n\n## Влияние на конверсию\n...",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

### **POST /api/ab_test**
**Описание**: Предложения для A/B тестирования

**Тело запроса**:
```json
{
  "context": "Результат предыдущего UX анализа..."
}
```

**Ответ**:
```json
{
  "result": "# A/B тестирование\n\n## Варианты для тестирования\n...",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

### **POST /api/hypotheses**
**Описание**: Генерация гипотез для улучшения UX

**Тело запроса**:
```json
{
  "context": "Результат предыдущего UX анализа..."
}
```

**Ответ**:
```json
{
  "result": "# Гипотезы для улучшения\n\n## Гипотеза 1\n...",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

## 🔍 Диагностические endpoints

### **GET /api/debug**
**Описание**: Проверка переменных окружения

**Ответ**:
```json
{
  "env": {
    "supabaseUrl": "PRESENT",
    "supabaseKey": "PRESENT", 
    "openaiKey": "PRESENT",
    "appUrl": "https://uxaudute.vercel.app"
  },
  "timestamp": "2025-09-02T22:30:00Z"
}
```

### **GET /api/auth-test**
**Описание**: Тест подключения к Supabase

**Ответ**:
```json
{
  "success": true,
  "hasSession": false,
  "timestamp": "2025-09-02T22:30:00Z"
}
```

### **GET /api/health**
**Описание**: Проверка работоспособности API

**Ответ**:
```json
{
  "status": "healthy",
  "version": "1.1.0",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

## 📊 Коды ошибок

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 400 | Неверные входные данные |
| 401 | Не авторизован |
| 403 | Нет доступа |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

---

## 🚦 Rate Limiting

- **Основные endpoints**: 10 запросов в минуту на пользователя
- **Диагностические**: 60 запросов в минуту
- **При превышении**: HTTP 429 + заголовок `Retry-After`

---

## 💡 Примеры использования

### JavaScript/TypeScript
```javascript
// Анализ скриншота
const response = await fetch('/api/research', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
});

const data = await response.json();
console.log(data.result);
```

### cURL
```bash
# Анализ URL
curl -X POST https://uxaudute.vercel.app/api/research \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"url": "https://example.com"}'
```

---

## 🔄 Версионирование

API использует семантическое версионирование:
- **Мажорные изменения**: Несовместимые изменения API
- **Минорные**: Новые endpoint'ы, обратно совместимые
- **Патчи**: Исправления багов

Текущая версия указана в `package.json` и доступна через `/api/health`.

---

## 📞 Поддержка

- **GitHub Issues**: https://github.com/dev-bsvit/uxaudute/issues
- **Документация**: `PROJECT_SPECIFICATION.md`
- **Status Page**: https://uxaudute.vercel.app/api/health
