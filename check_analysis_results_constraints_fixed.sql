-- Проверка check constraints для analysis_results (исправленная версия)

-- Проверяем существующие constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'analysis_results'::regclass;

-- Проверяем структуру таблицы
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'analysis_results' 
ORDER BY ordinal_position;

-- Проверяем, какие значения разрешены для result_type
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'analysis_results'::regclass 
AND contype = 'c';




