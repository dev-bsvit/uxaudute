-- Финальное исправление RLS для analysis_results

-- Удаляем существующую политику
DROP POLICY IF EXISTS "Allow all for analysis_results" ON analysis_results;

-- Создаем новую политику с правильными настройками
CREATE POLICY "Allow all operations for analysis_results" ON analysis_results
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Проверяем, что RLS включен
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Проверяем созданную политику
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'analysis_results';
