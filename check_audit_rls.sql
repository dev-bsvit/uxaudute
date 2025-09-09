-- Проверяем RLS для audits
SELECT schemaname, tablename, rowsecurity, hasrls 
FROM pg_tables 
WHERE tablename IN ('audits', 'analysis_results');

-- Проверяем политики для audits
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('audits', 'analysis_results');
