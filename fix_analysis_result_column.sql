-- Добавление колонки analysis_result в таблицу audits
-- Выполнить в Supabase SQL Editor

-- Добавляем колонку analysis_result в таблицу audits
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS analysis_result jsonb;

-- Добавляем комментарий для документации
COMMENT ON COLUMN public.audits.analysis_result IS 'Результат анализа в формате JSON';

-- Создаем индекс для производительности
CREATE INDEX IF NOT EXISTS idx_audits_analysis_result ON public.audits USING gin (analysis_result);

-- Обновляем существующие записи (если есть)
UPDATE public.audits 
SET analysis_result = result_data 
WHERE analysis_result IS NULL AND result_data IS NOT NULL;


