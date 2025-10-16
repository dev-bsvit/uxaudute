-- =====================================================
-- МИГРАЦИЯ: Создание RPC функций для работы с кредитами
-- =====================================================
-- Версия: 1.2
-- Дата: 15.09.2025
-- Описание: Создание RPC функций для проверки баланса и списания кредитов

-- Функция для получения баланса пользователя
CREATE OR REPLACE FUNCTION get_user_balance(user_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_balance INTEGER;
BEGIN
    -- Получаем баланс пользователя
    SELECT COALESCE(balance, 0) INTO user_balance
    FROM user_balances
    WHERE user_id = user_uuid;
    
    -- Если пользователя нет, возвращаем 0
    IF user_balance IS NULL THEN
        RETURN 0;
    END IF;
    
    RETURN user_balance;
END;
$$;

-- Функция для списания кредитов (обновлено: добавлен параметр related_audit_id)
CREATE OR REPLACE FUNCTION deduct_credits(
    user_uuid UUID,
    amount INTEGER,
    source TEXT DEFAULT 'audit',
    description TEXT DEFAULT 'Credit deduction',
    related_audit_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_balances
    WHERE user_id = user_uuid;

    -- Если пользователя нет, создаем запись с балансом 0
    IF current_balance IS NULL THEN
        INSERT INTO user_balances (user_id, balance, grace_limit_used)
        VALUES (user_uuid, 0, false)
        ON CONFLICT (user_id) DO NOTHING;

        current_balance := 0;
    END IF;

    -- Проверяем, достаточно ли кредитов
    IF current_balance < amount THEN
        RETURN FALSE;
    END IF;

    -- Вычисляем новый баланс
    new_balance := current_balance - amount;

    -- Обновляем баланс
    UPDATE user_balances
    SET balance = new_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid;

    -- Создаем транзакцию
    transaction_id := gen_random_uuid();

    -- Создаем запись транзакции с related_audit_id (если указан)
    IF related_audit_id IS NOT NULL THEN
        INSERT INTO transactions (
            id,
            user_id,
            type,
            amount,
            balance_after,
            source,
            description,
            related_audit_id,
            created_at
        ) VALUES (
            transaction_id,
            user_uuid,
            'debit',
            -amount,
            new_balance,
            source,
            description,
            related_audit_id,
            NOW()
        );
    ELSE
        INSERT INTO transactions (
            id,
            user_id,
            type,
            amount,
            balance_after,
            source,
            description,
            created_at
        ) VALUES (
            transaction_id,
            user_uuid,
            'debit',
            -amount,
            new_balance,
            source,
            description,
            NOW()
        );
    END IF;

    RETURN TRUE;
END;
$$;

-- Функция для добавления кредитов
CREATE OR REPLACE FUNCTION add_credits(
    user_uuid UUID,
    amount INTEGER,
    source TEXT DEFAULT 'purchase',
    description TEXT DEFAULT 'Credit addition'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
    new_balance INTEGER;
    transaction_id UUID;
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_balances
    WHERE user_id = user_uuid;
    
    -- Если пользователя нет, создаем запись с балансом 0
    IF current_balance IS NULL THEN
        INSERT INTO user_balances (user_id, balance, grace_limit_used)
        VALUES (user_uuid, 0, false)
        ON CONFLICT (user_id) DO NOTHING;
        
        current_balance := 0;
    END IF;
    
    -- Вычисляем новый баланс
    new_balance := current_balance + amount;
    
    -- Обновляем баланс
    UPDATE user_balances
    SET balance = new_balance,
        updated_at = NOW()
    WHERE user_id = user_uuid;
    
    -- Создаем транзакцию
    transaction_id := gen_random_uuid();
    
    INSERT INTO transactions (
        id,
        user_id,
        type,
        amount,
        balance_after,
        source,
        description,
        created_at
    ) VALUES (
        transaction_id,
        user_uuid,
        'credit',
        amount,
        new_balance,
        source,
        description,
        NOW()
    );
    
    RETURN TRUE;
END;
$$;

-- Функция для проверки возможности списания кредитов
CREATE OR REPLACE FUNCTION can_deduct_credits(
    user_uuid UUID,
    amount INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Получаем текущий баланс
    SELECT COALESCE(balance, 0) INTO current_balance
    FROM user_balances
    WHERE user_id = user_uuid;
    
    -- Если пользователя нет, возвращаем FALSE
    IF current_balance IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Проверяем, достаточно ли кредитов
    RETURN current_balance >= amount;
END;
$$;

-- Предоставляем права на выполнение функций
GRANT EXECUTE ON FUNCTION get_user_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(UUID, INTEGER, TEXT, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_credits(UUID, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_deduct_credits(UUID, INTEGER) TO authenticated;

SELECT 'RPC functions created successfully' as status;
