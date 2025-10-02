-- =====================================================
-- ИМПОРТ ДАННЫХ В UX AUDIT PLATFORM
-- =====================================================
-- Выполните этот скрипт в Supabase SQL Editor для импорта данных
-- Замените данные в переменных на ваши экспортированные данные

-- ВНИМАНИЕ: Перед импортом убедитесь, что таблицы созданы!
-- Выполните сначала database_complete_schema.sql

-- =====================================================
-- ПЕРЕМЕННЫЕ С ДАННЫМИ (ЗАМЕНИТЕ НА ВАШИ ДАННЫЕ)
-- =====================================================

-- Пример данных (замените на ваши экспортированные данные)
-- В реальном использовании замените эти значения на данные из export_database_data.sql

-- 1. Импорт профилей
-- INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
-- VALUES 
--     ('uuid-1', 'user1@example.com', 'User One', null, NOW(), NOW()),
--     ('uuid-2', 'user2@example.com', 'User Two', null, NOW(), NOW());

-- 2. Импорт проектов
-- INSERT INTO projects (id, user_id, name, description, context, created_at, updated_at)
-- VALUES 
--     ('project-uuid-1', 'uuid-1', 'My Project', 'Project description', 'Project context', NOW(), NOW());

-- 3. Импорт аудитов
-- INSERT INTO audits (id, project_id, user_id, name, type, status, input_data, result_data, context, created_at, updated_at)
-- VALUES 
--     ('audit-uuid-1', 'project-uuid-1', 'uuid-1', 'My Audit', 'research', 'completed', '{"url": "https://example.com"}', '{"uxSurvey": {...}}', 'Audit context', NOW(), NOW());

-- =====================================================
-- ФУНКЦИЯ ДЛЯ ИМПОРТА JSON ДАННЫХ
-- =====================================================

-- Функция для импорта профилей из JSON
CREATE OR REPLACE FUNCTION import_profiles(profiles_json JSON)
RETURNS INTEGER AS $$
DECLARE
    profile_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR profile_record IN SELECT * FROM json_array_elements(profiles_json)
    LOOP
        INSERT INTO profiles (id, email, full_name, avatar_url, created_at, updated_at)
        VALUES (
            (profile_record->>'id')::UUID,
            profile_record->>'email',
            profile_record->>'full_name',
            profile_record->>'avatar_url',
            (profile_record->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (profile_record->>'updated_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            avatar_url = EXCLUDED.avatar_url,
            updated_at = EXCLUDED.updated_at;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта проектов из JSON
CREATE OR REPLACE FUNCTION import_projects(projects_json JSON)
RETURNS INTEGER AS $$
DECLARE
    project_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR project_record IN SELECT * FROM json_array_elements(projects_json)
    LOOP
        INSERT INTO projects (id, user_id, name, description, context, created_at, updated_at)
        VALUES (
            (project_record->>'id')::UUID,
            (project_record->>'user_id')::UUID,
            project_record->>'name',
            project_record->>'description',
            project_record->>'context',
            (project_record->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (project_record->>'updated_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            context = EXCLUDED.context,
            updated_at = EXCLUDED.updated_at;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта аудитов из JSON
CREATE OR REPLACE FUNCTION import_audits(audits_json JSON)
RETURNS INTEGER AS $$
DECLARE
    audit_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR audit_record IN SELECT * FROM json_array_elements(audits_json)
    LOOP
        INSERT INTO audits (id, project_id, user_id, name, type, status, input_data, result_data, context, created_at, updated_at)
        VALUES (
            (audit_record->>'id')::UUID,
            (audit_record->>'project_id')::UUID,
            (audit_record->>'user_id')::UUID,
            audit_record->>'name',
            audit_record->>'type',
            audit_record->>'status',
            (audit_record->>'input_data')::JSONB,
            (audit_record->>'result_data')::JSONB,
            audit_record->>'context',
            (audit_record->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (audit_record->>'updated_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            type = EXCLUDED.type,
            status = EXCLUDED.status,
            input_data = EXCLUDED.input_data,
            result_data = EXCLUDED.result_data,
            context = EXCLUDED.context,
            updated_at = EXCLUDED.updated_at;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта истории аудитов из JSON
CREATE OR REPLACE FUNCTION import_audit_history(history_json JSON)
RETURNS INTEGER AS $$
DECLARE
    history_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR history_record IN SELECT * FROM json_array_elements(history_json)
    LOOP
        INSERT INTO audit_history (id, audit_id, action_type, input_data, output_data, created_at)
        VALUES (
            (history_record->>'id')::UUID,
            (history_record->>'audit_id')::UUID,
            history_record->>'action_type',
            (history_record->>'input_data')::JSONB,
            (history_record->>'output_data')::JSONB,
            (history_record->>'created_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO NOTHING;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта результатов анализа из JSON
CREATE OR REPLACE FUNCTION import_analysis_results(results_json JSON)
RETURNS INTEGER AS $$
DECLARE
    result_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR result_record IN SELECT * FROM json_array_elements(results_json)
    LOOP
        INSERT INTO analysis_results (id, audit_id, result_type, result_data, status, created_at, updated_at)
        VALUES (
            (result_record->>'id')::UUID,
            (result_record->>'audit_id')::UUID,
            result_record->>'result_type',
            (result_record->>'result_data')::JSONB,
            result_record->>'status',
            (result_record->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (result_record->>'updated_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            result_type = EXCLUDED.result_type,
            result_data = EXCLUDED.result_data,
            status = EXCLUDED.status,
            updated_at = EXCLUDED.updated_at;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта аннотаций из JSON
CREATE OR REPLACE FUNCTION import_annotations(annotations_json JSON)
RETURNS INTEGER AS $$
DECLARE
    annotation_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR annotation_record IN SELECT * FROM json_array_elements(annotations_json)
    LOOP
        INSERT INTO annotations (id, audit_id, user_id, annotation_data, created_at, updated_at)
        VALUES (
            (annotation_record->>'id')::UUID,
            (annotation_record->>'audit_id')::UUID,
            (annotation_record->>'user_id')::UUID,
            (annotation_record->>'annotation_data')::JSONB,
            (annotation_record->>'created_at')::TIMESTAMP WITH TIME ZONE,
            (annotation_record->>'updated_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            annotation_data = EXCLUDED.annotation_data,
            updated_at = EXCLUDED.updated_at;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- Функция для импорта метаданных файлов из JSON
CREATE OR REPLACE FUNCTION import_storage_objects(storage_json JSON)
RETURNS INTEGER AS $$
DECLARE
    storage_record JSON;
    imported_count INTEGER := 0;
BEGIN
    FOR storage_record IN SELECT * FROM json_array_elements(storage_json)
    LOOP
        INSERT INTO storage_objects (id, user_id, audit_id, file_name, file_path, file_size, mime_type, created_at)
        VALUES (
            (storage_record->>'id')::UUID,
            (storage_record->>'user_id')::UUID,
            (storage_record->>'audit_id')::UUID,
            storage_record->>'file_name',
            storage_record->>'file_path',
            (storage_record->>'file_size')::BIGINT,
            storage_record->>'mime_type',
            (storage_record->>'created_at')::TIMESTAMP WITH TIME ZONE
        )
        ON CONFLICT (id) DO UPDATE SET
            file_name = EXCLUDED.file_name,
            file_path = EXCLUDED.file_path,
            file_size = EXCLUDED.file_size,
            mime_type = EXCLUDED.mime_type;
        
        imported_count := imported_count + 1;
    END LOOP;
    
    RETURN imported_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ПРИМЕР ИСПОЛЬЗОВАНИЯ
-- =====================================================

-- Пример импорта данных (раскомментируйте и замените на ваши данные):

-- -- Импорт профилей
-- SELECT import_profiles('[
--     {
--         "id": "uuid-1",
--         "email": "user1@example.com",
--         "full_name": "User One",
--         "avatar_url": null,
--         "created_at": "2025-01-10T10:00:00Z",
--         "updated_at": "2025-01-10T10:00:00Z"
--     }
-- ]'::JSON);

-- -- Импорт проектов
-- SELECT import_projects('[
--     {
--         "id": "project-uuid-1",
--         "user_id": "uuid-1",
--         "name": "My Project",
--         "description": "Project description",
--         "context": "Project context",
--         "created_at": "2025-01-10T10:00:00Z",
--         "updated_at": "2025-01-10T10:00:00Z"
--     }
-- ]'::JSON);

-- -- Импорт аудитов
-- SELECT import_audits('[
--     {
--         "id": "audit-uuid-1",
--         "project_id": "project-uuid-1",
--         "user_id": "uuid-1",
--         "name": "My Audit",
--         "type": "research",
--         "status": "completed",
--         "input_data": {"url": "https://example.com"},
--         "result_data": {"uxSurvey": {}},
--         "context": "Audit context",
--         "created_at": "2025-01-10T10:00:00Z",
--         "updated_at": "2025-01-10T10:00:00Z"
--     }
-- ]'::JSON);

-- =====================================================
-- ПРОВЕРКА ИМПОРТА
-- =====================================================

-- Проверяем количество записей в каждой таблице
SELECT 
    'profiles' as table_name,
    COUNT(*) as record_count
FROM profiles
UNION ALL
SELECT 
    'projects' as table_name,
    COUNT(*) as record_count
FROM projects
UNION ALL
SELECT 
    'audits' as table_name,
    COUNT(*) as record_count
FROM audits
UNION ALL
SELECT 
    'audit_history' as table_name,
    COUNT(*) as record_count
FROM audit_history
UNION ALL
SELECT 
    'analysis_results' as table_name,
    COUNT(*) as record_count
FROM analysis_results
UNION ALL
SELECT 
    'annotations' as table_name,
    COUNT(*) as record_count
FROM annotations
UNION ALL
SELECT 
    'storage_objects' as table_name,
    COUNT(*) as record_count
FROM storage_objects;










