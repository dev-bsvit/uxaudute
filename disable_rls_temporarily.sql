-- Временно отключаем RLS для analysis_results для тестирования

-- Отключаем RLS
ALTER TABLE analysis_results DISABLE ROW LEVEL SECURITY;

-- Проверяем, что RLS отключен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'analysis_results';

-- Проверяем, что политики больше не активны
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'analysis_results';






