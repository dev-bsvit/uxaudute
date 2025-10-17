-- Migration: Add credits tracking fields to audits table
-- Created: 2025-10-17
-- Description: Добавляем поля для отслеживания списания кредитов за аудиты

-- Добавляем новые поля в таблицу audits
ALTER TABLE audits
ADD COLUMN IF NOT EXISTS credits_deducted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS credits_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS credits_deducted_at TIMESTAMP WITH TIME ZONE;

-- Добавляем индекс для быстрого поиска несписанных аудитов
CREATE INDEX IF NOT EXISTS idx_audits_credits_deducted
ON audits(credits_deducted)
WHERE credits_deducted = false;

-- Добавляем комментарии к полям
COMMENT ON COLUMN audits.credits_deducted IS 'Флаг: были ли списаны кредиты за этот аудит';
COMMENT ON COLUMN audits.credits_amount IS 'Количество списанных кредитов (0 если еще не списаны)';
COMMENT ON COLUMN audits.credits_deducted_at IS 'Время списания кредитов';

-- Обновляем существующие завершенные аудиты (помечаем как списанные)
-- Это безопасно, так как они уже были выполнены
UPDATE audits
SET
  credits_deducted = true,
  credits_amount = 2, -- По умолчанию за базовый аудит
  credits_deducted_at = updated_at
WHERE status = 'completed'
  AND credits_deducted IS NULL;

-- Проверка: покажем сколько аудитов обновлено
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO updated_count
  FROM audits
  WHERE credits_deducted = true;

  RAISE NOTICE 'Migration completed. Updated % audits with credits_deducted flag', updated_count;
END $$;
