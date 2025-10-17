-- Добавление колонки updated_at в таблицу user_balances
-- Эта колонка используется в RPC функциях add_credits и deduct_credits

ALTER TABLE user_balances
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Обновляем существующие записи
UPDATE user_balances
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Добавляем комментарий
COMMENT ON COLUMN user_balances.updated_at IS 'Время последнего обновления баланса';
