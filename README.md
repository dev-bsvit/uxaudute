# 🎯 UX Audit Platform

Автоматизированная платформа для анализа пользовательского опыта веб-сайтов с использованием ИИ.

## ✨ Основные возможности

- **🤖 ИИ-анализ** - Автоматический анализ UX с помощью GPT-4
- **💳 Токеномика** - Система кредитов для оплаты анализов
- **🔐 Безопасность** - Row Level Security (RLS) в Supabase
- **💳 Stripe интеграция** - Покупка кредитов через Stripe
- **👥 Команды** - Организации с общими пулами кредитов
- **📊 Аналитика** - Детальная статистика использования

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm или yarn
- Supabase аккаунт
- OpenAI API ключ
- Stripe аккаунт (для платежей)

### Установка

1. **Клонируйте репозиторий**
   ```bash
   git clone <repository-url>
   cd ux-audit
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp env.example .env.local
   # Заполните переменные в .env.local
   ```

4. **Запустите миграции базы данных**
   ```bash
   # Выполните SQL миграции в Supabase Dashboard
   # См. migrations/add_tokens_schema_minimal.sql
   ```

5. **Запустите приложение**
   ```bash
   npm run dev
   ```

## 🔧 Конфигурация

### Переменные окружения

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Настройка Stripe

1. **Получите ключи** из Stripe Dashboard
2. **Создайте webhook** на `https://yourdomain.com/api/stripe/webhook`
3. **Добавьте переменные** в Vercel Dashboard
4. **Перезапустите деплой**

Подробная инструкция: [STRIPE_PRODUCTION_SETUP.md](./STRIPE_PRODUCTION_SETUP.md)

## 📁 Структура проекта

```
ux-audit/
├── src/
│   ├── app/
│   │   ├── api/           # API роуты
│   │   ├── credits/       # Страница кредитов
│   │   └── page.tsx       # Главная страница
│   ├── components/        # React компоненты
│   └── lib/              # Утилиты и конфигурация
├── migrations/           # SQL миграции
├── docs/                # Документация
└── README.md
```

## 🎯 API Endpoints

### Анализ
- `POST /api/research-with-credits` - Анализ с проверкой кредитов
- `POST /api/research-stable` - Стабильный анализ

### Кредиты
- `GET /api/credits/balance` - Получить баланс
- `POST /api/credits/check` - Проверить кредиты
- `POST /api/credits/deduct` - Списать кредиты
- `GET /api/credits/packages` - Получить пакеты

### Stripe
- `POST /api/stripe/create-payment-intent` - Создать платеж
- `POST /api/stripe/webhook` - Webhook обработчик
- `GET /api/stripe/status` - Статус интеграции

## 💳 Токеномика

### Типы кредитов
- **Основной аудит**: 2 кредита
- **Дополнительный аудит**: 1 кредит

### Пользователи
- **Гость**: Не авторизован
- **Зарегистрированный**: Email подтвержден, 5 бесплатных кредитов
- **Тестовый**: Внутренний доступ без токенов
- **Платный**: Имеет купленные кредиты
- **Команда**: Организация с общим пулом

### Пакеты кредитов
- **BASIC**: 20 кредитов
- **PRO**: 60 кредитов  
- **TEAM**: 200 кредитов

## 🔐 Безопасность

- **Row Level Security (RLS)** - Контроль доступа на уровне строк
- **JWT токены** - Аутентификация через Supabase
- **Валидация данных** - Проверка всех входных данных
- **Rate limiting** - Защита от злоупотреблений

## 📊 Мониторинг

### Логи
- **Vercel Functions** - Логи серверных функций
- **Supabase Logs** - Логи базы данных
- **Stripe Dashboard** - Логи платежей

### Метрики
- Количество анализов
- Использование кредитов
- Конверсия платежей
- Ошибки API

## 🚀 Деплой

### Vercel (Рекомендуется)

1. **Подключите репозиторий** к Vercel
2. **Добавьте переменные окружения**
3. **Настройте домен**
4. **Запустите деплой**

### Другие платформы

Приложение совместимо с любыми платформами, поддерживающими Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Разработка

### Команды

```bash
npm run dev          # Запуск в режиме разработки
npm run build        # Сборка для продакшена
npm run start        # Запуск продакшен сборки
npm run lint         # Проверка кода
npm run type-check   # Проверка типов TypeScript
```

### Структура базы данных

Основные таблицы:
- `profiles` - Профили пользователей
- `user_balances` - Балансы кредитов
- `transactions` - История транзакций
- `payment_orders` - Заказы платежей
- `organizations` - Организации
- `audits` - Результаты анализов

## 📚 Документация

- [QUICKSTART_GUIDE.md](./QUICKSTART_GUIDE.md) - Быстрый старт
- [STRIPE_INTEGRATION.md](./STRIPE_INTEGRATION.md) - Интеграция Stripe
- [STRIPE_PRODUCTION_SETUP.md](./STRIPE_PRODUCTION_SETUP.md) - Настройка продакшена
- [STRIPE_KEYS_SETUP.md](./STRIPE_KEYS_SETUP.md) - Настройка ключей
- [SUPABASE_CONFIG_FIX.md](./SUPABASE_CONFIG_FIX.md) - Исправление Supabase

## 🐛 Troubleshooting

### Частые проблемы

1. **Ошибки компиляции TypeScript**
   - Проверьте типы в `src/lib/analysis-types.ts`
   - Убедитесь что все импорты корректны

2. **Проблемы с Supabase**
   - Проверьте переменные окружения
   - Убедитесь что RLS политики настроены

3. **Ошибки Stripe**
   - Проверьте ключи в Vercel Dashboard
   - Убедитесь что webhook настроен

### Поддержка

- Создайте issue в GitHub
- Проверьте логи в Vercel Dashboard
- Обратитесь к документации Stripe/Supabase

## 📄 Лицензия

MIT License - см. [LICENSE](./LICENSE)

## 🙏 Благодарности

- [Next.js](https://nextjs.org/) - React фреймворк
- [Supabase](https://supabase.com/) - Backend as a Service
- [Stripe](https://stripe.com/) - Платежная система
- [OpenAI](https://openai.com/) - ИИ провайдер
- [Tailwind CSS](https://tailwindcss.com/) - CSS фреймворк

---

**Версия**: 1.0.0  
**Последнее обновление**: 2025-09-12  
**Статус**: ✅ Стабильная версия