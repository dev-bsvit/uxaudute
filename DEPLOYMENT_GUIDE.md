# 🚀 Deployment Guide - UX Audit Platform

> **Версия**: 1.1.0  
> **Окружения**: Development, Staging, Production  
> **Платформа**: Vercel + Supabase  

## 📋 Предварительные требования

### 🔧 Локальная разработка:
- **Node.js** 18.0.0+
- **npm** 9.0.0+
- **Git** для версионирования

### ☁️ Внешние сервисы:
- **Vercel** аккаунт (для деплоя)
- **Supabase** проект (для БД и авторизации)
- **OpenAI** API ключ (для AI анализа)
- **Google Cloud Console** (для OAuth)

---

## 🏗️ Настройка окружений

### 1️⃣ **Development (Локальная разработка)**

**Клонирование проекта:**
```bash
git clone https://github.com/dev-bsvit/uxaudute.git
cd uxaudute
npm install
```

**Настройка переменных окружения:**
```bash
cp env.example .env.local
```

**Содержимое `.env.local`:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI
OPENAI_API_KEY=sk-...

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Запуск локального сервера:**
```bash
npm run dev
# Открывается на http://localhost:3000
```

---

### 2️⃣ **Supabase Setup**

**Создание проекта:**
1. Перейти на https://supabase.com
2. Создать новый проект
3. Скопировать URL и API ключи

**Настройка базы данных:**
```bash
# Выполнить SQL из database.sql в Supabase SQL Editor
# Это создаст все таблицы, политики RLS и триггеры
```

**Настройка Storage:**
```sql
-- Создание bucket для файлов
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit-uploads', 'audit-uploads', false);
```

**Настройка Authentication:**
1. **Settings** → **Authentication**
2. **Enable Email** provider
3. **Enable Google** provider:
   - Client ID из Google Cloud Console
   - Client Secret из Google Cloud Console
   - Redirect URL: `https://your-project.supabase.co/auth/v1/callback`

---

### 3️⃣ **Google OAuth Setup**

**Google Cloud Console:**
1. Создать проект в https://console.cloud.google.com
2. **APIs & Services** → **Credentials**
3. **Create Credentials** → **OAuth 2.0 Client ID**
4. **Application type**: Web application
5. **Authorized redirect URIs**:
   - `https://your-project.supabase.co/auth/v1/callback`
   - `http://localhost:3000/auth/callback` (для разработки)

**Получение ключей:**
- Client ID: `123456789-xxx.apps.googleusercontent.com`
- Client Secret: `GOCSPX-xxx`

---

### 4️⃣ **Production (Vercel)**

**Подключение GitHub:**
1. Перейти на https://vercel.com
2. **Import Git Repository**
3. Выбрать `github.com/dev-bsvit/uxaudute`

**Настройка переменных окружения в Vercel:**
```bash
# Environment Variables в Vercel Dashboard:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Настройка домена:**
1. **Settings** → **Domains**
2. Добавить кастомный домен (опционально)
3. Обновить redirect URLs в Google Cloud Console и Supabase

---

## 🔄 CI/CD Pipeline

### 📦 **Автоматический деплой:**

**Trigger события:**
- **Push в `main`** → Production deploy
- **Push в `development`** → Preview deploy
- **Pull Request** → Preview deploy

**Процесс деплоя:**
```
1. GitHub webhook → Vercel
2. npm install
3. npm run build
4. Type checking (TypeScript)
5. Deploy в Vercel
6. Health check
```

**Проверка деплоя:**
```bash
# Проверить статус
curl https://your-domain.vercel.app/api/health

# Ожидаемый ответ:
{
  "status": "healthy",
  "version": "1.1.0",
  "timestamp": "2025-09-02T22:30:00Z"
}
```

---

## 🔧 Управление версиями

### 📋 **Создание релиза:**

**Автоматический скрипт:**
```bash
# Патч версия (1.1.0 → 1.1.1)
./scripts/release.sh patch "Исправлены баги"

# Минорная версия (1.1.1 → 1.2.0)  
./scripts/release.sh minor "Новая функция"

# Мажорная версия (1.2.0 → 2.0.0)
./scripts/release.sh major "Крупные изменения"
```

**Ручной релиз:**
```bash
# Создание тега
git tag -a v1.1.1 -m "Версия 1.1.1: Описание изменений"

# Пуш тега
git push origin v1.1.1

# Обновление stable
git checkout stable
git merge main
git push origin stable
```

### 🔄 **Откат версии:**

**Быстрый откат к stable:**
```bash
git checkout main
git reset --hard stable
git push origin main --force
```

**Откат к конкретной версии:**
```bash
git checkout main
git reset --hard v1.1.0
git push origin main --force
```

---

## 🔍 Мониторинг и отладка

### 📊 **Vercel Analytics:**
- **Performance**: Core Web Vitals
- **Usage**: Requests, bandwidth
- **Errors**: 4xx/5xx responses

### 🗃️ **Supabase Dashboard:**
- **Database**: Queries, connections
- **Auth**: Active users, sign-ins
- **Storage**: File uploads, bandwidth

### 🤖 **OpenAI Usage:**
- **Dashboard**: https://platform.openai.com/usage
- **Tokens**: Input/output usage
- **Costs**: Daily spending

### 🔍 **Диагностические endpoints:**

**Проверка переменных:**
```bash
curl https://your-domain.vercel.app/api/debug
```

**Тест авторизации:**
```bash
curl https://your-domain.vercel.app/api/auth-test
```

**Health check:**
```bash
curl https://your-domain.vercel.app/api/health
```

---

## 🚨 Решение проблем

### ❌ **Частые ошибки:**

**1. "Supabase connection failed"**
```bash
# Проверить переменные окружения
curl https://your-domain.vercel.app/api/debug

# Проверить Supabase статус
https://status.supabase.com
```

**2. "OpenAI API error"**
```bash
# Проверить баланс OpenAI
https://platform.openai.com/account/billing

# Проверить лимиты
https://platform.openai.com/account/limits
```

**3. "Google OAuth redirect mismatch"**
```bash
# Проверить redirect URLs в Google Console:
- https://your-domain.vercel.app/auth/callback
- https://your-project.supabase.co/auth/v1/callback
```

**4. "Build failed on Vercel"**
```bash
# Локальная проверка сборки
npm run build

# Проверка типов
npm run type-check
```

### 🔧 **Отладка в продакшене:**

**Логи Vercel:**
1. **Vercel Dashboard** → **Functions**
2. **View Function Logs**
3. Поиск по timestamp

**Supabase логи:**
1. **Supabase Dashboard** → **Logs**
2. **API Logs** или **Database Logs**
3. Фильтрация по времени

---

## 📋 Чеклист деплоя

### ✅ **Pre-deployment:**
- [ ] Локальные тесты проходят
- [ ] `npm run build` успешно
- [ ] Переменные окружения настроены
- [ ] База данных обновлена
- [ ] Google OAuth настроен

### ✅ **Post-deployment:**
- [ ] `/api/health` возвращает 200
- [ ] Авторизация работает
- [ ] Анализ интерфейса работает
- [ ] Сохранение в БД работает
- [ ] Mobile версия работает

### ✅ **Rollback ready:**
- [ ] Stable ветка обновлена
- [ ] Тег версии создан
- [ ] Backup БД создан (если нужно)

---

## 📞 Поддержка

### 🔗 **Полезные ссылки:**
- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs

### 🆘 **В случае проблем:**
1. Проверить **Status Pages** всех сервисов
2. Просмотреть **GitHub Issues**
3. Откатиться к последней рабочей версии
4. Создать issue с подробным описанием

---

*Документ обновляется с каждым релизом. Последнее обновление: версия v1.1.0*
