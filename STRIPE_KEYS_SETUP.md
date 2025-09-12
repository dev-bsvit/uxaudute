# 🔑 Настройка Stripe ключей из Dashboard

## Из вашего Stripe Dashboard

У вас есть следующие ключи:
- **Publishable key**: `pk_test_51S6YAS340Mj5r...`
- **Secret key**: `sk_test_51S6YAS340Mj5r...`

## Пошаговая настройка

### 1. Получение полных ключей

1. **В Stripe Dashboard** нажмите на ключ чтобы скопировать полный ключ
2. **Publishable key** должен начинаться с `pk_test_` или `pk_live_`
3. **Secret key** должен начинаться с `sk_test_` или `sk_live_`

### 2. Добавление в Vercel

1. **Перейдите в Vercel Dashboard** → Ваш проект → Settings → Environment Variables

2. **Добавьте переменные**:
   ```
   STRIPE_SECRET_KEY=sk_test_51S6YAS340Mj5r... (полный ключ)
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S6YAS340Mj5r... (полный ключ)
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Для webhook** (позже):
   ```
   STRIPE_WEBHOOK_SECRET=whsec_... (будет получен при создании webhook)
   ```

### 3. Проверка настройки

После добавления ключей в Vercel:

1. **Перезапустите деплой** в Vercel
2. **Проверьте статус**:
   ```bash
   curl https://yourdomain.com/api/stripe/status
   ```

3. **Должно показать**:
   ```json
   {
     "environment": {
       "stripe_secret_key": true,
       "stripe_publishable_key": true,
       "app_url": true
     },
     "mode": {
       "secret_key_type": "test",
       "publishable_key_type": "test"
     }
   }
   ```

### 4. Создание Webhook

1. **В Stripe Dashboard** → Developers → Webhooks
2. **Add endpoint**:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`

3. **Скопируйте webhook secret** и добавьте в Vercel:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 5. Тестирование

1. **Перейдите на страницу кредитов**: `https://yourdomain.com/credits`
2. **Выберите пакет** и нажмите "Купить"
3. **Используйте тестовую карту**: `4242 4242 4242 4242`
4. **Проверьте начисление кредитов**

## Важные моменты

⚠️ **Безопасность**:
- Никогда не коммитьте ключи в код
- Используйте только переменные окружения
- Test ключи безопасны для разработки

✅ **Проверка**:
- Все ключи должны быть полными (не обрезанными)
- Webhook должен быть создан после настройки ключей
- Тестируйте с тестовыми картами

## Troubleshooting

### Ключи не работают
- Проверьте что ключи полные (не обрезанные)
- Убедитесь что переменные добавлены в Vercel
- Перезапустите деплой в Vercel

### Webhook не работает
- Проверьте URL webhook в Stripe
- Убедитесь что webhook secret добавлен в Vercel
- Проверьте логи в Stripe Dashboard

### Платежи не проходят
- Используйте тестовые карты
- Проверьте логи в Vercel Functions
- Проверьте статус в Stripe Dashboard
