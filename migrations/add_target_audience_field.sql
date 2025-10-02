-- Миграция: Добавление поля target_audience в таблицу projects
-- Дата: 2025-01-27
-- Описание: Добавляет поле для описания целевой аудитории проекта

-- Добавляем колонку target_audience
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Добавляем комментарий
COMMENT ON COLUMN projects.target_audience IS 'Описание целевой аудитории проекта для улучшения AI анализа';

-- Проверяем результат
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'target_audience';













