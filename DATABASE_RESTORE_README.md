# 🗄️ Восстановление базы данных UX Audit Platform

## 📋 Обзор

Этот набор скриптов позволяет полностью восстановить базу данных UX Audit Platform из нуля или перенести данные между экземплярами Supabase.

## 📁 Файлы

### 1. `database_complete_schema.sql` - Полная схема базы данных
- **Назначение**: Создание всех таблиц, индексов, constraints, RLS политик
- **Когда использовать**: При создании новой базы данных с нуля
- **Содержит**:
  - 7 основных таблиц
  - Все индексы для производительности
  - Check constraints для валидации
  - Row Level Security (RLS) политики
  - Триггеры для обновления `updated_at`
  - Вспомогательные функции

### 2. `export_database_schema.sql` - Экспорт структуры
- **Назначение**: Получение текущей структуры базы данных из Supabase
- **Когда использовать**: Для анализа существующей структуры
- **Содержит**: SQL запросы для получения метаданных

### 3. `export_database_data.sql` - Экспорт данных
- **Назначение**: Экспорт всех данных в JSON формате
- **Когда использовать**: Для резервного копирования данных
- **Содержит**: SELECT запросы для экспорта всех таблиц

### 4. `import_database_data.sql` - Импорт данных
- **Назначение**: Импорт данных из JSON в базу данных
- **Когда использовать**: Для восстановления данных после экспорта
- **Содержит**: Функции для импорта каждой таблицы

## 🚀 Пошаговое восстановление

### Вариант 1: Создание новой базы данных

1. **Откройте Supabase Dashboard**
2. **Перейдите в SQL Editor**
3. **Выполните скрипт**:
   ```sql
   -- Скопируйте и выполните содержимое database_complete_schema.sql
   ```
4. **Проверьте создание таблиц**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

### Вариант 2: Восстановление с данными

1. **Создайте схему** (выполните `database_complete_schema.sql`)
2. **Экспортируйте данные** из старой базы (выполните `export_database_data.sql`)
3. **Импортируйте данные** в новую базу (выполните `import_database_data.sql`)

### Вариант 3: Полный перенос между проектами

1. **В старом проекте Supabase**:
   - Выполните `export_database_schema.sql` для получения структуры
   - Выполните `export_database_data.sql` для получения данных

2. **В новом проекте Supabase**:
   - Выполните `database_complete_schema.sql` для создания структуры
   - Выполните `import_database_data.sql` с вашими данными

## 🔧 Настройка после восстановления

### 1. Проверка RLS политик
```sql
-- Проверяем, что RLS включен
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

### 2. Проверка индексов
```sql
-- Проверяем созданные индексы
SELECT tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 3. Проверка функций
```sql
-- Проверяем созданные функции
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

### 4. Тестирование RLS
```sql
-- Тестируем, что RLS работает
-- (выполните от имени пользователя)
SELECT * FROM profiles WHERE id = auth.uid();
```

## 📊 Структура таблиц

### Основные таблицы:
- **`profiles`** - Профили пользователей
- **`projects`** - Проекты пользователей
- **`audits`** - UX аудиты
- **`audit_history`** - История действий
- **`analysis_results`** - Результаты анализа
- **`annotations`** - Аннотации на скриншотах
- **`storage_objects`** - Метаданные файлов

### Связи:
```
profiles (1) ←→ (N) projects (1) ←→ (N) audits (1) ←→ (N) audit_history
                                                      (1) ←→ (N) analysis_results
                                                      (1) ←→ (N) annotations
                                                      (1) ←→ (N) storage_objects
```

## 🔐 Безопасность

### Row Level Security (RLS):
- Все таблицы защищены RLS политиками
- Пользователи видят только свои данные
- Политики автоматически применяются

### Проверка безопасности:
```sql
-- Проверяем RLS политики
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

## 🐛 Устранение проблем

### Проблема: Ошибки при создании таблиц
**Решение**: Убедитесь, что у вас есть права на создание таблиц в схеме `public`

### Проблема: Ошибки RLS
**Решение**: Проверьте, что пользователь аутентифицирован перед выполнением запросов

### Проблема: Ошибки импорта данных
**Решение**: Убедитесь, что данные в правильном JSON формате и UUID корректны

### Проблема: Медленные запросы
**Решение**: Проверьте, что все индексы созданы корректно

## 📈 Мониторинг

### Проверка статистики:
```sql
-- Статистика по таблицам
SELECT 
    schemaname,
    tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Проверка размера таблиц:
```sql
-- Размер таблиц
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## 🔄 Резервное копирование

### Ежедневное резервное копирование:
1. Выполните `export_database_data.sql`
2. Сохраните результат в файл
3. Архивируйте файл

### Восстановление из резервной копии:
1. Выполните `database_complete_schema.sql`
2. Выполните `import_database_data.sql` с данными из резервной копии

## 📞 Поддержка

При возникновении проблем:
1. Проверьте логи Supabase
2. Убедитесь в корректности SQL синтаксиса
3. Проверьте права доступа пользователя
4. Обратитесь к документации Supabase

---

*Документация обновлена: 10.09.2025*








