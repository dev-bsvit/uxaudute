# 🏗️ Диаграмма архитектуры UX Audit Platform

## 📊 Схема потока данных

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Пользователь  │    │   Frontend      │    │   Backend API   │
│                 │    │   (Next.js)     │    │   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                        │                        │
         │ 1. Загрузка            │                        │
         │    изображения         │                        │
         ├───────────────────────►│                        │
         │                        │                        │
         │ 2. Создание проекта    │                        │
         │    + контекст          │                        │
         ├───────────────────────►│                        │
         │                        │ 3. createProject()     │
         │                        ├───────────────────────►│
         │                        │                        │
         │                        │ 4. createAudit()       │
         │                        ├───────────────────────►│
         │                        │                        │
         │ 5. AI анализ           │                        │
         ├───────────────────────►│ 6. /api/research-json  │
         │                        ├───────────────────────►│
         │                        │                        │
         │                        │ 7. OpenAI GPT-4o       │
         │                        │◄───────────────────────┤
         │                        │                        │
         │ 8. Сохранение          │                        │
         │    результата          │                        │
         │◄───────────────────────┤ 9. updateAudit()       │
         │                        ├───────────────────────►│
         │                        │                        │
         │ 10. Отображение        │                        │
         │     результата         │                        │
         │◄───────────────────────┤                        │
```

## 🗄️ Структура базы данных

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│    profiles     │    │    projects     │    │     audits      │
│                 │    │                 │    │                 │
│ • id (PK)       │    │ • id (PK)       │    │ • id (PK)       │
│ • email         │◄───┤ • user_id (FK)  │◄───┤ • project_id    │
│ • full_name     │    │ • name          │    │   (FK)          │
│ • avatar_url    │    │ • description   │    │ • user_id (FK)  │
│ • created_at    │    │ • context       │    │ • name          │
│ • updated_at    │    │ • created_at    │    │ • type          │
└─────────────────┘    │ • updated_at    │    │ • status        │
                       └─────────────────┘    │ • input_data    │
                                              │ • result_data   │
                                              │ • context       │
                                              │ • created_at    │
                                              │ • updated_at    │
                                              └─────────────────┘
                                                       │
                                                       ▼
                                              ┌─────────────────┐
                                              │  audit_history  │
                                              │                 │
                                              │ • id (PK)       │
                                              │ • audit_id (FK) │
                                              │ • action_type   │
                                              │ • input_data    │
                                              │ • output_data   │
                                              │ • created_at    │
                                              └─────────────────┘
```

## 🔄 Логика создания аудита

### Быстрый анализ (Dashboard):
```
1. UploadForm (изображение + контекст)
   ↓
2. createProject() → projects table
   ↓
3. createAudit() → audits table
   ↓
4. /api/research-json → OpenAI GPT-4o
   ↓
5. updateAudit() → audits.result_data
   ↓
6. AnalysisResult → отображение
```

### Аудит в проекте:
```
1. UploadForm (изображение + контекст)
   ↓
2. Объединение контекстов:
   project.context + audit.context
   ↓
3. createAudit() → audits table
   ↓
4. /api/research-json → OpenAI GPT-4o
   ↓
5. updateAudit() → audits.result_data
   ↓
6. AnalysisResult → отображение
```

## 🧠 AI Анализ (GPT-4o)

### Входные данные:
```json
{
  "url": "https://example.com",
  "screenshot": "base64_image_data",
  "context": "Объединенный контекст",
  "auditId": "uuid"
}
```

### Процесс:
```
1. Загрузка JSON промпта
   ↓
2. Объединение с контекстом
   ↓
3. Вызов OpenAI GPT-4o
   (response_format: "json_object")
   ↓
4. Валидация результата
   ↓
5. Сохранение в audits.result_data
```

### Структура результата:
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

## 🔐 Безопасность (RLS)

```
┌─────────────────┐
│   Пользователь  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│  Supabase Auth  │
│  (JWT токены)   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   RLS Policies  │
│                 │
│ • profiles:     │
│   user_id = auth.uid()
│                 │
│ • projects:     │
│   user_id = auth.uid()
│                 │
│ • audits:       │
│   user_id = auth.uid()
│                 │
│ • audit_history:│
│   user_id = auth.uid()
└─────────────────┘
```

## 📱 Компоненты Frontend

```
┌─────────────────┐
│   Dashboard     │
│                 │
│ • UploadForm    │
│ • AnalysisResult│
│ • AnalysisModal │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Projects      │
│                 │
│ • ProjectList   │
│ • CreateForm    │
│ • ContextEdit   │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Project Detail│
│                 │
│ • UploadForm    │
│ • AuditList     │
│ • AnalysisResult│
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Audit Detail  │
│                 │
│ • AnalysisResult│
│ • AnalysisResult│
│   Display       │
│ • SurveyDisplay │
└─────────────────┘
```

## 🚀 Развертывание

```
┌─────────────────┐
│   Vercel        │
│                 │
│ • Next.js App   │
│ • API Routes    │
│ • Static Files  │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   Supabase      │
│                 │
│ • PostgreSQL    │
│ • Auth          │
│ • Storage       │
│ • RLS           │
└─────────────────┘
         │
         ▼
┌─────────────────┐
│   OpenAI        │
│                 │
│ • GPT-4o API    │
│ • JSON Response │
└─────────────────┘
```

---

*Диаграмма создана: 10.09.2025*

