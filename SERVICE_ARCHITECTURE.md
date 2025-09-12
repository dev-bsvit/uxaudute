# 🏗️ UX Audit Platform - Архитектура и логика работы

## 📋 Обзор системы

UX Audit Platform - это веб-приложение для анализа пользовательского опыта с использованием ИИ (GPT-4). Платформа позволяет загружать скриншоты интерфейсов и получать детальный UX-анализ.

## 🛠️ Технологический стек

- **Frontend**: Next.js 14.2.5 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **База данных**: Supabase (PostgreSQL)
- **Аутентификация**: Supabase Auth
- **ИИ**: OpenAI GPT-4o
- **Хранилище**: Supabase Storage
- **UI компоненты**: shadcn/ui

## 🗄️ Структура базы данных

### Основные таблицы:

#### 1. `profiles` - Профили пользователей
```sql
- id (uuid, PK)
- email (text)
- full_name (text, nullable)
- avatar_url (text, nullable)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `projects` - Проекты пользователей
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles.id)
- name (text)
- description (text, nullable)
- context (text, nullable) -- Контекст проекта для всех аудитов
- created_at (timestamp)
- updated_at (timestamp)
```

#### 3. `audits` - Аудиты UX
```sql
- id (uuid, PK)
- project_id (uuid, FK -> projects.id)
- user_id (uuid, FK -> profiles.id)
- name (text)
- type (text) -- 'research'
- status (text) -- 'in_progress', 'completed', 'failed'
- input_data (jsonb) -- Данные входа (URL, скриншот)
- result_data (jsonb) -- Результат анализа ИИ
- context (text, nullable) -- Контекст конкретного аудита
- created_at (timestamp)
- updated_at (timestamp)
```

#### 4. `audit_history` - История действий
```sql
- id (uuid, PK)
- audit_id (uuid, FK -> audits.id)
- action_type (text) -- 'research', 'ab_test', etc.
- input_data (jsonb)
- output_data (jsonb)
- created_at (timestamp)
```

## 🔄 Логика работы системы

### 1. Создание проекта
```
Пользователь → Форма создания проекта → createProject() → projects table
```

**Поля формы:**
- Название проекта
- Описание (опционально)
- Контекст проекта (опционально) - применяется ко всем аудитам

### 2. Создание аудита

#### 2.1 Быстрый анализ (Dashboard)
```
1. Загрузка изображения/URL + контекст → UploadForm
2. Создание временного проекта → createProject()
3. Создание аудита → createAudit()
4. AI анализ → /api/research-json
5. Сохранение результата → audits.result_data
6. Отображение результата → AnalysisResult
```

#### 2.2 Аудит в проекте
```
1. Загрузка изображения/URL + контекст → UploadForm
2. Объединение контекстов: project.context + audit.context
3. Создание аудита → createAudit()
4. AI анализ → /api/research-json
5. Сохранение результата → audits.result_data
6. Отображение результата → AnalysisResult
```

### 3. AI Анализ (API: /api/research-json)

#### Входные данные:
```json
{
  "url": "https://example.com",
  "screenshot": "base64_image_data",
  "context": "Объединенный контекст проекта + аудита",
  "auditId": "uuid"
}
```

#### Процесс анализа:
1. **Загрузка промпта** - JSON-структурированный промпт из файла
2. **Объединение с контекстом** - добавление пользовательского контекста
3. **Вызов OpenAI GPT-4o** - анализ с response_format: "json_object"
4. **Валидация результата** - проверка структуры ответа
5. **Сохранение результата** - обновление audits.result_data

#### Структура результата:
```json
{
  "uxSurvey": {
    "questions": [...],
    "overallConfidence": 85
  },
  "audience": {
    "primary": "Молодые люди 18-35 лет",
    "secondary": "Средний класс"
  },
  "behavior": {
    "patterns": [...],
    "painPoints": [...]
  },
  "problems": [
    {
      "title": "Проблема",
      "description": "Описание",
      "severity": "high",
      "recommendations": [...]
    }
  ]
}
```

### 4. Отображение результатов

#### Компонент AnalysisResult:
- **Проверка типа** - JSON объект или текст
- **JSON результат** → AnalysisResultDisplay
- **Текстовый результат** → Парсинг и отображение

#### Компонент AnalysisResultDisplay:
- **UX-опрос** - SurveyDisplay
- **Аудитория** - Card с описанием
- **Поведение** - Card с паттернами
- **Проблемы и решения** - Список проблем с рекомендациями

## 🔐 Безопасность

### Row Level Security (RLS):
- **profiles** - пользователи видят только свои профили
- **projects** - пользователи видят только свои проекты
- **audits** - пользователи видят только свои аудиты
- **audit_history** - пользователи видят только историю своих аудитов

### Аутентификация:
- Supabase Auth с JWT токенами
- Автоматическое создание профиля при первом входе
- Проверка аутентификации на всех защищенных маршрутах

## 📁 Структура файлов

```
src/
├── app/
│   ├── api/
│   │   └── research-json/route.ts    # AI анализ
│   ├── audit/[id]/page.tsx          # Страница аудита
│   ├── dashboard/page.tsx            # Dashboard
│   ├── projects/[id]/page.tsx       # Страница проекта
│   └── layout.tsx                    # Общий layout
├── components/
│   ├── analysis-result.tsx           # Отображение результатов
│   ├── analysis-result-display.tsx   # JSON результаты
│   ├── upload-form.tsx               # Форма загрузки
│   ├── projects.tsx                  # Список проектов
│   └── ui/                           # UI компоненты
├── lib/
│   ├── database.ts                   # Функции БД
│   ├── database.types.ts             # Типы TypeScript
│   ├── supabase.ts                   # Конфигурация Supabase
│   └── analysis-types.ts             # Типы анализа
└── styles/
    └── globals.css                   # Глобальные стили
```

## 🚀 Развертывание

### Переменные окружения:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

### Команды:
```bash
npm install
npm run build
npm start
```

## 🔧 Основные функции

### database.ts:
- `createProject()` - создание проекта
- `createAudit()` - создание аудита
- `getAudit()` - получение аудита
- `updateProjectContext()` - обновление контекста проекта
- `uploadScreenshotFromBase64()` - загрузка скриншота

### API Endpoints:
- `POST /api/research-json` - AI анализ интерфейса

## 📊 Мониторинг и логирование

### Логирование:
- Консольные логи для отладки
- Детальное логирование API запросов
- Логирование ошибок сохранения

### Статусы аудитов:
- `in_progress` - анализ в процессе
- `completed` - анализ завершен
- `failed` - ошибка анализа

## 🎯 Ключевые особенности

1. **Контекстная аналитика** - контекст проекта + контекст аудита
2. **Структурированные результаты** - JSON формат для точного анализа
3. **Валидация данных** - проверка структуры ответов ИИ
4. **Безопасность** - RLS для изоляции данных пользователей
5. **Масштабируемость** - модульная архитектура

## 🐛 Известные проблемы и решения

### Проблема: Результаты не отображаются
**Решение:** Упрощено сохранение - только в таблицу `audits`

### Проблема: Множественные GoTrueClient
**Решение:** Используется единый экземпляр Supabase клиента

### Проблема: Ошибки RLS
**Решение:** Правильно настроены политики безопасности

---

*Документация обновлена: 10.09.2025*





