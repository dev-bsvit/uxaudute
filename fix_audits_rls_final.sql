-- Исправление RLS политик для таблицы audits

-- Проверяем текущие политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'audits';

-- Удаляем все существующие политики для audits
DROP POLICY IF EXISTS "Users can view own audits" ON audits;
DROP POLICY IF EXISTS "Users can insert own audits" ON audits;
DROP POLICY IF EXISTS "Users can update own audits" ON audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON audits;
DROP POLICY IF EXISTS "Allow all for audits" ON audits;
DROP POLICY IF EXISTS "Allow all operations for audits" ON audits;

-- Создаем простую политику "Allow all" для audits
CREATE POLICY "Allow all operations for audits" ON audits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Проверяем, что RLS включен
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;

-- Проверяем созданную политику
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'audits';










