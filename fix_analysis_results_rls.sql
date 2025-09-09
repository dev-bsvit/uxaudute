-- Исправление RLS политик для таблицы analysis_results

-- Включаем RLS для analysis_results
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Удаляем существующие политики (если есть)
DROP POLICY IF EXISTS "Users can view own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can insert own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can update own analysis results" ON analysis_results;
DROP POLICY IF EXISTS "Users can delete own analysis results" ON analysis_results;

-- Создаем простые политики "Allow all" для analysis_results
CREATE POLICY "Allow all for analysis_results" ON analysis_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Проверяем, что таблица существует и имеет правильную структуру
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'analysis_results' 
ORDER BY ordinal_position;
