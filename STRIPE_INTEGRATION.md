# 💳 Stripe интеграция для токеномики

## Обзор

Система токеномики интегрирована со Stripe для обработки реальных платежей за кредиты.

## Компоненты

### 1. API Endpoints

- **`/api/stripe/create-payment-intent`** - Создание Payment Intent
- **`/api/stripe/webhook`** - Обработка webhook от Stripe

### 2. Компоненты UI

- **`CreditsPurchase`** - Основной компонент покупки кредитов
- **`StripeCheckout`** - Компонент Stripe Checkout

### 3. Библиотеки

- **`/lib/stripe.ts`** - Конфигурация и утилиты Stripe

## Настройка

### 1. Переменные окружения (Production)

```bash
# Stripe (Production)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App (Production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 2. Webhook настройка (Production)

1. В Stripe Dashboard создайте webhook endpoint:
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `payment_intent.canceled`

2. Скопируйте webhook secret в переменную `STRIPE_WEBHOOK_SECRET`

### 3. Настройка в Vercel

1. Перейдите в Vercel Dashboard → Settings → Environment Variables
2. Добавьте переменные:
   - `STRIPE_SECRET_KEY` (Production)
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (Production)
   - `STRIPE_WEBHOOK_SECRET` (Production)
   - `NEXT_PUBLIC_APP_URL` (Production)

## Поток платежа

### 1. Создание заказа
```typescript
// Пользователь выбирает пакет
const response = await fetch('/api/stripe/create-payment-intent', {
  method: 'POST',
  body: JSON.stringify({
    package_id: 'basic',
    package_type: 'basic',
    credits_amount: 20,
    price_rub: 2000
  })
})
```

### 2. Payment Intent
```typescript
// Создается Payment Intent в Stripe
const paymentIntent = await stripe.paymentIntents.create({
  amount: 200000, // 2000 рублей в копейках
  currency: 'rub',
  metadata: {
    user_id: 'user-uuid',
    order_id: 'order-uuid',
    package_type: 'basic',
    credits_amount: '20'
  }
})
```

### 3. Обработка платежа
```typescript
// Пользователь вводит данные карты
const { error, paymentIntent } = await stripe.confirmPayment({
  elements,
  confirmParams: {
    return_url: 'https://yourdomain.com/credits?success=true'
  }
})
```

### 4. Webhook обработка
```typescript
// При успешном платеже webhook:
// 1. Обновляет статус заказа на 'paid'
// 2. Добавляет кредиты пользователю
// 3. Создает транзакцию
```

## Пакеты кредитов

| Пакет | Кредиты | Цена | Цена за кредит |
|-------|---------|------|----------------|
| Basic | 20      | 2000₽ | 100₽ |
| Pro   | 60      | 5000₽ | 83₽ |
| Team  | 200     | 15000₽ | 75₽ |

## Безопасность

### 1. Webhook проверка
- Все webhook проверяются по подписи
- Используется `STRIPE_WEBHOOK_SECRET`

### 2. Метаданные
- Payment Intent содержит метаданные для связи с заказом
- Все операции логируются в транзакциях

### 3. Идемпотентность
- Повторные webhook не создают дублирующие кредиты
- Используется `stripe_payment_intent_id` для проверки

## Тестирование

### 1. Тестовые карты Stripe
```
Успешный платеж: 4242 4242 4242 4242
Неудачный платеж: 4000 0000 0000 0002
Требует 3D Secure: 4000 0025 0000 3155
```

### 2. Тестовый режим
- Используйте `sk_test_` и `pk_test_` ключи
- Все платежи в тестовом режиме

## Мониторинг

### 1. Логи
- Все операции логируются в консоль
- Ошибки сохраняются в базу данных

### 2. Статусы заказов
- `pending` - Заказ создан
- `payment_pending` - Ожидает платеж
- `paid` - Платеж успешен
- `failed` - Платеж неудачен
- `canceled` - Платеж отменен

## Troubleshooting

### 1. Webhook не работает
- Проверьте URL webhook в Stripe Dashboard
- Убедитесь что `STRIPE_WEBHOOK_SECRET` правильный
- Проверьте логи сервера

### 2. Payment Intent не создается
- Проверьте `STRIPE_SECRET_KEY`
- Убедитесь что сумма в копейках (рубли * 100)

### 3. Кредиты не начисляются
- Проверьте webhook обработку
- Убедитесь что пользователь существует
- Проверьте логи транзакций

## Следующие шаги

1. **Production настройка** - Переход на live ключи Stripe
2. **Мониторинг** - Добавление алертов и метрик
3. **Аналитика** - Отчеты по продажам и конверсии
4. **Возвраты** - Обработка refunds и chargebacks
