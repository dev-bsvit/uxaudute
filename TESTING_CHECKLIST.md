# ✅ ЧЕКЛИСТ ПЕРЕД ТЕСТИРОВАНИЕМ

## 1️⃣ Применить миграции БД (ОБЯЗАТЕЛЬНО!)

### Через Supabase Dashboard (SQL Editor):

**Шаг 1: Обновить стоимость аудитов**
```sql
-- Файл: supabase/migrations/update_tokenomics_v2.sql
-- Копируем содержимое и запускаем
```

**Шаг 2: Создать таблицы подписок**
```sql
-- Файл: supabase/migrations/create_subscriptions_table.sql
-- Копируем содержимое и запускаем
```

**Шаг 3: Создать таблицу заказов**
```sql
-- Файл: supabase/migrations/create_payment_orders_table.sql
-- Копируем содержимое и запускаем
```

### Проверка успешности:
```sql
-- Должны появиться новые таблицы
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscriptions', 'subscription_usage', 'payment_orders');

-- Проверить обновленные цены
SELECT * FROM audit_credits ORDER BY audit_type;
```

---

## 2️⃣ Настроить переменные окружения

**Создать файл `.env.local`:**
```env
# Supabase (уже есть)
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# OpenAI (уже есть)
OPENAI_API_KEY=your_key

# LiqPay ТЕСТОВЫЕ ключи
LIQPAY_PUBLIC_KEY=sandbox_i00000000
LIQPAY_PRIVATE_KEY=sandbox_XXXXXXXXXXXXXXXXXXXXXXXX

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Получить тестовые ключи LiqPay:**
1. Зарегистрироваться на https://www.liqpay.ua/
2. Перейти в раздел API
3. Скопировать sandbox ключи

---

## 3️⃣ Перезапустить dev сервер

```bash
# Остановить текущий сервер (Ctrl+C)
# Запустить заново
npm run dev
```

---

## 4️⃣ Что можно тестировать БЕЗ РИСКА:

### ✅ Безопасно (не влияет на продакшн):

**A. Проверка конфига:**
```typescript
// В консоли браузера (DevTools)
import { CREDIT_PACKAGES, SUBSCRIPTION_PLANS } from '@/config/tokenomics.config'
console.log(CREDIT_PACKAGES)
console.log(SUBSCRIPTION_PLANS)
```

**B. Проверка API (GET запросы):**
```bash
# Получить баланс
curl http://localhost:3000/api/credits/balance

# Получить пакеты
curl http://localhost:3000/api/credits/packages

# Проверить webhook
curl http://localhost:3000/api/liqpay/webhook
```

**C. Тестовый платеж LiqPay (sandbox):**
- НЕ списывает реальные деньги
- Тестовая карта: `4242424242424242`
- CVV: любой 3-значный
- Срок: любая будущая дата

---

## 5️⃣ Что НЕ тестировать пока:

### ⚠️ НЕ трогать (может сломать):

1. ❌ Реальные покупки через Stripe (если Stripe еще используется)
2. ❌ Реальные кредитные карты в LiqPay
3. ❌ Продакшн БД (только dev/staging)

---

## 6️⃣ План тестирования (по порядку):

### Фаза 1: Проверка БД (5 мин)
```sql
-- 1. Проверить таблицы
SELECT * FROM audit_credits;
SELECT * FROM subscriptions LIMIT 5;
SELECT * FROM payment_orders LIMIT 5;

-- 2. Проверить RPC функции
SELECT has_active_subscription('YOUR_TEST_USER_ID');
SELECT check_daily_limit('YOUR_TEST_USER_ID');
```

### Фаза 2: Проверка API (10 мин)
```bash
# Запустить dev сервер
npm run dev

# Проверить endpoints
curl http://localhost:3000/api/credits/balance
curl http://localhost:3000/api/test-tokens-direct
```

### Фаза 3: Тестовый платеж LiqPay (15 мин)
1. Открыть http://localhost:3000/credits
2. Выбрать пакет
3. Нажать "Buy with LiqPay"
4. Использовать тестовую карту: `4242424242424242`
5. Проверить, что кредиты начислились

### Фаза 4: Проверка подписки (15 мин)
1. Создать тестовую подписку через SQL:
```sql
INSERT INTO subscriptions (user_id, subscription_type, status, payment_provider, start_date, end_date, daily_limit)
VALUES ('YOUR_TEST_USER_ID', 'monthly_basic', 'active', 'liqpay', NOW(), NOW() + INTERVAL '1 month', 10);
```
2. Провести аудит
3. Проверить, что кредиты НЕ списались
4. Проверить `subscription_usage`

---

## 7️⃣ Откат изменений (если что-то пошло не так):

### Быстрый откат БД:
```sql
-- Удалить новые таблицы (если нужно)
DROP TABLE IF EXISTS subscription_usage CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS payment_orders CASCADE;

-- Вернуть старые цены аудитов
UPDATE audit_credits SET credits_cost = 3 WHERE audit_type = 'ab_test';
UPDATE audit_credits SET credits_cost = 4 WHERE audit_type = 'business';
DELETE FROM audit_credits WHERE audit_type IN ('survey', 'all_audits');
```

### Откат кода:
```bash
git status
git diff  # посмотреть изменения
git checkout -- .  # отменить все изменения (ОСТОРОЖНО!)
```

---

## 8️⃣ Когда МОЖНО пускать в продакшн:

✅ **Готово к продакшн, если:**
- [ ] Все миграции БД применены успешно
- [ ] Тестовый платеж LiqPay прошел успешно
- [ ] Кредиты начислились корректно
- [ ] Проверена работа подписки
- [ ] Получены БОЕВЫЕ ключи LiqPay (не sandbox)
- [ ] Обновлены переменные окружения на продакшн
- [ ] Сделан бэкап БД на всякий случай

---

## 9️⃣ Контакты поддержки:

**LiqPay:**
- Документация: https://www.liqpay.ua/documentation
- Поддержка: support@liqpay.ua
- Тестовый режим: https://www.liqpay.ua/documentation/test

**Supabase:**
- Dashboard: https://app.supabase.com
- Документация: https://supabase.com/docs

---

## 🚨 Что делать если сломалось:

1. **НЕ ПАНИКОВАТЬ** 😊
2. Проверить логи сервера: `npm run dev` (вывод в консоли)
3. Проверить логи Supabase: Dashboard → Logs
4. Откатить изменения БД (см. п.7)
5. Написать в issues: https://github.com/anthropics/claude-code/issues

---

**Последнее обновление:** 01.12.2025
**Автор:** UX Audit Platform Team
