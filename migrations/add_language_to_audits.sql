-- =====================================================
-- Добавление поля language в таблицу audits
-- =====================================================
-- Дата: 02.10.2025
-- Описание: Добавляет поле для хранения языка анализа

-- Добавляем колонку language
ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Добавляем проверку на валидные значения
ALTER TABLE public.audits
ADD CONSTRAINT audits_language_check CHECK (language IN ('en', 'ru'));

-- Создаем индекс для поля language
CREATE INDEX IF NOT EXISTS idx_audits_language ON public.audits(language);

-- Добавляем комментарий к полю
COMMENT ON COLUMN public.audits.language IS 'Язык анализа: en - английский, ru - русский';

-- Обновляем существующие записи (если есть)
UPDATE public.audits SET language = 'en' WHERE language IS NULL;
