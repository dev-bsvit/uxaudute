-- Добавляем поле context в таблицу projects
ALTER TABLE projects 
ADD COLUMN context TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN projects.context IS 'Контекст проекта для всех аудитов в этом проекте';

-- Обновляем существующие проекты (если есть)
UPDATE projects 
SET context = 'Контекст не указан' 
WHERE context IS NULL;


