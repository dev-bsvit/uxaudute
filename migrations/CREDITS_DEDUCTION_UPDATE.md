# Обновление системы списания кредитов

## Дата: 2025-10-17

## Проблема
Предыдущая система списывала кредиты сразу, что приводило к:
- Списанию кредитов за неуспешные аудиты
- Возможности двойного списания
- Отсутствию возможности повторить списание при ошибке

## Решение
Реализована система **отложенного списания с флагом**:
1. Проверка баланса → Есть кредиты?
2. Запуск аудита → AI анализ
3. Сохранение в БД → `audits` (credits_deducted = false)
4. Проверка сохранения → Запись существует?
5. Списание кредитов → `safeDeductCreditsForAudit()`
6. Обновление флага → UPDATE audits SET credits_deducted = true

## Изменения в БД

### Новые поля в таблице `audits`:
```sql
credits_deducted BOOLEAN DEFAULT false    -- Флаг: списаны ли кредиты
credits_amount INTEGER DEFAULT 0          -- Количество списанных кредитов
credits_deducted_at TIMESTAMP            -- Время списания
```

### Применение миграции:
```bash
# В Supabase SQL Editor выполните:
psql -f migrations/add_credits_tracking_to_audits.sql
```

## Изменения в коде

### 1. Новая функция `safeDeductCreditsForAudit()` в `src/lib/credits.ts`:
- Проверяет флаг `credits_deducted` (предотвращает двойное списание)
- Проверяет статус аудита (списывает только за completed)
- Обновляет флаг после успешного списания

### 2. Обновлён API endpoint `src/app/api/research-with-credits/route.ts`:
- Использует `safeDeductCreditsForAudit()` вместо `deductCreditsForAudit()`
- Возвращает ошибку 402, если списание не удалось (с сохранёнными данными аудита)

## Преимущества

✅ **Надёжность:**
- Списываем только за реально сохранённые аудиты
- Невозможно списать за неуспешный аудит
- Защита от двойного списания

✅ **Безопасность:**
- Транзакционность: аудит сохранён → кредиты списаны
- Идемпотентность: можно повторно вызывать без риска

✅ **Масштабируемость:**
- Легко добавить фоновую задачу для повторных попыток
- Мониторинг: `SELECT * FROM audits WHERE credits_deducted = false`
- Подходит для микросервисной архитектуры

## Мониторинг

### Проверить несписанные кредиты:
```sql
SELECT id, user_id, created_at, status, credits_amount
FROM audits
WHERE credits_deducted = false
  AND status = 'completed'
ORDER BY created_at DESC;
```

### Статистика списаний:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_audits,
  COUNT(*) FILTER (WHERE credits_deducted = true) as credits_deducted,
  COUNT(*) FILTER (WHERE credits_deducted = false) as pending_deduction
FROM audits
WHERE status = 'completed'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Откат (если нужно)

Если нужно вернуться к старой системе:

1. В API верните `deductCreditsForAudit()`
2. Удалите поля из БД:
```sql
ALTER TABLE audits
DROP COLUMN IF EXISTS credits_deducted,
DROP COLUMN IF EXISTS credits_amount,
DROP COLUMN IF EXISTS credits_deducted_at;
```

## Тестирование

1. Создайте тестовый аудит
2. Проверьте что `credits_deducted = false` после сохранения
3. Проверьте что кредиты списались
4. Проверьте что `credits_deducted = true` после списания
5. Попробуйте повторно списать - должно вернуть "already deducted"
