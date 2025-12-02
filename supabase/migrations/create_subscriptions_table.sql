-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ПОДПИСОК
-- =====================================================
-- Дата: 01.12.2025
-- Описание: Система подписок для UX Audit Platform
-- Подписчики получают доступ к аудитам без кредитов
-- с дневным лимитом запросов
-- =====================================================

-- 1. Создаем таблицу subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Тип подписки
    subscription_type TEXT NOT NULL CHECK (subscription_type IN ('monthly_basic', 'monthly_pro', 'yearly_basic', 'yearly_pro')),

    -- Статус подписки
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),

    -- Платежная информация
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'liqpay')),
    external_subscription_id TEXT, -- ID подписки в платежной системе

    -- Даты
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    cancelled_at TIMESTAMP WITH TIME ZONE,

    -- Лимиты
    daily_limit INTEGER NOT NULL DEFAULT 10, -- Лимит запросов в день

    -- Мета-информация
    metadata JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Ограничения
    CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id),
    CONSTRAINT subscriptions_end_date_after_start CHECK (end_date > start_date)
);

-- 2. Создаем таблицу для отслеживания использования подписки
CREATE TABLE IF NOT EXISTS public.subscription_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Дата и количество запросов
    usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requests_count INTEGER NOT NULL DEFAULT 0,

    -- Детали использования
    audit_types JSONB DEFAULT '[]', -- Массив типов проведенных аудитов

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Уникальность: один пользователь - одна запись на день
    CONSTRAINT subscription_usage_unique UNIQUE (subscription_id, usage_date)
);

-- 3. Индексы для subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_end_date ON subscriptions(end_date);
CREATE INDEX IF NOT EXISTS idx_subscriptions_type ON subscriptions(subscription_type);

-- 4. Индексы для subscription_usage
CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON subscription_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_date ON subscription_usage(usage_date);

-- 5. Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Триггеры для автоматического обновления updated_at
CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

CREATE TRIGGER trigger_subscription_usage_updated_at
    BEFORE UPDATE ON subscription_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_subscriptions_updated_at();

-- 7. RLS политики для subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription" ON subscriptions
    FOR UPDATE USING (auth.uid() = user_id);

-- 8. RLS политики для subscription_usage
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage" ON subscription_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 9. Функция для проверки активной подписки
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

-- 10. Функция для проверки дневного лимита
CREATE OR REPLACE FUNCTION check_daily_limit(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    user_subscription RECORD;
    today_usage RECORD;
    remaining_requests INTEGER;
BEGIN
    -- Получаем активную подписку
    SELECT * INTO user_subscription
    FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND end_date > NOW()
    LIMIT 1;

    -- Если нет активной подписки
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'has_subscription', false,
            'can_proceed', false,
            'message', 'No active subscription'
        );
    END IF;

    -- Получаем использование за сегодня
    SELECT * INTO today_usage
    FROM subscription_usage
    WHERE subscription_id = user_subscription.id
      AND usage_date = CURRENT_DATE;

    -- Если записи нет, создаем (0 запросов)
    IF NOT FOUND THEN
        remaining_requests := user_subscription.daily_limit;
    ELSE
        remaining_requests := user_subscription.daily_limit - today_usage.requests_count;
    END IF;

    -- Возвращаем результат
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

-- 11. Функция для инкремента использования подписки
CREATE OR REPLACE FUNCTION increment_subscription_usage(
    user_uuid UUID,
    audit_type_param TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    user_subscription RECORD;
BEGIN
    -- Получаем активную подписку
    SELECT * INTO user_subscription
    FROM subscriptions
    WHERE user_id = user_uuid
      AND status = 'active'
      AND end_date > NOW()
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN false;
    END IF;

    -- Вставляем или обновляем запись использования
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

-- 12. Комментарии
COMMENT ON TABLE subscriptions IS 'Подписки пользователей на платформу';
COMMENT ON COLUMN subscriptions.subscription_type IS 'Тип подписки: monthly_basic, monthly_pro, yearly_basic, yearly_pro';
COMMENT ON COLUMN subscriptions.status IS 'Статус: active, cancelled, expired, pending';
COMMENT ON COLUMN subscriptions.daily_limit IS 'Максимальное количество запросов в день';

COMMENT ON TABLE subscription_usage IS 'История использования подписки по дням';
COMMENT ON COLUMN subscription_usage.requests_count IS 'Количество запросов за день';

COMMENT ON FUNCTION has_active_subscription IS 'Проверяет наличие активной подписки у пользователя';
COMMENT ON FUNCTION check_daily_limit IS 'Проверяет дневной лимит запросов для подписчика';
COMMENT ON FUNCTION increment_subscription_usage IS 'Увеличивает счетчик использования подписки';

-- 13. Вывод информации
DO $$
BEGIN
  RAISE NOTICE '=== ТАБЛИЦА ПОДПИСОК СОЗДАНА ===';
  RAISE NOTICE 'Таблицы: subscriptions, subscription_usage';
  RAISE NOTICE 'Функции: has_active_subscription, check_daily_limit, increment_subscription_usage';
  RAISE NOTICE '================================';
END $$;
