# 🎯 UX Audit Platform

> **Профессиональная платформа для автоматизированного анализа пользовательского опыта с использованием GPT-4**

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://uxaudute.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-green)](https://supabase.com/)

## ✨ Возможности

- 🤖 **AI-анализ интерфейсов** через GPT-4 Vision API
- 🔐 **Авторизация** через Supabase (email/password + Google OAuth)
- 📁 **Управление проектами** и организация аудитов  
- 📊 **Детальные отчеты** с рекомендациями на основе эвристик Нильсена
- 📸 **Анализ скриншотов** и URL-адресов
- 💾 **Автоматическое сохранение** результатов в базу данных
- 📱 **Адаптивный дизайн** для всех устройств

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонирование
git clone https://github.com/dev-bsvit/uxaudute.git
cd uxaudute

# Установка зависимостей
npm install

# Настройка переменных окружения
cp env.example .env.local
# Заполните .env.local своими ключами

# Запуск
npm run dev
```

**Live Demo**: https://uxaudute.vercel.app

## 📚 Документация

### 📋 **Основные документы:**
- **[📄 Техническая спецификация](PROJECT_SPECIFICATION.md)** - Полное описание проекта, архитектуры и функций
- **[🔌 API Reference](API_REFERENCE.md)** - Документация всех API endpoints
- **[🚀 Deployment Guide](DEPLOYMENT_GUIDE.md)** - Руководство по развертыванию и настройке
- **[🌳 Git Workflow](GIT_WORKFLOW.md)** - Система версионирования и рабочий процесс

### 🗃️ **База данных:**
- **[📊 Database Schema](database.sql)** - SQL схема для Supabase
- **[🔐 Auth Setup](SUPABASE_AUTH_SETUP.md)** - Настройка Google OAuth

### 🔧 **Скрипты:**
- **[📦 Release Script](scripts/release.sh)** - Автоматическое создание релизов

## 🏗️ Архитектура

```
Frontend (Next.js) ←→ API Routes ←→ External Services
     ↓                    ↓              ↓
 React Components    OpenAI GPT-4    Supabase
 Tailwind CSS       Vision API      (DB + Auth + Storage)
 TypeScript         Text Analysis   Row Level Security
```

## 🎯 Основные страницы

- **`/`** - Лендинг и обзор возможностей
- **`/dashboard`** - Быстрый анализ + авторизация
- **`/projects`** - Управление проектами
- **`/projects/[id]`** - Детали проекта и аудиты
- **`/audits/[id]`** - Просмотр результатов анализа

## 🔌 API Endpoints

- **`POST /api/research`** - Основной UX анализ
- **`POST /api/collect`** - Сбор требований  
- **`POST /api/business`** - Бизнес анализ
- **`POST /api/ab_test`** - A/B тестирование
- **`POST /api/hypotheses`** - Генерация гипотез

*Полная документация API: [API_REFERENCE.md](API_REFERENCE.md)*

## 🗃️ База данных

**Основные таблицы:**
- `profiles` - Профили пользователей
- `projects` - Проекты UX исследований
- `audits` - Результаты анализа
- `audit_history` - История действий

*Полная схема: [database.sql](database.sql)*

## 🌳 Система версионирования

**Ветки:**
- `main` - Production (автодеплой на Vercel)
- `stable` - Стабильные релизы для отката
- `development` - Активная разработка

**Создание релиза:**
```bash
./scripts/release.sh minor "Описание изменений"
```

*Подробнее: [GIT_WORKFLOW.md](GIT_WORKFLOW.md)*

## 🚀 Деплой

**Автоматический:**
- Push в `main` → Production deploy на Vercel
- Все переменные окружения настроены в Vercel Dashboard

**Ручной:**
```bash
npm run build  # Локальная проверка
git push origin main  # Деплой
```

*Полное руководство: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)*

## 🔧 Технологический стек

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, OpenAI API, Supabase SDK
- **Database**: PostgreSQL (Supabase) + Row Level Security
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Storage**: Supabase Storage (для скриншотов)
- **Deploy**: Vercel (Production) + GitHub (Code)

## 📊 Мониторинг

- **Health Check**: https://uxaudute.vercel.app/api/health
- **Debug Info**: https://uxaudute.vercel.app/api/debug
- **Auth Test**: https://uxaudute.vercel.app/api/auth-test

## 🎯 Статус проекта

- ✅ **v1.1.0** - Текущая стабильная версия
- 🚧 **v1.2.0** - В разработке (экспорт PDF, темная тема)
- 📋 **v2.0.0** - Запланировано (командная работа, API)

## 🤝 Участие в разработке

1. Fork проекта
2. Создайте ветку для функции (`git checkout -b feature/AmazingFeature`)
3. Commit изменений (`git commit -m 'Add some AmazingFeature'`)
4. Push в ветку (`git push origin feature/AmazingFeature`)
5. Создайте Pull Request

## 📞 Поддержка

- **GitHub Issues**: [Создать issue](https://github.com/dev-bsvit/uxaudute/issues)
- **Документация**: Файлы в корне проекта
- **Production**: https://uxaudute.vercel.app

## 📝 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.