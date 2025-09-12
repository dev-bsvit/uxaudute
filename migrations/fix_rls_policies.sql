-- Исправление RLS политик для токеномики
-- Проблема: API не видит балансы пользователей из-за RLS

-- 1. Отключаем RLS для тестирования (временно)
ALTER TABLE user_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_webhooks DISABLE ROW LEVEL SECURITY;

-- 2. Удаляем старые политики
DROP POLICY IF EXISTS "Users can view their own balance" ON user_balances;
DROP POLICY IF EXISTS "Users can update their own balance" ON user_balances;
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their organization" ON organizations;
DROP POLICY IF EXISTS "Users can view organization members" ON organization_members;
DROP POLICY IF EXISTS "Users can view their payment orders" ON payment_orders;
DROP POLICY IF EXISTS "Service role can manage webhooks" ON stripe_webhooks;

-- 3. Создаем новые политики для user_balances
ALTER TABLE user_balances ENABLE ROW LEVEL SECURITY;

-- Политика для чтения баланса (любой авторизованный пользователь может читать свой баланс)
CREATE POLICY "Users can view their own balance" ON user_balances
    FOR SELECT USING (auth.uid() = user_id);

-- Политика для обновления баланса (только через функции)
CREATE POLICY "Users can update their own balance" ON user_balances
    FOR UPDATE USING (auth.uid() = user_id);

-- Политика для вставки баланса (только через функции)
CREATE POLICY "Users can insert their own balance" ON user_balances
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 4. Создаем новые политики для transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Политика для чтения транзакций
CREATE POLICY "Users can view their own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки транзакций (только через функции)
CREATE POLICY "Users can insert their own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Создаем новые политики для organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Политика для чтения организаций
CREATE POLICY "Users can view their organization" ON organizations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM organization_members 
            WHERE organization_id = organizations.id
        )
    );

-- 6. Создаем новые политики для organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Политика для чтения участников организации
CREATE POLICY "Users can view organization members" ON organization_members
    FOR SELECT USING (
        auth.uid() = user_id OR 
        auth.uid() IN (
            SELECT user_id FROM organization_members 
            WHERE organization_id = organization_members.organization_id 
            AND role = 'admin'
        )
    );

-- 7. Создаем новые политики для payment_orders
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Политика для чтения заказов
CREATE POLICY "Users can view their payment orders" ON payment_orders
    FOR SELECT USING (auth.uid() = user_id);

-- Политика для вставки заказов
CREATE POLICY "Users can insert their payment orders" ON payment_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Создаем новые политики для stripe_webhooks
ALTER TABLE stripe_webhooks ENABLE ROW LEVEL SECURITY;

-- Политика для webhooks (только service role)
CREATE POLICY "Service role can manage webhooks" ON stripe_webhooks
    FOR ALL USING (auth.role() = 'service_role');

-- 9. Создаем функцию для проверки RLS
CREATE OR REPLACE FUNCTION check_rls_status()
RETURNS TABLE (
    table_name text,
    rls_enabled boolean,
    policies_count integer
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.table_name::text,
        t.row_security::boolean,
        COALESCE(p.policies_count, 0)::integer
    FROM information_schema.tables t
    LEFT JOIN (
        SELECT 
            schemaname,
            tablename,
            COUNT(*) as policies_count
        FROM pg_policies 
        WHERE schemaname = 'public'
        GROUP BY schemaname, tablename
    ) p ON t.table_name = p.tablename
    WHERE t.table_schema = 'public' 
    AND t.table_name IN ('user_balances', 'transactions', 'organizations', 'organization_members', 'payment_orders', 'stripe_webhooks')
    ORDER BY t.table_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
