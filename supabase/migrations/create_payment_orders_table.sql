-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦЫ ЗАКАЗОВ (PAYMENT_ORDERS)
-- =====================================================
-- Дата: 01.12.2025
-- Описание: Таблица для хранения заказов (кредиты и подписки)
-- Поддержка Stripe и LiqPay
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Тип заказа
    order_type TEXT NOT NULL DEFAULT 'credits' CHECK (order_type IN ('credits', 'subscription')),

    -- Для покупки кредитов
    package_id TEXT,
    credits INTEGER,

    -- Для подписки
    subscription_type TEXT,

    -- Стоимость
    amount_usd DECIMAL(10, 2),
    amount_uah DECIMAL(10, 2),

    -- Платежная система
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'liqpay')),

    -- Статус заказа
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),

    -- Stripe данные
    stripe_payment_intent_id TEXT,
    stripe_client_secret TEXT,

    -- LiqPay данные
    liqpay_data TEXT,
    liqpay_signature TEXT,
    liqpay_payment_id TEXT,
    liqpay_order_id TEXT,

    -- Мета-информация
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

-- Комментарии
COMMENT ON TABLE payment_orders IS 'Заказы на покупку кредитов и подписок';
COMMENT ON COLUMN payment_orders.order_type IS 'Тип заказа: credits или subscription';
COMMENT ON COLUMN payment_orders.payment_provider IS 'Платежная система: stripe или liqpay';

DO $$
BEGIN
  RAISE NOTICE '=== ТАБЛИЦА PAYMENT_ORDERS СОЗДАНА ===';
END $$;
