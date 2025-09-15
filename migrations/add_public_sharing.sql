-- =====================================================
-- МИГРАЦИЯ: Добавление публичного доступа к аудитам
-- =====================================================
-- Версия: 1.3
-- Дата: 15.09.2025
-- Описание: Добавление возможности публичного просмотра аудитов

-- Добавляем поля для публичного доступа
ALTER TABLE public.audits 
ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_enabled BOOLEAN DEFAULT FALSE;

-- Создаем индекс для быстрого поиска по публичному токену
CREATE INDEX IF NOT EXISTS idx_audits_public_token ON public.audits(public_token) WHERE public_enabled = TRUE;

-- Добавляем комментарии к полям
COMMENT ON COLUMN public.audits.public_token IS 'Уникальный токен для публичного доступа к аудиту';
COMMENT ON COLUMN public.audits.public_enabled IS 'Включен ли публичный доступ к аудиту';

-- Проверяем результат
SELECT 'Public sharing fields added successfully' as status;
