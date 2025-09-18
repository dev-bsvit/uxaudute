-- Обновление цен пакетов кредитов
-- Версия: 1.5
-- Дата: 12.09.2025

-- Обновляем цены пакетов
UPDATE package_pricing 
SET 
    credits_amount = 10,
    price_rub = 19900,  -- $1.99 в копейках
    updated_at = NOW()
WHERE package_type = 'basic';

UPDATE package_pricing 
SET 
    credits_amount = 50,
    price_rub = 89900,  -- $8.99 в копейках
    updated_at = NOW()
WHERE package_type = 'pro';

UPDATE package_pricing 
SET 
    credits_amount = 200,
    price_rub = 299900, -- $29.99 в копейках
    updated_at = NOW()
WHERE package_type = 'team';

-- Проверяем результат
SELECT 
    package_type,
    credits_amount,
    price_rub,
    ROUND(price_rub / 100.0, 2) as price_usd
FROM package_pricing 
ORDER BY package_type;
