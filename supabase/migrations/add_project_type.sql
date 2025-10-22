-- Добавление поля type в таблицу projects для разделения проектов аудитов и опросов

-- Добавляем колонку type
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'audit'
CHECK (type IN ('audit', 'survey'));

-- Создаём индекс для быстрого поиска по типу
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);

-- Обновляем существующие проекты - все будут типа 'audit' по умолчанию
UPDATE projects SET type = 'audit' WHERE type IS NULL;

-- Комментарий для документации
COMMENT ON COLUMN projects.type IS 'Тип проекта: audit (для UX аудитов) или survey (для опросов)';
