-- Создание таблиц для системы опросов

-- Таблица опросов
CREATE TABLE IF NOT EXISTS surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    name TEXT NOT NULL,
    description TEXT,
    screenshot_url TEXT,

    -- Статус опроса
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),

    -- Настройки опроса (JSON)
    settings JSONB NOT NULL DEFAULT '{
        "language": "ru",
        "show_progress": true,
        "allow_anonymous": true,
        "require_email": false,
        "show_branding": true
    }'::jsonb,

    -- Вопросы (массив JSON объектов)
    ai_questions JSONB DEFAULT '[]'::jsonb,
    selected_bank_questions JSONB DEFAULT '[]'::jsonb,
    main_questions JSONB DEFAULT '[]'::jsonb,
    additional_questions JSONB DEFAULT '[]'::jsonb,

    -- Статистика
    responses_count INTEGER DEFAULT 0,
    avg_completion_time DECIMAL,

    -- Метаданные
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- Таблица ответов на опросы
CREATE TABLE IF NOT EXISTS survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE NOT NULL,

    -- Ответы (массив JSON объектов)
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Информация о респонденте
    respondent_email TEXT,
    respondent_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Метрики времени
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    completion_time_seconds INTEGER,

    -- Метаданные
    user_agent TEXT,
    ip_address INET,
    country TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_surveys_user_id ON surveys(user_id);
CREATE INDEX IF NOT EXISTS idx_surveys_project_id ON surveys(project_id);
CREATE INDEX IF NOT EXISTS idx_surveys_status ON surveys(status);
CREATE INDEX IF NOT EXISTS idx_surveys_created_at ON surveys(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_survey_responses_survey_id ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_created_at ON survey_responses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_survey_responses_completed_at ON survey_responses(completed_at DESC);

-- Триггер для обновления updated_at
CREATE OR REPLACE FUNCTION update_surveys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER surveys_updated_at_trigger
    BEFORE UPDATE ON surveys
    FOR EACH ROW
    EXECUTE FUNCTION update_surveys_updated_at();

-- Функция для обновления счетчика ответов
CREATE OR REPLACE FUNCTION update_survey_responses_count()
RETURNS TRIGGER AS $$
BEGIN
    -- При добавлении нового ответа
    IF (TG_OP = 'INSERT') THEN
        UPDATE surveys
        SET responses_count = responses_count + 1
        WHERE id = NEW.survey_id;
        RETURN NEW;
    END IF;

    -- При удалении ответа
    IF (TG_OP = 'DELETE') THEN
        UPDATE surveys
        SET responses_count = GREATEST(0, responses_count - 1)
        WHERE id = OLD.survey_id;
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_responses_count_trigger
    AFTER INSERT OR DELETE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_responses_count();

-- Функция для обновления среднего времени прохождения
CREATE OR REPLACE FUNCTION update_survey_avg_completion_time()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем среднее время только для завершенных ответов
    IF (NEW.completed_at IS NOT NULL AND NEW.completion_time_seconds IS NOT NULL) THEN
        UPDATE surveys
        SET avg_completion_time = (
            SELECT AVG(completion_time_seconds)
            FROM survey_responses
            WHERE survey_id = NEW.survey_id
            AND completed_at IS NOT NULL
        )
        WHERE id = NEW.survey_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER survey_avg_completion_time_trigger
    AFTER INSERT OR UPDATE ON survey_responses
    FOR EACH ROW
    EXECUTE FUNCTION update_survey_avg_completion_time();

-- RLS (Row Level Security) политики
ALTER TABLE surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Политики для surveys
CREATE POLICY "Users can view their own surveys"
    ON surveys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own surveys"
    ON surveys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own surveys"
    ON surveys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own surveys"
    ON surveys FOR DELETE
    USING (auth.uid() = user_id);

-- Политики для survey_responses
-- Владельцы опроса могут видеть все ответы
CREATE POLICY "Survey owners can view responses"
    ON survey_responses FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_responses.survey_id
            AND surveys.user_id = auth.uid()
        )
    );

-- Анонимные пользователи могут создавать ответы для опубликованных опросов
CREATE POLICY "Anyone can create responses for published surveys"
    ON survey_responses FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM surveys
            WHERE surveys.id = survey_responses.survey_id
            AND surveys.status = 'published'
        )
    );

-- Пользователи могут видеть свои ответы
CREATE POLICY "Users can view their own responses"
    ON survey_responses FOR SELECT
    USING (auth.uid() = respondent_id);

-- Комментарии для документации
COMMENT ON TABLE surveys IS 'Опросы, созданные пользователями для сбора обратной связи';
COMMENT ON TABLE survey_responses IS 'Ответы респондентов на опросы';

COMMENT ON COLUMN surveys.ai_questions IS 'Вопросы, сгенерированные AI на основе скриншота (~20 вопросов)';
COMMENT ON COLUMN surveys.selected_bank_questions IS 'Вопросы из банка, признанные релевантными AI (~100 вопросов)';
COMMENT ON COLUMN surveys.main_questions IS 'Основной пул вопросов, показываемый в опросе';
COMMENT ON COLUMN surveys.additional_questions IS 'Дополнительный пул вопросов, доступный для добавления';
