# 🚀 Настройка Stripe в продакшене

## Пошаговая инструкция

### 1. Получение ключей Stripe (Production)

1. **Войдите в Stripe Dashboard**: https://dashboard.stripe.com/
2. **Переключитесь в Live режим** (включите переключатель в правом верхнем углу)
3. **Получите ключи**:
   - `STRIPE_SECRET_KEY` = `sk_live_...` (из Developers → API keys)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = `pk_live_...` (из Developers → API keys)

### 2. Настройка Webhook в Stripe

1. **Создайте Webhook Endpoint**:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

2. **Получите Webhook Secret**:
   - Скопируйте `whsec_...` из созданного webhook
   - Это будет `STRIPE_WEBHOOK_SECRET`

### 3. Настройка переменных в Vercel

1. **Перейдите в Vercel Dashboard** → Ваш проект → Settings → Environment Variables

2. **Добавьте переменные** (Production):
   ```
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

3. **Перезапустите деплой**:
   - Vercel автоматически перезапустит при изменении переменных

### 4. Проверка настройки

1. **Проверьте webhook**:
   ```bash
   curl -X POST https://yourdomain.com/api/stripe/webhook \
     -H "Content-Type: application/json" \
     -d '{"test": "webhook"}'
   ```

2. **Проверьте Payment Intent**:
   ```bash
   curl -X POST https://yourdomain.com/api/stripe/create-payment-intent \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"package_type": "basic", "credits_amount": 20, "price_rub": 2000}'
   ```

### 5. Тестирование в продакшене

#### Тестовые карты (Live режим)
```
Успешный платеж: 4242 4242 4242 4242
Неудачный платеж: 4000 0000 0000 0002
Требует 3D Secure: 4000 0025 0000 3155
```

#### Проверка платежей
1. **Stripe Dashboard** → Payments → проверьте созданные платежи
2. **База данных** → проверьте таблицы `payment_orders` и `transactions`
3. **Пользовательский интерфейс** → проверьте начисление кредитов

### 6. Мониторинг

#### Логи Stripe
- **Stripe Dashboard** → Developers → Logs
- **Webhook Logs** → проверьте успешность доставки

#### Логи приложения
- **Vercel Dashboard** → Functions → Logs
- **Supabase Dashboard** → Logs → проверьте ошибки

### 7. Безопасность

#### Проверка webhook
- Все webhook проверяются по подписи
- Используйте только HTTPS endpoints
- Храните webhook secret в переменных окружения

#### Проверка ключей
- Никогда не коммитьте live ключи в код
- Используйте только переменные окружения
- Регулярно ротируйте ключи

### 8. Troubleshooting

#### Webhook не работает
```bash
# Проверьте URL webhook
curl -I https://yourdomain.com/api/stripe/webhook

# Проверьте переменные окружения
echo $STRIPE_WEBHOOK_SECRET
```

#### Payment Intent не создается
```bash
# Проверьте ключи Stripe
curl -u sk_live_...: https://api.stripe.com/v1/payment_intents
```

#### Кредиты не начисляются
1. Проверьте webhook логи в Stripe
2. Проверьте логи приложения в Vercel
3. Проверьте базу данных в Supabase

### 9. Следующие шаги

1. **Мониторинг** - настройте алерты на ошибки
2. **Аналитика** - отслеживайте конверсию платежей
3. **Возвраты** - настройте обработку refunds
4. **Масштабирование** - оптимизируйте для высокой нагрузки

## Важные моменты

⚠️ **Внимание**: В live режиме все платежи реальные!
- Тестируйте сначала с небольшими суммами
- Убедитесь что webhook работает корректно
- Проверьте все сценарии платежей

✅ **Рекомендации**:
- Используйте мониторинг Stripe
- Настройте алерты на ошибки
- Ведите логи всех операций
- Регулярно проверяйте webhook статус
