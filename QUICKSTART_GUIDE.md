# 🚀 UX Audit Platform - Быстрый старт

> **Для нового чата с AI-ассистентом**  
> **Дата создания**: 4 сентября 2025  
> **Статус проекта**: Готов к работе

## 📋 Краткая справка

**UX Audit Platform** - полнофункциональная платформа для автоматизированного анализа пользовательского опыта с использованием GPT-4.

### 🌐 **Доступы:**
- **Production**: https://uxaudute.vercel.app
- **GitHub**: https://github.com/dev-bsvit/uxaudute
- **Локальная папка**: `/Users/bsvit/Documents/Мои разроботки/UX_AUDIT/ux-audit`

### ✅ **Что уже настроено:**
- ✅ Supabase база данных (подключена)
- ✅ OpenAI API (настроен)
- ✅ Vercel деплой (автоматический)
- ✅ Git репозиторий (синхронизирован)
- ✅ Все зависимости установлены

---

## 🎯 Команды для быстрого старта

### 1. **Переход в проект:**
```bash
cd "/Users/bsvit/Documents/Мои разроботки/UX_AUDIT/ux-audit"
```

### 2. **Проверка статуса:**
```bash
git status
git remote -v
```

### 3. **Запуск локально (если нужно):**
```bash
npm run dev
# Остановка: Ctrl+C или pkill -f "next dev"
```

### 4. **Проверка API (если запущено локально):**
```bash
curl -s http://localhost:3000/api/health
curl -s http://localhost:3000/api/debug
```

### 5. **Git операции:**
```bash
# Просмотр изменений
git diff

# Коммит и пуш
git add .
git commit -m "📝 Описание изменений"
git push origin main
```

---

## 🏗️ Архитектура проекта

### **Структура:**
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Главная страница
│   ├── dashboard/         # Быстрый анализ
│   ├── projects/          # Управление проектами
│   ├── audits/            # Просмотр результатов
│   └── api/               # API endpoints
├── components/            # React компоненты
│   ├── layout.tsx         # Навигация (БЕЗ кнопки "Главная")
│   ├── auth.tsx           # Авторизация
│   └── ui/                # UI компоненты
└── lib/                   # Утилиты
    ├── supabase.ts        # Supabase клиент
    ├── openai.ts          # OpenAI конфигурация
    └── database.ts        # Функции БД
```

### **API Endpoints:**
- `POST /api/research` - Основной UX анализ
- `POST /api/collect` - Сбор требований
- `POST /api/business` - Бизнес анализ
- `POST /api/ab_test` - A/B тестирование
- `POST /api/hypotheses` - Генерация гипотез
- `GET /api/health` - Проверка состояния
- `GET /api/debug` - Диагностика

---

## 🔧 Конфигурация

### **Переменные окружения (.env.local):**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zdgscvlfclqqtqshjcgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### **Git ветки:**
- `main` - Production (автодеплой на Vercel) - **ТОЛЬКО ПО ЗАПРОСУ**
- `stable` - Стабильные релизы
- `development` - Активная разработка - **РАБОЧАЯ ВЕТКА ПО УМОЛЧАНИЮ**

---

## 📊 Текущее состояние

### **Последние изменения:**
- ✅ Убрана кнопка "Главная" из навигации
- ✅ Оставлен только логотип для перехода на главную
- ✅ Все изменения запушены в GitHub
- ✅ Vercel автоматически обновил продакшен

### **Навигация:**
- **Логотип "🎯 UX Audit"** → Главная страница
- **"Быстрый анализ"** → /dashboard
- **"Мои проекты"** → /projects

---

## 🚀 Типичные задачи

### **Добавить новую функцию:**
1. Создать/изменить компоненты в `src/components/`
2. Добавить API endpoint в `src/app/api/`
3. Обновить навигацию в `src/components/layout.tsx`
4. Протестировать локально
5. Закоммитить и запушить

### **Исправить баг:**
1. Найти проблему в коде
2. Исправить
3. Протестировать
4. Закоммитить с описанием исправления

### **Обновить стили:**
1. Изменить Tailwind классы в компонентах
2. Проверить адаптивность
3. Закоммитить изменения

---

## 📚 Дополнительная документация

- **[PROJECT_SPECIFICATION.md](PROJECT_SPECIFICATION.md)** - Полная техническая спецификация
- **[API_REFERENCE.md](API_REFERENCE.md)** - Документация API
- **[DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)** - Руководство по деплою
- **[GIT_WORKFLOW.md](GIT_WORKFLOW.md)** - Система версионирования

---

## ⚡ Быстрые команды для AI-ассистента

**Для начала работы в новом чате просто скажите:**
> "Настройся на проект UX Audit Platform. Используй QUICKSTART_GUIDE.md для быстрого старта."

**Или выполните:**
```bash
cd "/Users/bsvit/Documents/Мои разроботки/UX_AUDIT/ux-audit" && git status
```

### **🎯 Предустановка работы:**
- **По умолчанию**: Работаю с веткой `development`
- **Деплой**: В development (https://uxaudute-git-development-bsvits-projects.vercel.app/)
- **Production**: Только по вашей просьбе переношу в `main`
- **Команды**: `git checkout development` → изменения → `git push origin development`

---

*Документ обновляется при каждом значительном изменении проекта*
