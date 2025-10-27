-- Скрипт для исправления баланса пользователя c50e5d25-6d82-4787-93c0-fcf4db20a33c
-- Этот пользователь застрял с balance=0 из-за того, что запись была создана триггером

-- Шаг 1: Проверяем текущий баланс
SELECT * FROM user_balances
WHERE user_id = 'c50e5d25-6d82-4787-93c0-fcf4db20a33c';

-- Шаг 2: Проверяем, есть ли транзакция начального баланса
SELECT * FROM transactions
WHERE user_id = 'c50e5d25-6d82-4787-93c0-fcf4db20a33c'
AND description LIKE '%Начальный баланс%';

-- Шаг 3: Если НЕТ транзакции начального баланса, начисляем 5 кредитов

-- Обновляем баланс
UPDATE user_balances
SET balance = 5
WHERE user_id = 'c50e5d25-6d82-4787-93c0-fcf4db20a33c';

-- Создаем транзакцию
INSERT INTO transactions (user_id, type, amount, balance_after, source, description)
VALUES (
  'c50e5d25-6d82-4787-93c0-fcf4db20a33c',
  'credit',
  5,
  5,
  'manual',
  'Добро пожаловать! Начальный баланс 5 кредитов'
);

-- Шаг 4: Проверяем результат
SELECT * FROM user_balances
WHERE user_id = 'c50e5d25-6d82-4787-93c0-fcf4db20a33c';

SELECT * FROM transactions
WHERE user_id = 'c50e5d25-6d82-4787-93c0-fcf4db20a33c'
ORDER BY created_at DESC
LIMIT 5;
