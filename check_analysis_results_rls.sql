-- Проверка RLS политик для analysis_results

-- Проверяем, включен ли RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'analysis_results';

-- Проверяем существующие политики
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'analysis_results';

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analysis_results' 
ORDER BY ordinal_position;









