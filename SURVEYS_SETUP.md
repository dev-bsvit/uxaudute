# 📋 Настройка функционала AI-опросов

## ✅ Что уже сделано

### 1. Базовая инфраструктура
- ✅ **Банк вопросов** - 120 готовых вопросов по категориям
  - Файл: `src/lib/survey-question-bank.ts`
  - Категории: общие, e-commerce, мобильные приложения, маркетинг, UX-аудит и др.

- ✅ **Типы данных** - Полная типизация TypeScript
  - Файл: `src/types/survey.ts`
  - Survey, SurveyQuestion, SurveyResponse, SurveyAnalytics

- ✅ **База данных**
  - SQL миграция: `supabase/migrations/create_surveys_tables.sql`
  - Таблицы: `surveys`, `survey_responses`
  - RLS политики настроены

- ✅ **Database функции**
  - Файл: `src/lib/database.ts` (строки 565-796)
  - createSurvey, getSurvey, updateSurvey, deleteSurvey
  - publishSurvey, closeSurvey
  - submitSurveyResponse, getSurveyResponses

- ✅ **AI API endpoint**
  - Файл: `src/app/api/survey/generate-questions/route.ts`
  - POST `/api/survey/generate-questions`
  - Генерирует ~20 AI вопросов на основе скриншота
  - Выбирает ~100 релевантных вопросов из банка

### 2. Пользовательский интерфейс
- ✅ **Страница создания опроса**
  - Путь: `/surveys/create`
  - Файл: `src/app/surveys/create/page.tsx`
  - Загрузка скриншота
  - AI генерация вопросов
  - Автоматическое создание опроса

- ✅ **Обновлена Home страница**
  - Добавлена карточка "AI-опросы"
  - Клик переводит на `/surveys/create`

## 🔧 Установка

### Шаг 1: Применить SQL миграцию в Supabase

1. Откройте Supabase Dashboard
2. Перейдите в раздел "SQL Editor"
3. Создайте новый запрос
4. Скопируйте содержимое файла `supabase/migrations/create_surveys_tables.sql`
5. Вставьте и выполните запрос
6. Проверьте, что таблицы `surveys` и `survey_responses` созданы

### Шаг 2: Проверить Storage bucket для скриншотов

Убедитесь, что в Supabase Storage существует bucket `screenshots` (он уже должен быть создан для аудитов).

### Шаг 3: Запустить приложение

```bash
npm run dev
```

Перейдите на `/home` и кликните на карточку "AI-опросы с автоматически созданными релевантными вопросами"

## 🎯 Как это работает

### Процесс создания опроса:

1. **Пользователь загружает скриншот** на странице `/surveys/create`

2. **Система создает опрос** в базе данных (статус: draft)

3. **AI анализирует скриншот** через Vision API (GPT-4o)
   - Создает ~20 специфичных вопросов для данного интерфейса
   - Определяет релевантные вопросы из банка 120 вопросов

4. **Формируются пулы вопросов**:
   - **Основной пул** (~15 вопросов) - показывается в опросе сразу
     - 10 AI вопросов
     - 5 из банка
   - **Дополнительный пул** (~105 вопросов) - скрыт, можно добавить вручную
     - Остальные AI вопросы
     - Остальные вопросы из банка

5. **Пользователь переходит к редактору** (пока не реализовано)
   - Может редактировать вопросы
   - Менять порядок (drag-and-drop)
   - Добавлять/удалять вопросы
   - Переключать между типами ответов

6. **Публикация опроса** (пока не реализовано)
   - Опрос получает публичную ссылку
   - Можно делиться с респондентами

7. **Сбор ответов** (пока не реализовано)
   - Респонденты проходят опрос
   - Ответы сохраняются в `survey_responses`

8. **Аналитика** (пока не реализовано)
   - Статистика по ответам
   - Графики и визуализации
   - Экспорт данных

## 📊 Структура данных

### Survey (Опрос)
```typescript
{
  id: string
  name: string
  description?: string
  screenshot_url?: string
  status: 'draft' | 'published' | 'closed'

  // Вопросы
  ai_questions: SurveyQuestionInstance[]           // ~20 вопросов от AI
  selected_bank_questions: SurveyQuestionInstance[] // ~100 из банка
  main_questions: SurveyQuestionInstance[]          // Показываются в опросе
  additional_questions: SurveyQuestionInstance[]    // Дополнительный пул

  // Статистика
  responses_count: number
  avg_completion_time?: number

  created_at: string
  updated_at: string
  published_at?: string
}
```

### SurveyQuestionInstance (Вопрос в опросе)
```typescript
{
  id: string                    // ID из банка или ai-gen-xxx
  instance_id: string           // Уникальный ID для drag-and-drop
  text_ru: string
  text_en: string
  type: 'yes-no' | 'text' | 'rating' | 'scale'
  category: string
  tags: string[]

  order: number                 // Порядок в опросе
  required: boolean
  is_custom: boolean            // Добавлен пользователем
  pool: 'main' | 'additional'
}
```

## 🚧 Что еще нужно сделать

### Высокий приоритет:
1. **Страница редактирования опроса** (`/surveys/[id]`)
   - Компонент SurveyEditor с drag-and-drop
   - Редактирование текста вопросов
   - Переключение типов ответов
   - Управление пулами (основной/дополнительный)

2. **Публичная страница опроса** (`/public/survey/[id]`)
   - Прохождение опроса
   - Сохранение ответов
   - Прогресс-бар
   - Страница благодарности

3. **Страница аналитики** (`/surveys/[id]/analytics`)
   - Количество ответов
   - Среднее время прохождения
   - Статистика по вопросам
   - Графики и диаграммы

### Средний приоритет:
4. **Список опросов пользователя** (`/surveys`)
   - Карточки опросов
   - Фильтрация (draft/published/closed)
   - Быстрые действия (редактировать, поделиться, удалить)

5. **Настройки опроса**
   - Язык (ru/en)
   - Показывать прогресс
   - Разрешить анонимные ответы
   - Требовать email
   - Автозакрытие после N ответов

### Низкий приоритет:
6. **Экспорт данных**
   - CSV/Excel
   - PDF отчет

7. **Интеграция с проектами**
   - Привязка опросов к проектам
   - Отображение опросов в проекте

## 💡 Примеры использования

### Создание опроса программно:
```typescript
import { createSurvey, updateSurvey } from '@/lib/database'

// Создать опрос
const survey = await createSurvey('Опрос пользователей мобильного приложения')

// Сгенерировать вопросы
const response = await fetch('/api/survey/generate-questions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    screenshotUrl: 'https://...',
    language: 'ru'
  })
})

const questions = await response.json()

// Сохранить вопросы
await updateSurvey(survey.id, {
  ai_questions: questions.ai_questions,
  main_questions: questions.main_questions,
  additional_questions: questions.additional_questions
})
```

### Публикация опроса:
```typescript
import { publishSurvey } from '@/lib/database'

await publishSurvey(surveyId)
// Опрос становится доступен по ссылке /public/survey/[id]
```

### Сохранение ответа:
```typescript
import { submitSurveyResponse } from '@/lib/database'

await submitSurveyResponse({
  survey_id: surveyId,
  answers: [
    {
      question_id: 'gen-1',
      question_text: 'Как часто вы используете наш продукт?',
      question_type: 'scale',
      answer_scale: 4
    }
  ],
  started_at: startTime,
  completed_at: new Date().toISOString(),
  completion_time_seconds: 120
})
```

## 🔐 Безопасность

- ✅ RLS (Row Level Security) включен
- ✅ Пользователи видят только свои опросы
- ✅ Публичный доступ только к опубликованным опросам
- ✅ Анонимные ответы поддерживаются

## 📝 Примечания

- Банк вопросов можно дополнять в `src/lib/survey-question-bank.ts`
- AI модель использует GPT-4o для анализа изображений
- Система автоматически считает статистику (responses_count, avg_completion_time)
- Все тексты поддерживают русский и английский языки

---

Создано с помощью Claude Code 🤖
