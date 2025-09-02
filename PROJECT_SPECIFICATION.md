# 📋 UX Audit Platform - Техническая Спецификация

> **Версия документации**: 1.1.0  
> **Дата обновления**: 2 сентября 2025  
> **Статус**: Активная разработка  

## 🎯 Обзор проекта

**UX Audit Platform** - это веб-приложение для автоматизированного анализа пользовательского опыта с использованием GPT-4, построенное на современном технологическом стеке.

### 🔑 Ключевые возможности:
- ✨ **AI-анализ интерфейсов** через GPT-4 Vision API
- 🔐 **Авторизация** через Supabase (email/password + Google OAuth)
- 📁 **Управление проектами** и организация аудитов
- 📊 **Детальные отчеты** с рекомендациями
- 📸 **Анализ скриншотов** и URL-адресов
- 💾 **Автоматическое сохранение** результатов в базу данных
- 📱 **Адаптивный дизайн** для всех устройств

---

## 🏗️ Архитектура системы

### 📐 **Общая схема:**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   External      │
│   (Next.js)     │◄──►│   (Next.js)     │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
│                      │                      │
├─ React Components   ├─ API Routes          ├─ OpenAI GPT-4
├─ Tailwind CSS      ├─ Server Actions      ├─ Supabase DB
├─ TypeScript        ├─ Middleware          ├─ Supabase Auth
└─ Client State      └─ Error Handling      └─ Supabase Storage
```

### 🎨 **Frontend (Next.js 14 App Router):**

**Структура компонентов:**
```
src/
├── app/                    # App Router страницы
│   ├── page.tsx           # Главная (лендинг)
│   ├── dashboard/         # Быстрый анализ + авторизация
│   ├── projects/          # Управление проектами
│   │   └── [id]/         # Детали проекта
│   ├── audits/           # Просмотр аудитов
│   │   └── [id]/         # Детали аудита
│   └── api/              # API роуты
├── components/            # Переиспользуемые компоненты
│   ├── auth.tsx          # Авторизация
│   ├── layout.tsx        # Общий лэйаут
│   ├── projects.tsx      # Список проектов
│   ├── upload-form.tsx   # Форма загрузки
│   ├── analysis-result.tsx # Отображение результатов
│   ├── action-panel.tsx  # Дополнительные действия
│   └── ui/               # UI компоненты
└── lib/                  # Утилиты и конфигурация
    ├── supabase.ts       # Supabase клиент
    ├── database.ts       # Функции работы с БД
    ├── openai.ts         # OpenAI конфигурация
    └── utils.ts          # Общие утилиты
```

### 🔧 **Backend API (Next.js API Routes):**

**API Endpoints:**
```
/api/
├── research/             # Основной UX анализ
├── collect/              # Сбор требований
├── business/             # Бизнес-анализ
├── ab_test/              # A/B тестирование
├── hypotheses/           # Генерация гипотез
├── debug/                # Диагностика (для разработки)
├── auth-test/            # Тест авторизации
└── health/               # Проверка состояния
```

---

## 🗃️ База данных (Supabase PostgreSQL)

### 📊 **Схема данных:**

#### **Таблица `profiles`** - Профили пользователей
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Таблица `projects`** - Проекты пользователей
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Таблица `audits`** - Аудиты UX
```sql
CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('research', 'collect', 'business', 'ab_test', 'hypotheses')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed')),
  input_data JSONB,           -- Входные данные (URL, параметры)
  result_data JSONB,          -- Результаты анализа
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### **Таблица `audit_history`** - История действий
```sql
CREATE TABLE audit_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,  -- 'research', 'collect', 'business', etc.
  input_data JSONB,           -- Входные параметры действия
  output_data JSONB,          -- Результат действия
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 🔐 **Row Level Security (RLS):**

**Политики безопасности:**
- ✅ Пользователи видят только свои данные
- ✅ Автоматическое создание профиля при регистрации
- ✅ Каскадное удаление связанных записей
- ✅ Защищенный доступ к Storage

---

## 🔌 API Документация

### 🎯 **POST /api/research** - Основной UX анализ

**Описание**: Анализирует интерфейс по URL или скриншоту

**Входные данные:**
```typescript
interface ResearchRequest {
  url?: string;           // URL для анализа
  screenshot?: string;    // Base64 строка изображения
}
```

**Ответ:**
```typescript
interface ResearchResponse {
  result: string;         // Анализ в Markdown формате
}
```

**Процесс обработки:**
1. **Валидация входных данных** (URL или скриншот)
2. **Анализ скриншота** (если есть):
   - Шаг 1: GPT-4 Vision описывает изображение
   - Шаг 2: GPT-4 проводит UX анализ на основе описания
3. **Анализ URL** (если есть): GPT-4 анализирует по описанию
4. **Возврат структурированного результата**

### 🎯 **POST /api/collect** - Сбор требований

**Описание**: Генерирует вопросы для сбора требований на основе первичного анализа

### 🎯 **POST /api/business** - Бизнес анализ

**Описание**: Проводит бизнес-анализ UX решений

### 🎯 **POST /api/ab_test** - A/B тестирование

**Описание**: Предлагает варианты для A/B тестирования

### 🎯 **POST /api/hypotheses** - Генерация гипотез

**Описание**: Создает гипотезы для улучшения UX

**Общий формат запроса для дополнительных действий:**
```typescript
interface ActionRequest {
  context: string;        // Результат предыдущего анализа
}
```

---

## 🔐 Система авторизации

### 🎯 **Провайдеры аутентификации:**

1. **Email/Password** через Supabase Auth
2. **Google OAuth 2.0** через Supabase

### 🔄 **Поток авторизации:**

```
1. Пользователь → /dashboard
2. Проверка сессии
3. Если не авторизован → компонент Auth
4. Выбор провайдера (email или Google)
5. Авторизация через Supabase
6. Автоматическое создание профиля
7. Редирект на интерфейс анализа
```

### 🛡️ **Безопасность:**

- ✅ **JWT токены** с автоматическим обновлением
- ✅ **Row Level Security** в базе данных
- ✅ **HTTPS** для всех соединений
- ✅ **Валидация** всех входных данных
- ✅ **Rate limiting** на API endpoints

---

## 📦 Технологический стек

### 🎨 **Frontend:**
- **React 18** с TypeScript
- **Next.js 14** (App Router)
- **Tailwind CSS** для стилизации
- **Lucide React** для иконок
- **Supabase JS Client** для работы с БД

### ⚡ **Backend:**
- **Next.js API Routes** 
- **OpenAI SDK** (GPT-4, GPT-4 Vision)
- **Supabase SDK** для БД и авторизации

### 🗃️ **База данных:**
- **Supabase** (PostgreSQL)
- **Real-time subscriptions**
- **Storage** для файлов

### 🚀 **Деплой:**
- **Vercel** для фронтенда и API
- **GitHub** для версионирования
- **Supabase** для БД и авторизации

### 📋 **Менеджмент зависимостей:**
```json
{
  "dependencies": {
    "next": "14.2.5",
    "react": "^18",
    "typescript": "^5",
    "@supabase/supabase-js": "^2.45.4",
    "openai": "^4.63.0",
    "tailwindcss": "^3.4.1",
    "lucide-react": "^0.441.0"
  }
}
```

---

## 🚀 Процесс разработки и деплоя

### 🌳 **Git Workflow:**

```
main (production)
├── stable (stable releases)
└── development (active development)
```

### 📈 **Версионирование:**

- **Semantic Versioning**: `v{MAJOR}.{MINOR}.{PATCH}`
- **Теги** для всех релизов
- **Автоматический скрипт** релизов

### 🔄 **CI/CD Pipeline:**

```
1. Push в main → Автоматический деплой на Vercel
2. Создание тега → GitHub Release
3. Обновление stable ветки
4. Тестирование в production
```

---

## 📊 Пользовательские сценарии

### 🎯 **Сценарий 1: Быстрый анализ**

1. Пользователь → `/dashboard`
2. Авторизация (если нужно)
3. Загрузка URL или скриншота
4. Получение анализа
5. Автоматическое сохранение в проект

### 📁 **Сценарий 2: Работа с проектами**

1. Пользователь → `/projects`
2. Создание/выбор проекта
3. Переход в детали проекта
4. Создание нового аудита
5. Проведение анализа
6. Дополнительные действия (collect, business, etc.)
7. Просмотр истории и статистики

### 📋 **Сценарий 3: Просмотр результатов**

1. Выбор аудита из списка
2. Просмотр результатов анализа
3. Экспорт отчета
4. Создание follow-up действий

---

## 🔧 Конфигурация окружения

### 📝 **Переменные окружения (.env.local):**

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 🚀 **Vercel конфигурация (vercel.json):**

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs"
}
```

---

## 🧪 Тестирование и отладка

### 🔍 **Диагностические endpoints:**

- **GET /api/debug** - Проверка переменных окружения
- **GET /api/auth-test** - Тест подключения к Supabase
- **GET /api/health** - Проверка работоспособности

### 📊 **Мониторинг:**

- **Vercel Analytics** для метрик производительности
- **Supabase Dashboard** для мониторинга БД
- **OpenAI Dashboard** для отслеживания использования API

---

## 📋 Ограничения и известные проблемы

### ⚠️ **Текущие ограничения:**

1. **OpenAI API**: Rate limits и стоимость токенов
2. **Supabase**: Лимиты бесплатного плана
3. **Файлы**: Максимальный размер скриншотов 10MB
4. **Языки**: Поддержка только русского языка

### 🐛 **Известные проблемы:**

1. **Кеширование**: Возможны задержки обновления на Vercel
2. **Mobile UX**: Оптимизация для мобильных устройств в разработке
3. **Offline mode**: Отсутствует поддержка офлайн режима

---

## 🎯 Планы развития

### 📈 **Краткосрочные цели (v1.2.0):**

- [ ] **Экспорт отчетов** в PDF/Word
- [ ] **Темная тема** интерфейса
- [ ] **Уведомления** о готовности анализа
- [ ] **Шаблоны проектов** для разных типов

### 🚀 **Долгосрочные цели (v2.0.0):**

- [ ] **Командная работа** (роли и права)
- [ ] **API для интеграций** с внешними системами
- [ ] **Мультиязычность** (EN, ES, DE)
- [ ] **AI-ассистент** для консультаций

---

## 📞 Контакты и поддержка

- **GitHub**: https://github.com/dev-bsvit/uxaudute
- **Production**: https://uxaudute.vercel.app
- **Документация**: Этот файл в корне проекта

---

*Документ обновляется с каждым релизом. Последнее обновление: версия v1.1.0*
