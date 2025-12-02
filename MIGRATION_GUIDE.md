# 🚀 ПОШАГОВОЕ РУКОВОДСТВО ПО МИГРАЦИИ

## Шаг 1: Открыть Supabase Dashboard

1. Перейти на https://app.supabase.com
2. Выбрать свой проект **UX_AUDIT**
3. В левом меню выбрать **SQL Editor**

---

## Шаг 2: Миграция #1 - Обновление цен аудитов

### Что делаем:
- Изменяем ab_test: 3 → 1 кредит
- Изменяем business: 4 → 1 кредит
- Добавляем survey: 1 кредит (новый)
- Добавляем all_audits: 4 кредита (новый)

### Действия:

1. **Нажать "New query"** в SQL Editor
2. **Скопировать весь код ниже:**

```sql
-- =====================================================
-- ОБНОВЛЕНИЕ СТОИМОСТИ АУДИТОВ v2.0
-- =====================================================

-- 1. Обновляем ab_test: 3 → 1 кредит
UPDATE public.audit_credits
SET
  credits_cost = 1,
  updated_at = NOW()
WHERE audit_type = 'ab_test' AND is_active = true;

-- 2. Обновляем business: 4 → 1 кредит
UPDATE public.audit_credits
SET
  credits_cost = 1,
  updated_at = NOW()
WHERE audit_type = 'business' AND is_active = true;

-- 3. Добавляем новый тип: survey (опросы) - 1 кредит
INSERT INTO public.audit_credits (audit_type, credits_cost, is_active)
VALUES ('survey', 1, true)
ON CONFLICT (audit_type, is_active)
DO UPDATE SET
  credits_cost = 1,
  updated_at = NOW();

-- 4. Добавляем новый тип: all_audits (все 4 аудита за раз) - 4 кредита
INSERT INTO public.audit_credits (audit_type, credits_cost, is_active)
VALUES ('all_audits', 4, true)
ON CONFLICT (audit_type, is_active)
DO UPDATE SET
  credits_cost = 4,
  updated_at = NOW();

-- 5. Показываем итоговую таблицу стоимости
SELECT audit_type, credits_cost, is_active
FROM public.audit_credits
ORDER BY audit_type;
```

3. **Нажать "Run"** или `Ctrl+Enter`
4. **Проверить результат** - должны увидеть таблицу с обновленными ценами:
   - research: 2
   - ab_test: 1 ✅
   - business: 1 ✅
   - hypotheses: 1
   - survey: 1 ✅ новый
   - all_audits: 4 ✅ новый

✅ **Миграция #1 выполнена!**

---

## Шаг 3: Миграция #2 - Создание таблиц подписок

### Что создаем:
- Таблица `subscriptions` - активные подписки
- Таблица `subscription_usage` - использование по дням
- RPC функции для работы с подписками

### Действия:

1. **Нажать "New query"** в SQL Editor
2. **Скопировать ВЕСЬ код из файла:**
   - Путь: `supabase/migrations/create_subscriptions_table.sql`
   - Это большой файл (~200 строк)

**ИЛИ скопируйте прямо отсюда:**

```sql
-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ПОДПИСОК
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly_basic', 'monthly_pro', 'yearly_basic', 'yearly_pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'liqpay')),
    external_subscription_id TEXT,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    daily_limit INTEGER NOT NULL DEFAULT 10,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id),
    CONSTRAINT subscriptions_end_date_after_start CHECK (end_date > start_date)
);

CREATE TABLE IF NOT EXISTS public.subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_count INTEGER NOT NULL DEFAULT 0,
    audit_types JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT subscription_usage_unique UNIQUE (subscription_id, usage_date)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON subscriptions(subscription_type);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_date ON subscription_usage(usage_date);

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Триггеры
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER trigger_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- RLS политики
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON subscription_usage
    FOR SELECT USING (auth.uid() = user_id);

-- RPC функции
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    active_sub RECORD;
BEGIN
    SELECT * INTO active_sub
    FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND end_date > NOW()
    LIMIT 1;

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_subscription RECORD;
    today_usage RECORD;
    remaining_requests INTEGER;
BEGIN
    SELECT * INTO user_subscription
    FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND end_date > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'has_subscription', false,
            'can_proceed', false,
            'message', 'No active subscription'
        );
    END IF;

    SELECT * INTO today_usage
    FROM subscription_usage
    WHERE subscription_id = user_subscription.id
      AND usage_date = CURRENT_DATE;

    IF NOT FOUND THEN
        remaining_requests := user_subscription.daily_limit;
    ELSE
        remaining_requests := user_subscription.daily_limit - today_usage.requests_count;
    END IF;

    RETURN jsonb_build_object(
        'has_subscription', true,
        'can_proceed', remaining_requests > 0,
        'daily_limit', user_subscription.daily_limit,
        'used_today', COALESCE(today_usage.requests_count, 0),
        'remaining', remaining_requests,
        'subscription_type', user_subscription.subscription_type,
        'message', CASE
            WHEN remaining_requests > 0 THEN 'Can proceed'
            ELSE 'Daily limit reached'
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION increment_subscription_usage(
    user_uuid UUID,
    audit_type_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription RECORD;
BEGIN
    SELECT * INTO user_subscription
    FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND end_date > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    INSERT INTO subscription_usage (subscription_id, user_id, usage_date, requests_count, audit_types)
    VALUES (
        user_subscription.id,
        user_uuid,
        CURRENT_DATE,
        1,
        jsonb_build_array(audit_type_param)
    )
    ON CONFLICT (subscription_id, usage_date)
    DO UPDATE SET
        requests_count = subscription_usage.requests_count + 1,
        audit_types = subscription_usage.audit_types || jsonb_build_array(audit_type_param),
        updated_at = NOW();

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

3. **Нажать "Run"**
4. **Проверить результат** - должно быть "Success. No rows returned"

**Проверка:**
```sql
-- Проверяем что таблицы созданы
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('subscriptions', 'subscription_usage');
```

✅ **Миграция #2 выполнена!**

---

## Шаг 4: Миграция #3 - Создание таблицы заказов

### Что создаем:
- Таблица `payment_orders` - все заказы (кредиты и подписки)

### Действия:

1. **Нажать "New query"**
2. **Скопировать код:**

```sql
-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ЗАКАЗОВ
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_type TEXT NOT NULL DEFAULT 'credits' CHECK (order_type IN ('credits', 'subscription')),
    package_id TEXT,
    credits INTEGER,
    subscription_type TEXT,
    amount_usd DECIMAL(10, 2),
    amount_uah DECIMAL(10, 2),
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'liqpay')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    stripe_payment_intent_id TEXT,
    stripe_client_secret TEXT,
    liqpay_data TEXT,
    liqpay_signature TEXT,
    liqpay_payment_id TEXT,
    liqpay_order_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_payment_orders_user_id ON payment_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_provider ON payment_orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_orders_stripe_intent ON payment_orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_liqpay_payment ON payment_orders(liqpay_payment_id);

-- RLS политики
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own orders" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own orders" ON payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

3. **Нажать "Run"**

**Проверка:**
```sql
SELECT * FROM payment_orders LIMIT 1;
```

✅ **Миграция #3 выполнена!**

---

## Шаг 5: Финальная проверка

**Выполните этот запрос чтобы убедиться что всё готово:**

```sql
-- Проверяем все таблицы
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as columns_count
FROM information_schema.tables t
WHERE table_schema = 'public'
AND table_name IN ('audit_credits', 'subscriptions', 'subscription_usage', 'payment_orders', 'user_balances', 'transactions')
ORDER BY table_name;

-- Проверяем цены аудитов
SELECT audit_type, credits_cost FROM audit_credits ORDER BY audit_type;

-- Проверяем RPC функции
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('has_active_subscription', 'check_daily_limit', 'increment_subscription_usage')
ORDER BY routine_name;
```

**Ожидаемый результат:**
- 6 таблиц найдено ✅
- 6 типов аудитов с правильными ценами ✅
- 3 RPC функции найдено ✅

---

## ✅ ГОТОВО!

Теперь можно переходить к настройке LiqPay ключей и тестированию!

**Следующий шаг:** Создать файл `.env.local` с LiqPay ключами
