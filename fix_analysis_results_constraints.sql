-- Исправление check constraints для analysis_results

-- Удаляем существующие constraints
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_result_type_check;
ALTER TABLE analysis_results DROP CONSTRAINT IF EXISTS analysis_results_status_check;

-- Создаем новые constraints с правильными значениями
ALTER TABLE analysis_results ADD CONSTRAINT analysis_results_result_type_check 
CHECK (result_type IN ('ab_test', 'hypotheses', 'ux_analysis', 'usability_test', 'heuristic_evaluation'));

ALTER TABLE analysis_results ADD CONSTRAINT analysis_results_status_check 
CHECK (status IN ('pending', 'completed', 'failed', 'in_progress'));

-- Проверяем, что constraints созданы
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'analysis_results'::regclass 
AND contype = 'c';








