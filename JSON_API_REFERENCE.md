# 📊 JSON API Reference - UX Audit Platform

## Обзор

Новый JSON-структурированный API для получения структурированных ответов UX анализа вместо текстовых отчетов.

## Endpoints

### POST /api/research-json

Анализ интерфейса с возвратом структурированного JSON ответа.

#### Запрос

```json
{
  "url": "https://example.com",           // URL сайта (опционально)
  "screenshot": "data:image/jpeg;base64...", // Base64 скриншот (опционально)
  "context": "Дополнительный контекст"    // Контекст анализа (опционально)
}
```

#### Успешный ответ

```json
{
  "success": true,
  "data": {
    "screenDescription": {
      "screenType": "Лендинг продукта",
      "userGoal": "Понять ценность продукта и зарегистрироваться",
      "keyElements": [
        "Заголовок с ценностным предложением",
        "Кнопка 'Начать бесплатно'",
        "Форма регистрации",
        "Список преимуществ"
      ],
      "confidence": 85,
      "confidenceReason": "Четкая структура лендинга с явным CTA"
    },
    "uxSurvey": {
      "questions": [
        {
          "id": 1,
          "question": "Какова основная цель этой страницы?",
          "options": [
            "A) Зарегистрироваться/войти в систему",
            "B) Получить информацию о продукте", 
            "C) Совершить покупку/заказ"
          ],
          "scores": [70, 20, 10],
          "confidence": 85
        }
      ],
      "overallConfidence": 82
    },
    "problemsAndSolutions": [
      {
        "element": "Кнопка 'Начать бесплатно'",
        "problem": "Низкая видимость CTA кнопки",
        "principle": "Принцип видимости (Visibility of System Status)",
        "consequence": "Пользователи могут не заметить основной призыв к действию",
        "recommendation": "Увеличить контрастность и размер кнопки",
        "expectedEffect": "Увеличение конверсии на 15-20%",
        "priority": "high"
      }
    ],
    "selfCheck": {
      "checklist": {
        "coversAllElements": true,
        "noContradictions": true,
        "principlesJustified": true,
        "actionClarity": true
      },
      "confidence": {
        "analysis": 85,
        "survey": 82,
        "recommendations": 88
      }
    },
    "metadata": {
      "timestamp": "2024-01-01T12:00:00Z",
      "version": "1.0",
      "model": "gpt-4o"
    }
  },
  "format": "json"
}
```

#### Ошибка парсинга

```json
{
  "success": false,
  "error": "Ошибка парсинга JSON ответа",
  "rawResponse": "Сырой ответ от OpenAI"
}
```

## TypeScript типы

```typescript
import { 
  StructuredAnalysisResponse,
  ScreenDescription,
  UXSurvey,
  ProblemSolution,
  SelfCheck
} from '@/lib/analysis-types'

// Использование
const response: StructuredAnalysisResponse = await fetch('/api/research-json', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
}).then(res => res.json())
```

## Структура данных

### ScreenDescription
- `screenType`: Тип экрана (лендинг, форма, дашборд и т.д.)
- `userGoal`: Предполагаемая цель пользователя
- `keyElements`: Массив ключевых элементов интерфейса
- `confidence`: Уверенность в анализе (0-100)
- `confidenceReason`: Обоснование уверенности

### UXSurvey
- `questions`: Массив вопросов с вариантами ответов
- `overallConfidence`: Общая уверенность в опросе

### ProblemSolution
- `element`: Элемент интерфейса
- `problem`: Описание проблемы
- `principle`: UX принцип, который нарушен
- `consequence`: Возможные последствия
- `recommendation`: Рекомендация по исправлению
- `expectedEffect`: Ожидаемый эффект
- `priority`: Приоритет (high/medium/low)

### SelfCheck
- `checklist`: Чек-лист качества анализа
- `confidence`: Уверенность по блокам

## Преимущества JSON API

1. **Структурированность** - четкая структура данных
2. **Типизация** - TypeScript поддержка
3. **Парсинг** - легко обрабатывать на фронтенде
4. **Валидация** - проверка корректности данных
5. **Расширяемость** - легко добавлять новые поля

## Миграция

### Старый API (текстовый)
```javascript
const response = await fetch('/api/research', {
  method: 'POST',
  body: JSON.stringify({ url: 'https://example.com' })
})
const { result } = await response.json()
// result - это строка с текстовым отчетом
```

### Новый API (JSON)
```javascript
const response = await fetch('/api/research-json', {
  method: 'POST', 
  body: JSON.stringify({ url: 'https://example.com' })
})
const { success, data } = await response.json()
// data - это структурированный объект
```

## Обратная совместимость

Старый API `/api/research` продолжает работать и возвращает текстовые отчеты. Новый API `/api/research-json` возвращает структурированные данные.

## Тестирование

```bash
# Тест с URL
curl -X POST http://localhost:3000/api/research-json \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com"}'

# Тест со скриншотом
curl -X POST http://localhost:3000/api/research-json \
  -H "Content-Type: application/json" \
  -d '{"screenshot": "data:image/jpeg;base64,/9j/4AAQ..."}'
```


