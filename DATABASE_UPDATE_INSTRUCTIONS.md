# Инструкция по обновлению базы данных

## Добавление поля target_audience в таблицу projects

### Шаг 1: Открыть Supabase Dashboard
1. Перейти в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выбрать проект UX Audit Platform
3. Перейти в раздел "SQL Editor"

### Шаг 2: Выполнить SQL запрос
Скопировать и выполнить следующий SQL:

```sql
-- Добавление поля target_audience в таблицу projects
ALTER TABLE projects 
ADD COLUMN target_audience TEXT;

-- Добавляем комментарий к полю
COMMENT ON COLUMN projects.target_audience IS 'Описание целевой аудитории проекта для улучшения AI анализа';
```

### Шаг 3: Проверить результат
Выполнить проверочный запрос:

```sql
-- Проверяем, что поле добавлено
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name = 'target_audience';
```

### Ожидаемый результат:
```
column_name      | data_type | is_nullable
target_audience  | text      | YES
```

### Шаг 4: Проверить работу приложения
1. Запустить приложение: `npm run dev`
2. Перейти на страницу проекта
3. Убедиться, что блок "Целевая аудитория" отображается
4. Проверить, что можно вводить и сохранять текст

## Альтернативный способ (через Table Editor)
1. Перейти в "Table Editor" → "projects"
2. Нажать "Add Column"
3. Название: `target_audience`
4. Тип: `text`
5. Nullable: `true`
6. Нажать "Save"
