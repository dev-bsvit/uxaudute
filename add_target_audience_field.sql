-- Добавление поля target_audience в таблицу projects
-- Выполнить в Supabase SQL Editor

ALTER TABLE projects 
ADD COLUMN target_audience TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN projects.target_audience IS 'Описание целевой аудитории проекта для улучшения AI анализа';

-- Проверяем, что поле добавлено
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'target_audience';








