-- =====================================================
-- СОЗДАНИЕ ТАБЛИЦ КРЕДИТОВ ДЛЯ UX AUDIT PLATFORM
-- =====================================================
-- Версия: 1.0
-- Дата: 17.09.2025
-- Описание: Создание таблиц для системы кредитов

-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. ТАБЛИЦА: user_balances (Балансы пользователей)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_balances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0,
    grace_limit_used BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT user_balances_balance_positive CHECK (balance >= 0),
    CONSTRAINT user_balances_user_id_unique UNIQUE (user_id)
);

-- Индексы для user_balances
CREATE INDEX IF NOT EXISTS idx_user_balances_user_id ON user_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_balances_balance ON user_balances(balance);

-- =====================================================
-- 2. ТАБЛИЦА: transactions (Транзакции)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
    amount INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    source TEXT NOT NULL,
    description TEXT,
    related_audit_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT transactions_amount_not_zero CHECK (amount != 0),
    CONSTRAINT transactions_balance_after_positive CHECK (balance_after >= 0)
);

-- Индексы для transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_related_audit_id ON transactions(related_audit_id);

-- =====================================================
-- 3. ТАБЛИЦА: audit_credits (Стоимость аудитов)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.audit_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type TEXT NOT NULL CHECK (audit_type IN ('research', 'ab_test', 'business', 'hypotheses')),
    credits_cost INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ограничения
    CONSTRAINT audit_credits_cost_positive CHECK (credits_cost > 0),
    CONSTRAINT audit_credits_type_unique UNIQUE (audit_type, is_active)
);

-- Индексы для audit_credits
CREATE INDEX IF NOT EXISTS idx_audit_credits_audit_type ON audit_credits(audit_type);
CREATE INDEX IF NOT EXISTS idx_audit_credits_is_active ON audit_credits(is_active);

-- =====================================================
-- 4. ВСТАВКА НАЧАЛЬНЫХ ДАННЫХ
-- =====================================================

-- Вставляем стоимость аудитов
INSERT INTO public.audit_credits (audit_type, credits_cost, is_active) VALUES
    ('research', 2, true),
    ('ab_test', 3, true),
    ('business', 4, true),
    ('hypotheses', 1, true)
ON CONFLICT (audit_type, is_active) DO NOTHING;

-- =====================================================
-- 5. RLS ПОЛИТИКИ
-- =====================================================

-- Включаем RLS для user_balances
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Политики для user_balances
CREATE POLICY "Users can view their own balance" ON user_balances
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own balance" ON user_balances
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own balance" ON user_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Включаем RLS для transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Политики для transactions
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Включаем RLS для audit_credits
ALTER TABLE audit_credits ENABLE ROW LEVEL SECURITY;

-- Политики для audit_credits (все могут читать стоимости)
CREATE POLICY "Everyone can view audit costs" ON audit_credits
    FOR SELECT USING (true);

-- =====================================================
-- 6. КОММЕНТАРИИ
-- =====================================================

COMMENT ON TABLE user_balances IS 'Балансы кредитов пользователей';
COMMENT ON COLUMN user_balances.user_id IS 'ID пользователя';
COMMENT ON COLUMN user_balances.balance IS 'Текущий баланс кредитов';
COMMENT ON COLUMN user_balances.grace_limit_used IS 'Использован ли льготный лимит';

COMMENT ON TABLE transactions IS 'История транзакций кредитов';
COMMENT ON COLUMN transactions.user_id IS 'ID пользователя';
COMMENT ON COLUMN transactions.type IS 'Тип транзакции: credit (начисление), debit (списание)';
COMMENT ON COLUMN transactions.amount IS 'Сумма транзакции (положительная для начисления, отрицательная для списания)';
COMMENT ON COLUMN transactions.balance_after IS 'Баланс после транзакции';
COMMENT ON COLUMN transactions.source IS 'Источник транзакции';
COMMENT ON COLUMN transactions.related_audit_id IS 'ID связанного аудита (если есть)';

COMMENT ON TABLE audit_credits IS 'Стоимость различных типов аудитов в кредитах';
COMMENT ON COLUMN audit_credits.audit_type IS 'Тип аудита';
COMMENT ON COLUMN audit_credits.credits_cost IS 'Стоимость в кредитах';
COMMENT ON COLUMN audit_credits.is_active IS 'Активна ли данная стоимость';
