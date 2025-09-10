-- =====================================================
-- UX AUDIT PLATFORM - ПОЛНАЯ СХЕМА БАЗЫ ДАННЫХ
-- =====================================================
-- Версия: 1.0
-- Дата: 10.09.2025
-- Описание: Полная схема базы данных для восстановления

-- Включаем необходимые расширения
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. ТАБЛИЦА: profiles (Профили пользователей)
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);

-- =====================================================
-- 2. ТАБЛИЦА: projects (Проекты пользователей)
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    context TEXT, -- Контекст проекта для всех аудитов
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);

-- =====================================================
-- 3. ТАБЛИЦА: audits (Аудиты UX)
-- =====================================================
CREATE TABLE IF NOT EXISTS audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'research',
    status TEXT NOT NULL DEFAULT 'in_progress',
    input_data JSONB,
    result_data JSONB, -- Результат анализа ИИ
    context TEXT, -- Контекст конкретного аудита
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraints
    CONSTRAINT audits_type_check CHECK (type IN ('research', 'ab_test', 'usability_test', 'heuristic_evaluation')),
    CONSTRAINT audits_status_check CHECK (status IN ('in_progress', 'completed', 'failed', 'pending'))
);

-- Индексы для audits
CREATE INDEX IF NOT EXISTS idx_audits_project_id ON audits(project_id);
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON audits(user_id);
CREATE INDEX IF NOT EXISTS idx_audits_status ON audits(status);
CREATE INDEX IF NOT EXISTS idx_audits_type ON audits(type);
CREATE INDEX IF NOT EXISTS idx_audits_created_at ON audits(created_at);
CREATE INDEX IF NOT EXISTS idx_audits_input_data ON audits USING GIN(input_data);
CREATE INDEX IF NOT EXISTS idx_audits_result_data ON audits USING GIN(result_data);

-- =====================================================
-- 4. ТАБЛИЦА: audit_history (История действий)
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL,
    input_data JSONB,
    output_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraints
    CONSTRAINT audit_history_action_type_check CHECK (action_type IN ('research', 'ab_test', 'usability_test', 'heuristic_evaluation', 'annotation', 'export'))
);

-- Индексы для audit_history
CREATE INDEX IF NOT EXISTS idx_audit_history_audit_id ON audit_history(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_history_action_type ON audit_history(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_history_created_at ON audit_history(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_history_input_data ON audit_history USING GIN(input_data);
CREATE INDEX IF NOT EXISTS idx_audit_history_output_data ON audit_history USING GIN(output_data);

-- =====================================================
-- 5. ТАБЛИЦА: analysis_results (Результаты анализа)
-- =====================================================
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    result_type TEXT NOT NULL,
    result_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Check constraints
    CONSTRAINT analysis_results_result_type_check CHECK (result_type IN ('ab_test', 'hypotheses', 'ux_analysis', 'usability_test', 'heuristic_evaluation')),
    CONSTRAINT analysis_results_status_check CHECK (status IN ('pending', 'completed', 'failed', 'in_progress'))
);

-- Индексы для analysis_results
CREATE INDEX IF NOT EXISTS idx_analysis_results_audit_id ON analysis_results(audit_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_result_type ON analysis_results(result_type);
CREATE INDEX IF NOT EXISTS idx_analysis_results_status ON analysis_results(status);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);
CREATE INDEX IF NOT EXISTS idx_analysis_results_result_data ON analysis_results USING GIN(result_data);

-- =====================================================
-- 6. ТАБЛИЦА: annotations (Аннотации на скриншотах)
-- =====================================================
CREATE TABLE IF NOT EXISTS annotations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    annotation_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для annotations
CREATE INDEX IF NOT EXISTS idx_annotations_audit_id ON annotations(audit_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user_id ON annotations(user_id);
CREATE INDEX IF NOT EXISTS idx_annotations_created_at ON annotations(created_at);
CREATE INDEX IF NOT EXISTS idx_annotations_annotation_data ON annotations USING GIN(annotation_data);

-- =====================================================
-- 7. ТАБЛИЦА: storage_objects (Метаданные файлов)
-- =====================================================
CREATE TABLE IF NOT EXISTS storage_objects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    audit_id UUID REFERENCES audits(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    mime_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для storage_objects
CREATE INDEX IF NOT EXISTS idx_storage_objects_user_id ON storage_objects(user_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_audit_id ON storage_objects(audit_id);
CREATE INDEX IF NOT EXISTS idx_storage_objects_created_at ON storage_objects(created_at);

-- =====================================================
-- ТРИГГЕРЫ ДЛЯ ОБНОВЛЕНИЯ updated_at
-- =====================================================

-- Функция для обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для обновления updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at 
    BEFORE UPDATE ON audits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analysis_results_updated_at 
    BEFORE UPDATE ON analysis_results 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annotations_updated_at 
    BEFORE UPDATE ON annotations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) ПОЛИТИКИ
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_objects ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для projects
CREATE POLICY "Users can view own projects" ON projects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
    FOR DELETE USING (auth.uid() = user_id);

-- Политики для audits
CREATE POLICY "Users can view own audits" ON audits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audits" ON audits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audits" ON audits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audits" ON audits
    FOR DELETE USING (auth.uid() = user_id);

-- Политики для audit_history
CREATE POLICY "Users can view own audit history" ON audit_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE audits.id = audit_history.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own audit history" ON audit_history
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE audits.id = audit_history.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

-- Политики для analysis_results
CREATE POLICY "Users can view own analysis results" ON analysis_results
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE audits.id = analysis_results.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own analysis results" ON analysis_results
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE audits.id = analysis_results.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own analysis results" ON analysis_results
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM audits 
            WHERE audits.id = analysis_results.audit_id 
            AND audits.user_id = auth.uid()
        )
    );

-- Политики для annotations
CREATE POLICY "Users can view own annotations" ON annotations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annotations" ON annotations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annotations" ON annotations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annotations" ON annotations
    FOR DELETE USING (auth.uid() = user_id);

-- Политики для storage_objects
CREATE POLICY "Users can view own storage objects" ON storage_objects
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own storage objects" ON storage_objects
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own storage objects" ON storage_objects
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own storage objects" ON storage_objects
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- ФУНКЦИИ ДЛЯ РАБОТЫ С ДАННЫМИ
-- =====================================================

-- Функция для получения статистики пользователя
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'projects_count', (SELECT COUNT(*) FROM projects WHERE user_id = user_uuid),
        'audits_count', (SELECT COUNT(*) FROM audits WHERE user_id = user_uuid),
        'completed_audits', (SELECT COUNT(*) FROM audits WHERE user_id = user_uuid AND status = 'completed'),
        'total_annotations', (SELECT COUNT(*) FROM annotations WHERE user_id = user_uuid)
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Функция для очистки старых данных (опционально)
CREATE OR REPLACE FUNCTION cleanup_old_data(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Удаляем старые записи audit_history
    DELETE FROM audit_history 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- КОММЕНТАРИИ К ТАБЛИЦАМ И КОЛОНКАМ
-- =====================================================

COMMENT ON TABLE profiles IS 'Профили пользователей системы';
COMMENT ON COLUMN profiles.id IS 'Уникальный идентификатор пользователя';
COMMENT ON COLUMN profiles.email IS 'Email пользователя (уникальный)';
COMMENT ON COLUMN profiles.full_name IS 'Полное имя пользователя';
COMMENT ON COLUMN profiles.avatar_url IS 'URL аватара пользователя';

COMMENT ON TABLE projects IS 'Проекты пользователей для группировки аудитов';
COMMENT ON COLUMN projects.id IS 'Уникальный идентификатор проекта';
COMMENT ON COLUMN projects.user_id IS 'ID владельца проекта';
COMMENT ON COLUMN projects.name IS 'Название проекта';
COMMENT ON COLUMN projects.description IS 'Описание проекта';
COMMENT ON COLUMN projects.context IS 'Контекст проекта для всех аудитов';

COMMENT ON TABLE audits IS 'UX аудиты с результатами анализа';
COMMENT ON COLUMN audits.id IS 'Уникальный идентификатор аудита';
COMMENT ON COLUMN audits.project_id IS 'ID проекта, к которому принадлежит аудит';
COMMENT ON COLUMN audits.user_id IS 'ID владельца аудита';
COMMENT ON COLUMN audits.name IS 'Название аудита';
COMMENT ON COLUMN audits.type IS 'Тип аудита (research, ab_test, etc.)';
COMMENT ON COLUMN audits.status IS 'Статус аудита (in_progress, completed, failed)';
COMMENT ON COLUMN audits.input_data IS 'Входные данные (URL, скриншот, контекст)';
COMMENT ON COLUMN audits.result_data IS 'Результат анализа ИИ в JSON формате';
COMMENT ON COLUMN audits.context IS 'Контекст конкретного аудита';

COMMENT ON TABLE audit_history IS 'История действий с аудитами';
COMMENT ON COLUMN audit_history.id IS 'Уникальный идентификатор записи истории';
COMMENT ON COLUMN audit_history.audit_id IS 'ID аудита';
COMMENT ON COLUMN audit_history.action_type IS 'Тип действия';
COMMENT ON COLUMN audit_history.input_data IS 'Входные данные действия';
COMMENT ON COLUMN audit_history.output_data IS 'Результат действия';

COMMENT ON TABLE analysis_results IS 'Детальные результаты анализа';
COMMENT ON COLUMN analysis_results.id IS 'Уникальный идентификатор результата';
COMMENT ON COLUMN analysis_results.audit_id IS 'ID аудита';
COMMENT ON COLUMN analysis_results.result_type IS 'Тип результата анализа';
COMMENT ON COLUMN analysis_results.result_data IS 'Данные результата в JSON формате';
COMMENT ON COLUMN analysis_results.status IS 'Статус обработки результата';

COMMENT ON TABLE annotations IS 'Аннотации на скриншотах';
COMMENT ON COLUMN annotations.id IS 'Уникальный идентификатор аннотации';
COMMENT ON COLUMN annotations.audit_id IS 'ID аудита';
COMMENT ON COLUMN annotations.user_id IS 'ID пользователя';
COMMENT ON COLUMN annotations.annotation_data IS 'Данные аннотации в JSON формате';

COMMENT ON TABLE storage_objects IS 'Метаданные загруженных файлов';
COMMENT ON COLUMN storage_objects.id IS 'Уникальный идентификатор файла';
COMMENT ON COLUMN storage_objects.user_id IS 'ID владельца файла';
COMMENT ON COLUMN storage_objects.audit_id IS 'ID аудита (если привязан)';
COMMENT ON COLUMN storage_objects.file_name IS 'Имя файла';
COMMENT ON COLUMN storage_objects.file_path IS 'Путь к файлу в хранилище';
COMMENT ON COLUMN storage_objects.file_size IS 'Размер файла в байтах';
COMMENT ON COLUMN storage_objects.mime_type IS 'MIME тип файла';

-- =====================================================
-- ЗАВЕРШЕНИЕ
-- =====================================================

-- Выводим информацию о созданных объектах
SELECT 
    'Database schema created successfully' as status,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'audits', 'audit_history', 'analysis_results', 'annotations', 'storage_objects');
