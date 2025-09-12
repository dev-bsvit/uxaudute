-- Упрощение RLS политик для таблицы audits

-- Удаляем ВСЕ существующие политики для audits
DROP POLICY IF EXISTS "Allow all operations for audits" ON audits;
DROP POLICY IF EXISTS "Users can create own audits" ON audits;
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON audits;
DROP POLICY IF EXISTS "Users can update own audits" ON audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON audits;

-- Временно отключаем RLS для audits
ALTER TABLE audits DISABLE ROW LEVEL SECURITY;

-- Проверяем, что RLS отключен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'audits';

-- Проверяем, что политики удалены
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'audits';





