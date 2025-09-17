-- =====================================================
-- ЭКСПОРТ ДАННЫХ ИЗ UX AUDIT PLATFORM
-- =====================================================
-- Выполните этот скрипт в Supabase SQL Editor для экспорта данных

-- 1. Экспорт профилей пользователей
SELECT 
    'profiles' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'email', email,
            'full_name', full_name,
            'avatar_url', avatar_url,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) as data
FROM profiles;

-- 2. Экспорт проектов
SELECT 
    'projects' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'user_id', user_id,
            'name', name,
            'description', description,
            'context', context,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) as data
FROM projects;

-- 3. Экспорт аудитов
SELECT 
    'audits' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'project_id', project_id,
            'user_id', user_id,
            'name', name,
            'type', type,
            'status', status,
            'input_data', input_data,
            'result_data', result_data,
            'context', context,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) as data
FROM audits;

-- 4. Экспорт истории аудитов
SELECT 
    'audit_history' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'audit_id', audit_id,
            'action_type', action_type,
            'input_data', input_data,
            'output_data', output_data,
            'created_at', created_at
        )
    ) as data
FROM audit_history;

-- 5. Экспорт результатов анализа
SELECT 
    'analysis_results' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'audit_id', audit_id,
            'result_type', result_type,
            'result_data', result_data,
            'status', status,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) as data
FROM analysis_results;

-- 6. Экспорт аннотаций
SELECT 
    'annotations' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'audit_id', audit_id,
            'user_id', user_id,
            'annotation_data', annotation_data,
            'created_at', created_at,
            'updated_at', updated_at
        )
    ) as data
FROM annotations;

-- 7. Экспорт метаданных файлов
SELECT 
    'storage_objects' as table_name,
    json_agg(
        json_build_object(
            'id', id,
            'user_id', user_id,
            'audit_id', audit_id,
            'file_name', file_name,
            'file_path', file_path,
            'file_size', file_size,
            'mime_type', mime_type,
            'created_at', created_at
        )
    ) as data
FROM storage_objects;

-- 8. Статистика по таблицам
SELECT 
    'statistics' as table_name,
    json_build_object(
        'profiles_count', (SELECT COUNT(*) FROM profiles),
        'projects_count', (SELECT COUNT(*) FROM projects),
        'audits_count', (SELECT COUNT(*) FROM audits),
        'audit_history_count', (SELECT COUNT(*) FROM audit_history),
        'analysis_results_count', (SELECT COUNT(*) FROM analysis_results),
        'annotations_count', (SELECT COUNT(*) FROM annotations),
        'storage_objects_count', (SELECT COUNT(*) FROM storage_objects),
        'export_date', NOW()
    ) as data;






