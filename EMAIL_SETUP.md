# Настройка Email уведомлений

## Текущая реализация

Email уведомления настроены, но сейчас работают в режиме логирования (выводят информацию в консоль).

При публикации статьи в блоге система автоматически отправляет уведомление пользователю через функцию `sendBlogPublishedEmail()` в `src/lib/email.ts`.

## Настройка Production Email

Для работы в production необходимо интегрировать один из email сервисов:

### Вариант 1: Resend (Рекомендуется)

**Почему Resend:**
- Современный API
- Простая интеграция
- Отличная доставляемость
- Бесплатный план: 3000 писем/месяц
- Красивые HTML шаблоны из коробки

**Шаги настройки:**

1. Зарегистрируйтесь на [resend.com](https://resend.com)

2. Получите API ключ в панели управления

3. Установите пакет:
```bash
npm install resend
```

4. Добавьте переменную окружения в `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

5. Раскомментируйте код в `src/lib/email.ts`:
```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendBlogPublishedEmail(data: BlogPublishedEmailData) {
  const { data: result, error } = await resend.emails.send({
    from: 'UX Audit <noreply@ux-audit.com>',
    to: data.userEmail,
    subject: 'Ваша статья опубликована в блоге UX Audit!',
    html: emailTemplate(data)
  })

  if (error) {
    console.error('❌ Ошибка отправки email:', error)
    return false
  }

  console.log('✅ Email отправлен:', result)
  return true
}
```

### Вариант 2: SendGrid

**Шаги настройки:**

1. Зарегистрируйтесь на [sendgrid.com](https://sendgrid.com)

2. Установите пакет:
```bash
npm install @sendgrid/mail
```

3. Добавьте переменную окружения:
```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
```

4. Обновите код в `src/lib/email.ts`:
```typescript
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY!)

export async function sendBlogPublishedEmail(data: BlogPublishedEmailData) {
  const msg = {
    to: data.userEmail,
    from: 'noreply@ux-audit.com',
    subject: 'Ваша статья опубликована в блоге UX Audit!',
    html: emailTemplate(data),
  }

  try {
    await sgMail.send(msg)
    console.log('✅ Email отправлен')
    return true
  } catch (error) {
    console.error('❌ Ошибка отправки email:', error)
    return false
  }
}
```

### Вариант 3: AWS SES

Для больших объёмов и минимальной стоимости.

## Настройка домена

Для профессионального вида писем настройте отправку с вашего домена:

1. В панели email-сервиса добавьте свой домен
2. Настройте DNS записи (SPF, DKIM, DMARC)
3. Дождитесь верификации домена
4. Измените `from` адрес на `noreply@ваш-домен.com`

## Тестирование

После настройки протестируйте отправку:

1. Создайте аудит с согласием на публикацию
2. Сгенерируйте статью
3. Опубликуйте статью
4. Проверьте email в консоли/почтовом ящике

## Дополнительные возможности

### Типы уведомлений для расширения:

1. **Новый комментарий к статье**
2. **Еженедельный дайджест популярных статей**
3. **Уведомление о новых статьях по категориям**
4. **Напоминание о незавершённых аудитах**

### Улучшения шаблонов:

- Используйте [React Email](https://react.email) для создания красивых шаблонов
- Добавьте социальные кнопки
- Персонализируйте контент на основе истории пользователя
- Добавьте A/B тестирование subject lines

## Мониторинг

Отслеживайте метрики email:
- Delivery rate (доставляемость)
- Open rate (открываемость)
- Click rate (кликабельность)
- Bounce rate (отказы)
- Unsubscribe rate (отписки)

## Compliance (Соответствие)

Убедитесь, что:
- Есть возможность отписаться от рассылки
- Хранится согласие пользователя на получение писем
- Соблюдаются GDPR/CAN-SPAM требования
