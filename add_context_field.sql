-- Добавляем поле context в таблицу audits
ALTER TABLE audits 
ADD COLUMN context TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN audits.context IS 'Пользовательский контекст для анализа интерфейса';








