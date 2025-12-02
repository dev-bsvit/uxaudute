-- =====================================================
-- FIX TRANSACTIONS SOURCE CONSTRAINT
-- =====================================================
-- Дата: 02.12.2025
-- Описание: Добавить все используемые источники транзакций
-- =====================================================

-- 1. Удаляем старый constraint
ALTER TABLE public.transactions
DROP CONSTRAINT IF EXISTS transactions_source_check;

-- 2. Добавляем новый со всеми источниками
ALTER TABLE public.transactions
ADD CONSTRAINT transactions_source_check
CHECK (source IN ('initial', 'purchase', 'deduction', 'refund', 'admin', 'purchase_liqpay', 'manual', 'audit'));

-- 3. Вывод информации
DO $$
BEGIN
  RAISE NOTICE '=== CONSTRAINT ОБНОВЛЁН ===';
  RAISE NOTICE 'Добавлены источники: purchase_liqpay, manual, audit';
  RAISE NOTICE '================================';
END $$;
