# 📂 Структура проекта UX Audit Platform

> Подробное описание архитектуры, структуры файлов и компонентов платформы для автоматизированного UX-анализа

## 📋 Содержание

- [Обзор проекта](#обзор-проекта)
- [Технологический стек](#технологический-стек)
- [Структура директорий](#структура-директорий)
- [Основные модули](#основные-модули)
- [API Endpoints](#api-endpoints)
- [База данных](#база-данных)
- [Конфигурационные файлы](#конфигурационные-файлы)

---

## 🎯 Обзор проекта

**UX Audit Platform** — это полнофункциональная веб-платформа для автоматизированного анализа пользовательского опыта с использованием GPT-4 Vision API.

- **Версия**: 0.1.0
- **Production**: https://uxaudit.vercel.app
- **Framework**: Next.js 14 (App Router)
- **База данных**: PostgreSQL (Supabase)
- **Деплой**: Vercel

---

## 🔧 Технологический стек

### Frontend
- **Next.js 14.2.5** - React-фреймворк с App Router
- **React 18.2.0** - UI библиотека
- **TypeScript 5.0** - Типизация
- **Tailwind CSS 3.4** - Стилизация
- **Motion 12.23.12** - Анимации

### UI Components
- **Radix UI** - Компоненты интерфейса (Dialog, Dropdown, Tabs, Switch и др.)
- **Lucide React** - Иконки
- **Tabler Icons** - Дополнительные иконки
- **class-variance-authority** - Управление вариантами стилей
- **tailwind-merge** - Объединение Tailwind классов

### Backend & Services
- **Next.js API Routes** - Серверные эндпоинты
- **OpenAI API 4.28.0** - GPT-4 и Vision API для анализа
- **Supabase 2.39.2** - База данных, аутентификация, хранилище
- **Stripe 18.5.0** - Платежная система

### Development
- **TypeScript** - Типизация
- **ESLint** - Линтинг
- **PostCSS & Autoprefixer** - CSS обработка

---

## 📁 Структура директорий

```
ux-audit/
├── .git/                      # Git репозиторий
├── .next/                     # Build директория Next.js
├── .vercel/                   # Конфигурация Vercel
├── .vscode/                   # Настройки VS Code
├── .kiro/                     # Спецификации задач
│   └── specs/
│       ├── prompt-quality-fix/
│       └── multilingual-system/
│
├── public/                    # Статические файлы
│   ├── locales/              # Переводы интерфейса
│   │   ├── en/              # Английский
│   │   └── ru/              # Русский
│   ├── prompts/              # Промпты для AI
│   │   ├── en/
│   │   └── ru/
│   ├── favicon.svg
│   ├── logo.svg
│   └── ux-demo.png
│
├── src/                       # Исходный код
│   ├── app/                  # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── dashboard/       # Панель управления
│   │   ├── projects/        # Управление проектами
│   │   ├── audits/          # Просмотр аудитов
│   │   ├── settings/        # Настройки
│   │   ├── admin/           # Админ панель
│   │   ├── public/          # Публичные страницы
│   │   ├── layout.tsx       # Корневой layout
│   │   ├── page.tsx         # Главная страница
│   │   └── globals.css      # Глобальные стили
│   │
│   ├── components/           # React компоненты
│   │   ├── ui/              # UI компоненты (Radix)
│   │   ├── icons/           # Кастомные иконки
│   │   ├── auth.tsx         # Аутентификация
│   │   ├── language-provider.tsx  # i18n
│   │   ├── analysis-*.tsx   # Компоненты анализа
│   │   └── ...
│   │
│   ├── lib/                  # Утилиты и сервисы
│   │   ├── i18n/            # Интернационализация
│   │   ├── __tests__/       # Тесты
│   │   ├── supabase.ts      # Supabase клиент
│   │   ├── ai-provider.ts   # AI сервисы
│   │   ├── database.ts      # DB утилиты
│   │   ├── credits.ts       # Система кредитов
│   │   ├── json-parser.ts   # Парсинг JSON
│   │   ├── prompt-loader.ts # Загрузка промптов
│   │   └── ...
│   │
│   └── hooks/                # React хуки
│       ├── use-language.ts
│       ├── use-translation.ts
│       └── ...
│
├── database/                  # Database миграции
│   └── migrations/
│
├── migrations/                # SQL миграции
│   ├── add_target_audience_field.sql
│   ├── add_public_sharing.sql
│   ├── fix_rls_policies.sql
│   └── ...
│
├── docs/                      # Документация
├── scripts/                   # Утилиты и скрипты
├── prompts/                   # Промпты для разработки
│
├── node_modules/              # Зависимости
│
├── package.json              # NPM конфигурация
├── tsconfig.json             # TypeScript конфигурация
├── tailwind.config.js        # Tailwind конфигурация
├── next.config.js            # Next.js конфигурация
├── postcss.config.js         # PostCSS конфигурация
├── vercel.json               # Vercel конфигурация
├── .env.local                # Переменные окружения (локально)
├── .gitignore                # Git игнорируемые файлы
│
└── README.md                 # Основная документация
```

---

## 🧩 Основные модули

### 1. **src/app/** - Next.js App Router

#### Страницы приложения:
- **`/`** - Главная страница (лендинг)
- **`/dashboard`** - Панель управления и быстрый анализ
- **`/projects`** - Список проектов
- **`/projects/[id]`** - Детальная страница проекта
- **`/audits/[id]`** - Просмотр результатов аудита
- **`/public/audit/[id]`** - Публичная ссылка на аудит
- **`/settings`** - Настройки пользователя
- **`/admin`** - Административная панель

#### Debug страницы (development):
- **`/test-openai`** - Тестирование OpenAI API
- **`/test-openrouter`** - Тестирование OpenRouter
- **`/debug-audit`** - Отладка аудитов
- **`/force-fix`** - Принудительное исправление

### 2. **src/app/api/** - API Routes

#### Основные API эндпоинты:

##### Анализ UX:
- **`POST /api/research`** - Основной UX анализ (GPT-4 Vision)
- **`POST /api/research-with-credits`** - Анализ с использованием кредитов
- **`POST /api/research-stable`** - Стабильная версия анализа
- **`POST /api/research-experimental`** - Экспериментальная версия

##### Другие типы анализа:
- **`POST /api/collect`** - Сбор требований
- **`POST /api/business`** - Бизнес анализ
- **`POST /api/business-analytics`** - Бизнес аналитика
- **`POST /api/ab-test`** - A/B тестирование
- **`POST /api/hypotheses`** - Генерация гипотез
- **`POST /api/annotations`** - Добавление аннотаций

##### Система кредитов:
- **`GET /api/credits`** - Проверка баланса
- **`POST /api/add-credits`** - Добавление кредитов
- **`POST /api/stripe/*`** - Интеграция со Stripe

##### Управление пользователями:
- **`GET /api/user`** - Информация о пользователе
- **`GET /api/check-user-status`** - Проверка статуса
- **`POST /api/ensure-user-profile`** - Создание профиля

##### Публичные аудиты:
- **`POST /api/audits/[id]/public-link`** - Создание публичной ссылки
- **`GET /api/public/*`** - Публичный доступ к аудитам

##### Утилиты и отладка:
- **`GET /api/health`** - Health check
- **`GET /api/auth-test`** - Тестирование аутентификации
- **`POST /api/debug-*`** - Debug endpoints
- **`POST /api/test-*`** - Тестовые endpoints

### 3. **src/components/** - React компоненты

#### UI компоненты (ui/):
Базовые компоненты на основе Radix UI:
- `button.tsx` - Кнопки
- `dialog.tsx` - Модальные окна
- `dropdown-menu.tsx` - Выпадающие меню
- `input.tsx`, `textarea.tsx` - Поля ввода
- `tabs.tsx` - Вкладки
- `progress.tsx` - Прогресс бары
- `separator.tsx` - Разделители
- `switch.tsx` - Переключатели
- `alert-dialog.tsx` - Диалоги подтверждения

#### Бизнес компоненты:

**Аутентификация:**
- `auth.tsx` - Компонент авторизации
- `error-boundary.tsx` - Обработка ошибок

**Управление проектами:**
- `projects.tsx` - Список проектов
- `upload-form.tsx` - Форма загрузки скриншотов
- `context-form.tsx` - Форма контекста проекта

**Анализ и результаты:**
- `analysis-modal.tsx` - Модальное окно анализа
- `analysis-result.tsx` - Отображение результатов
- `analysis-result-display.tsx` - Детальный вывод анализа
- `ab-test-display.tsx` - Отображение A/B тестов
- `hypotheses-display.tsx` - Отображение гипотез
- `business-analytics-display.tsx` - Бизнес аналитика

**Система кредитов:**
- `CreditsBalance.tsx` - Баланс кредитов
- `CreditsPurchase.tsx` - Покупка кредитов
- `CreditsSidebar.tsx` - Боковая панель кредитов
- `InsufficientCreditsModal.tsx` - Модальное окно недостаточных кредитов
- `StripeCheckout.tsx` - Stripe checkout

**Интернационализация:**
- `language-provider.tsx` - Провайдер языка
- `language-selector.tsx` - Переключатель языка
- `language-auto-initializer.tsx` - Автоинициализация языка
- `language-indicator.tsx` - Индикатор языка
- `translation-preloader.tsx` - Предзагрузка переводов
- `dynamic-html-lang.tsx` - Динамический атрибут lang
- `dynamic-metadata.tsx` - Динамические мета-данные

**UI элементы:**
- `hero-section.tsx` - Hero секция
- `action-panel.tsx` - Панель действий
- `sidebar-demo.tsx` - Демо sidebar
- `macbook-demo.tsx` - MacBook демо

**Debug компоненты:**
- `audit-debug-panel.tsx` - Отладка аудитов
- `debug-analysis-data.tsx` - Отладка данных анализа
- `language-detection-debug.tsx` - Отладка определения языка

### 4. **src/lib/** - Библиотеки и утилиты

#### Основные модули:

**База данных и аутентификация:**
- `supabase.ts` - Клиент Supabase (синглтон для клиента, серверный клиент)
- `database.ts` - Утилиты работы с БД
- `database.types.ts` - TypeScript типы для БД

**AI и анализ:**
- `ai-provider.ts` - Провайдер AI (OpenAI + OpenRouter с fallback)
- `openai.ts` - OpenAI клиент
- `openrouter.ts` - OpenRouter клиент
- `prompt-loader.ts` - Загрузка промптов
- `prompt-validator.ts` - Валидация промптов
- `stable-prompts-loader.ts` - Стабильные промпты
- `json-parser.ts` - Парсинг JSON ответов от AI
- `quality-metrics.ts` - Метрики качества анализа

**Интернационализация (i18n/):**
- Система переводов на английский и русский
- Автоматическое определение языка браузера
- Персистентность выбранного языка
- Fallback на английский при ошибках

**Система кредитов:**
- `credits.ts` - Управление кредитами пользователя

**Языковые функции:**
- `language-manager.ts` - Менеджер языков
- `language-auto-corrector.ts` - Автокоррекция языка
- `language-consistency-middleware.ts` - Консистентность языка
- `analysis-language-tracker.ts` - Отслеживание языка анализа

**Адаптеры данных:**
- `analysis-data-adapter.ts` - Адаптация данных анализа между форматами

**Другое:**
- `stripe.ts` - Stripe интеграция
- `templates.ts` - Шаблоны
- `survey-utils.ts` - Утилиты опросов
- `utils.ts` - Общие утилиты (cn для classnames)

### 5. **src/hooks/** - React хуки

- `use-language.ts` - Хук языка
- `use-translation.ts` - Хук переводов
- `use-translation-safe.ts` - Безопасный хук переводов
- `use-formatters.ts` - Хук форматирования
- `use-i18n-error.ts` - Обработка i18n ошибок
- `use-language-initialization.ts` - Инициализация языка
- `use-language-readiness.ts` - Готовность языковой системы
- `use-browser-language-detection.ts` - Определение языка браузера
- `use-analysis-language.ts` - Язык анализа

---

## 🌐 API Endpoints

### Основные категории:

#### 1. Анализ UX
```
POST /api/research                    - Основной анализ
POST /api/research-with-credits       - С использованием кредитов
POST /api/research-stable             - Стабильная версия
POST /api/research-experimental       - Экспериментальная версия
POST /api/research-with-fallback      - С fallback на другие модели
```

#### 2. Специализированный анализ
```
POST /api/collect                     - Сбор требований
POST /api/business                    - Бизнес анализ
POST /api/business-analytics          - Бизнес аналитика
POST /api/ab-test                     - A/B тестирование
POST /api/ab-test-with-credits        - A/B тест с кредитами
POST /api/hypotheses                  - Генерация гипотез
POST /api/hypotheses-with-credits     - Гипотезы с кредитами
POST /api/annotations                 - Аннотации
```

#### 3. Система кредитов
```
GET  /api/credits                     - Баланс кредитов
POST /api/add-credits                 - Добавить кредиты
GET  /api/check-user-balance          - Проверка баланса
POST /api/stripe/create-checkout      - Stripe checkout
POST /api/stripe/webhook              - Stripe webhook
```

#### 4. Пользователи и аутентификация
```
GET  /api/user                        - Информация о пользователе
GET  /api/check-user-status           - Статус пользователя
POST /api/ensure-user-profile         - Создание профиля
GET  /api/auth-test                   - Тест аутентификации
GET  /api/list-users                  - Список пользователей (admin)
```

#### 5. Публичные аудиты
```
POST /api/audits/[id]/public-link     - Создать публичную ссылку
GET  /api/public/audit/[id]           - Получить публичный аудит
```

#### 6. Утилиты и мониторинг
```
GET  /api/health                      - Health check
GET  /api/debug                       - Debug информация
POST /api/apply-migration             - Применить миграцию
POST /api/emergency-fix               - Экстренное исправление
```

#### 7. Тестирование (development)
```
POST /api/test-openai                 - Тест OpenAI
POST /api/test-openrouter             - Тест OpenRouter
POST /api/test-deepseek               - Тест DeepSeek
POST /api/test-json-parsing           - Тест парсинга JSON
GET  /api/check-audits                - Проверка аудитов
```

---

## 🗄️ База данных

### Структура Supabase:

#### Основные таблицы:

**profiles** - Профили пользователей
```sql
- id (uuid, PK, FK -> auth.users)
- email (text)
- full_name (text)
- avatar_url (text)
- preferred_language (text) - 'en' | 'ru'
- created_at (timestamp)
- updated_at (timestamp)
```

**projects** - Проекты пользователей
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles.id)
- name (text)
- description (text)
- url (text)
- target_audience (text)
- context (text)
- created_at (timestamp)
- updated_at (timestamp)
```

**audits** - Результаты аудитов
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles.id)
- project_id (uuid, FK -> projects.id, nullable)
- screenshot_url (text)
- analysis_type (text) - 'research' | 'business' | 'ab_test' | 'hypotheses'
- analysis_result (jsonb)
- annotations (jsonb)
- is_public (boolean)
- public_token (text, unique)
- language (text) - 'en' | 'ru'
- created_at (timestamp)
- updated_at (timestamp)
```

**credits_balance** - Баланс кредитов
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles.id, unique)
- balance (integer, default 3)
- created_at (timestamp)
- updated_at (timestamp)
```

**credits_transactions** - Транзакции кредитов
```sql
- id (uuid, PK)
- user_id (uuid, FK -> profiles.id)
- amount (integer) - положительное для пополнения, отрицательное для списания
- transaction_type (text) - 'purchase' | 'usage' | 'refund' | 'bonus'
- description (text)
- audit_id (uuid, FK -> audits.id, nullable)
- created_at (timestamp)
```

**audit_history** - История изменений аудитов
```sql
- id (uuid, PK)
- audit_id (uuid, FK -> audits.id)
- action (text)
- changes (jsonb)
- created_at (timestamp)
```

#### Row Level Security (RLS):
Все таблицы защищены RLS политиками:
- Пользователи видят только свои данные
- Публичные аудиты доступны по токену
- Админы имеют расширенные права

#### Триггеры и функции:
- Автоматическое создание профиля при регистрации
- Автоматическое обновление `updated_at`
- Автоматическое создание баланса кредитов
- RPC функции для работы с кредитами

---

## ⚙️ Конфигурационные файлы

### package.json
```json
{
  "name": "ux-audit-mvp-2025",
  "version": "0.1.0",
  "scripts": {
    "dev": "next dev",           // Локальная разработка
    "build": "next build",       // Продакшн билд
    "start": "next start",       // Запуск продакшн сервера
    "lint": "next lint"          // Линтинг кода
  }
}
```

### tsconfig.json
TypeScript конфигурация:
- Target: ES2017
- Strict mode enabled
- Path aliases: `@/*` → `./src/*`
- JSX: preserve (для Next.js)
- Module resolution: bundler

### tailwind.config.js
Tailwind CSS конфигурация:
- Dark mode: class-based
- Content paths: src/{pages,components,app}/**/*.{js,ts,jsx,tsx}
- Кастомные цвета и темы
- Плагины: tailwindcss-animate
- Кастомные шрифты: Geist Sans, Geist Mono

### next.config.js
Next.js конфигурация:
- SVG поддержка: dangerouslyAllowSVG
- Оптимизация пакетов: lucide-react
- Image domains: Supabase storage

### vercel.json
Vercel deployment конфигурация:
- Build settings
- Environment variables
- Redirects и rewrites

### .env.local (локально)
Переменные окружения:
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# OpenRouter (опционально)
OPENROUTER_API_KEY=

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```

---

## 📦 Особенности архитектуры

### 1. **Многоязычность (i18n)**
- Поддержка английского и русского
- Автоопределение языка браузера
- Персистентность выбора в localStorage
- Динамическая загрузка переводов
- Fallback система при ошибках

### 2. **Система кредитов**
- Бесплатные кредиты при регистрации (3 кредита)
- Списание за каждый анализ
- Покупка через Stripe
- История транзакций
- Защита от дублирования

### 3. **AI Provider с Fallback**
- Основной: OpenAI GPT-4
- Альтернативные: OpenRouter (Claude, DeepSeek)
- Автоматическое переключение при ошибках
- Конфигурируемые модели

### 4. **Безопасность**
- Row Level Security (RLS) в Supabase
- Аутентификация через Supabase Auth
- Защищенные API routes
- Валидация на клиенте и сервере

### 5. **Публичные ссылки на аудиты**
- Уникальные токены для каждого аудита
- Контроль приватности пользователем
- Безопасный доступ без авторизации

### 6. **Адаптивный дизайн**
- Mobile-first подход
- Responsive компоненты
- Оптимизация для всех устройств

---

## 📝 Документация проекта

### Основные документы:

- **[README.md](README.md)** - Главная документация
- **[PROJECT_SPECIFICATION.md](PROJECT_SPECIFICATION.md)** - Техническая спецификация
- **[API_REFERENCE.md](API_REFERENCE.md)** - Описание API
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Руководство по деплою
- **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** - Git процессы
- **[QUICKSTART_GUIDE.md](QUICKSTART_GUIDE.md)** - Быстрый старт
- **[CHANGELOG.md](CHANGELOG.md)** - История изменений

### Специализированные документы:

- **[ANNOTATIONS_GUIDE.md](ANNOTATIONS_GUIDE.md)** - Руководство по аннотациям
- **[COMMANDS_CHEATSHEET.md](COMMANDS_CHEATSHEET.md)** - Шпаргалка команд
- **[JSON_API_REFERENCE.md](JSON_API_REFERENCE.md)** - JSON API справка
- **[OPENROUTER_INTEGRATION.md](OPENROUTER_INTEGRATION.md)** - Интеграция OpenRouter
- **[SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md)** - Настройка Supabase Auth
- **[ARCHITECTURE_DIAGRAM.md](ARCHITECTURE_DIAGRAM.md)** - Диаграмма архитектуры
- **[SERVICE_ARCHITECTURE.md](SERVICE_ARCHITECTURE.md)** - Архитектура сервисов
- **[DATABASE_RESTORE_README.md](DATABASE_RESTORE_README.md)** - Восстановление БД
- **[FIXES_SUMMARY.md](FIXES_SUMMARY.md)** - Сводка исправлений

---

## 🚀 Начало работы

### Установка и запуск:

```bash
# 1. Клонирование репозитория
git clone <repository-url>
cd ux-audit

# 2. Установка зависимостей
npm install

# 3. Настройка переменных окружения
cp env.example .env.local
# Заполните .env.local своими ключами

# 4. Запуск в режиме разработки
npm run dev

# 5. Открыть в браузере
# http://localhost:3000
```

### Развертывание на Vercel:

```bash
# 1. Установка Vercel CLI
npm i -g vercel

# 2. Деплой
vercel

# 3. Production деплой
vercel --prod
```

---

## 🔄 Процесс разработки

### Ветки Git:
- **main** - Production (автодеплой на Vercel)
- **stable** - Стабильные релизы
- **development** - Активная разработка
- **feature/** - Новые функции
- **fix/** - Исправления

### Workflow:
1. Создание feature ветки
2. Разработка и тестирование
3. Pull Request в development
4. Code review
5. Merge в development
6. Тестирование
7. Merge в main → Production deploy

---

## 📊 Мониторинг и отладка

### Эндпоинты для мониторинга:
- **GET /api/health** - Проверка работоспособности
- **GET /api/debug** - Debug информация
- **GET /api/auth-test** - Тест аутентификации
- **GET /api/check-audits** - Проверка аудитов

### Development режим:
- Включены debug компоненты
- Логирование в консоль
- Hot reload
- Source maps

---

## 🎯 Следующие шаги

### Планируемые улучшения:
- [ ] Экспорт результатов в PDF
- [ ] Темная тема
- [ ] Командная работа над проектами
- [ ] Публичное API
- [ ] Webhook интеграции
- [ ] Расширенная аналитика
- [ ] Мобильное приложение

---

**Дата создания документа**: 2 октября 2025
**Версия проекта**: 0.1.0
**Автор**: UX Audit Platform Team
