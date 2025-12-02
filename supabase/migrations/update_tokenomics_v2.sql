-- =====================================================
-- ОБНОВЛЕНИЕ ТОКЕНОМИКИ v2.0
-- =====================================================
-- Дата: 01.12.2025
-- Описание: Обновление стоимости аудитов и добавление новых типов
--
-- Изменения:
-- - ab_test: 3 → 1 кредит
-- - business: 4 → 1 кредит
-- + survey: 1 кредит (новый тип)
-- + all_audits: 4 кредита (новый тип - комбо всех 4 аудитов)
-- =====================================================

-- 1. Обновляем ab_test: 3 → 1 кредит
UPDATE public.audit_credits
SET
  credits_cost = 1,
  updated_at = NOW()
WHERE audit_type = 'ab_test' AND is_active = true;

-- 2. Обновляем business: 4 → 1 кредит
UPDATE public.audit_credits
SET
  credits_cost = 1,
  updated_at = NOW()
WHERE audit_type = 'business' AND is_active = true;

-- 3. Добавляем новый тип: survey (опросы) - 1 кредит
INSERT INTO public.audit_credits (audit_type, credits_cost, is_active)
VALUES ('survey', 1, true)
ON CONFLICT (audit_type, is_active)
DO UPDATE SET
  credits_cost = 1,
  updated_at = NOW();

-- 4. Добавляем новый тип: all_audits (все 4 аудита за раз) - 4 кредита
INSERT INTO public.audit_credits (audit_type, credits_cost, is_active)
VALUES ('all_audits', 4, true)
ON CONFLICT (audit_type, is_active)
DO UPDATE SET
  credits_cost = 4,
  updated_at = NOW();

-- 5. Показываем итоговую таблицу стоимости
DO $$
BEGIN
  RAISE NOTICE '=== ОБНОВЛЕННАЯ ТОКЕНОМИКА v2.0 ===';
  RAISE NOTICE 'research: 2 кредита (без изменений)';
  RAISE NOTICE 'ab_test: 1 кредит (было 3)';
  RAISE NOTICE 'business: 1 кредит (было 4)';
  RAISE NOTICE 'hypotheses: 1 кредит (без изменений)';
  RAISE NOTICE 'survey: 1 кредит (новый)';
  RAISE NOTICE 'all_audits: 4 кредита (новый)';
  RAISE NOTICE '====================================';
END $$;
