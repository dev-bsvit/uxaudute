# Система онбординга новых пользователей

## Дата: 2025-10-27

## Описание
Реализована система регистрации с анкетированием для новых пользователей. При первом входе пользователь проходит 3-шаговый визард для сбора данных о роли, интересах и источнике перехода.

## Функционал

### Визард онбординга (3 шага):

**Шаг 1: Имя и роль**
- Поле ввода имени пользователя (только имя, без фамилии)
- Выбор роли из предложенных вариантов с иконками:
  - Дизайнер (Palette)
  - Исследователь (Search)
  - Маркетолог (TrendingUp)
  - Продакт-менеджер (LayoutGrid)
  - Основатель/CEO (Target)
  - Студент (GraduationCap)
  - Другое (User)

**Шаг 2: Интересы**
- Множественный выбор интересов:
  - UX анализ
  - A/B тест
  - Гипотезы
  - Бизнес-аналитика
  - Опросы
  - Метрики

**Шаг 3: Источник трафика**
- Единичный выбор источника:
  - LinkedIn
  - Telegram
  - Google
  - ChatGPT
  - YouTube
  - Instagram
  - Другое

### Особенности интерфейса:
- Split-screen дизайн: форма слева (50%), декоративное изображение справа (50%)
- Индикатор прогресса (1/3, 2/3, 3/3)
- Валидация на каждом шаге (кнопка "Далее" неактивна, пока не заполнены обязательные поля)
- Навигация: кнопки "Назад" и "Далее"
- Адаптивный дизайн (на мобильных убирается правая часть)

## Изменения в БД

### Новая таблица `user_onboarding`:

```sql
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT,
  role TEXT CHECK (role IN ('designer', 'researcher', 'marketer', 'product_manager', 'founder_ceo', 'student', 'other')),
  interests TEXT[] DEFAULT '{}',
  source TEXT CHECK (source IN ('linkedin', 'telegram', 'google', 'chatgpt', 'youtube', 'instagram', 'other')),
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- RLS политики для безопасности
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding data"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding data"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding data"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

-- Индексы для быстрого поиска
CREATE INDEX idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX idx_user_onboarding_completed ON user_onboarding(completed);
CREATE INDEX idx_user_onboarding_created_at ON user_onboarding(created_at);
```

### Применение миграции:

```bash
# В Supabase SQL Editor выполните файл:
supabase/migrations/create_user_onboarding.sql
```

## Изменения в коде

### 1. Компоненты визарда

**`src/components/onboarding/onboarding-wizard.tsx`**
- Главный компонент-оркестратор
- Управление состоянием формы (firstName, role, interests, source)
- Навигация между шагами
- Валидация перед переходом на следующий шаг

**`src/components/onboarding/step-1-personal.tsx`**
- Ввод имени (Input поле)
- Выбор роли (Grid с кнопками + иконками)

**`src/components/onboarding/step-2-interests.tsx`**
- Множественный выбор интересов
- Toggle функция для добавления/удаления

**`src/components/onboarding/step-3-source.tsx`**
- Единичный выбор источника трафика
- Grid с кнопками + иконками

**`src/components/onboarding/step-indicator.tsx`**
- Визуальный индикатор прогресса (1/3, 2/3, 3/3)

### 2. API эндпоинты

**`src/app/api/onboarding/route.ts`**
- POST: Сохранение данных анкеты в БД
- Отмечает анкету как `completed = true`
- Устанавливает `completed_at` timestamp

**`src/app/api/admin/onboarding/route.ts`**
- GET: Получение всех анкет для админ-панели
- Использует Service Role Key для обхода RLS
- Объединяет данные с таблицей profiles для получения email

### 3. Страницы

**`src/app/onboarding/page.tsx`**
- Страница онбординга с split-screen layout
- Отображает компонент OnboardingWizard
- После завершения:
  1. Сохраняет данные анкеты
  2. Начисляет 5 начальных кредитов
  3. Редиректит на /home

**`src/app/auth/callback/page.tsx`** (изменён)
- Проверяет статус онбординга после OAuth
- Если `completed = false` или записи нет → редирект на /onboarding
- Если `completed = true` → проверка баланса → редирект на /home

**`src/app/admin/page.tsx`** (добавлена новая вкладка)
- Вкладка "Анкеты" для просмотра всех заполненных анкет
- Отображает: имя, email, роль, интересы, источник, дату заполнения

## Интеграция с системой кредитов

После успешного заполнения анкеты автоматически начисляются 5 начальных кредитов:

```typescript
// В src/app/onboarding/page.tsx
const balanceResponse = await fetch('/api/ensure-user-balance', {
  method: 'POST',
  body: JSON.stringify({ userId })
})
```

**Важно:** Логика начисления проверяет наличие транзакции с описанием "Начальный баланс", чтобы избежать повторного начисления при повторных входах.

## Защита от дублирования

### На уровне БД:
- `UNIQUE(user_id)` - один пользователь может заполнить анкету только один раз

### На уровне кода:
- Проверка в `/auth/callback` - если анкета уже заполнена, пользователь не попадет на страницу онбординга
- API `/api/ensure-user-balance` проверяет наличие транзакции перед начислением кредитов

## Админ-панель

### Просмотр анкет:

Вкладка "Анкеты" в `/admin` отображает таблицу со всеми заполненными анкетами:

| Email | Имя | Роль | Интересы | Источник | Дата |
|-------|-----|------|----------|----------|------|
| user@example.com | Иван | designer | UX анализ, Опросы | linkedin | 27.10.2025 |

### SQL запрос для админов:

```sql
-- Все заполненные анкеты с email пользователей
SELECT
  uo.id,
  uo.first_name,
  uo.role,
  uo.interests,
  uo.source,
  uo.completed_at,
  p.email
FROM user_onboarding uo
LEFT JOIN profiles p ON p.id = uo.user_id
WHERE uo.completed = true
ORDER BY uo.created_at DESC;
```

## Мониторинг

### Незавершенные анкеты:

```sql
SELECT user_id, first_name, created_at
FROM user_onboarding
WHERE completed = false
ORDER BY created_at DESC;
```

### Статистика по источникам:

```sql
SELECT
  source,
  COUNT(*) as count
FROM user_onboarding
WHERE completed = true
GROUP BY source
ORDER BY count DESC;
```

### Статистика по ролям:

```sql
SELECT
  role,
  COUNT(*) as count
FROM user_onboarding
WHERE completed = true
GROUP BY role
ORDER BY count DESC;
```

### Популярные интересы:

```sql
SELECT
  unnest(interests) as interest,
  COUNT(*) as count
FROM user_onboarding
WHERE completed = true
GROUP BY interest
ORDER BY count DESC;
```

## Исправленные проблемы

### Проблема 1: Кредиты не начислялись
**Симптом:** Баланс оставался 0 после регистрации
**Причина:** Supabase trigger создавал запись с `balance=0`, старая логика думала что кредиты уже начислены
**Решение:** Изменена логика проверки - теперь ищем транзакцию с описанием "Начальный баланс" вместо проверки существования записи

### Проблема 2: Ошибка 500 в админ-панели
**Симптом:** Вкладка "Анкеты" показывала ошибку 500
**Причина:** Неправильный синтаксис JOIN в Supabase (`profiles!user_onboarding_user_id_fkey`)
**Решение:** Разделили на два запроса - сначала получаем анкеты, затем profiles, объединяем через Map

### Проблема 3: Изначально было 4 шага
**Симптом:** Пользователь хотел 3 шага, имя и роль в одном
**Решение:** Объединили Шаг 1 (имя) и Шаг 2 (роль) в один, удалили поле фамилии

## Преимущества

✅ **Сбор данных:**
- Понимание аудитории (роли, интересы)
- Отслеживание источников трафика
- Персонализация опыта

✅ **UX:**
- Простой 3-шаговый процесс
- Красивый split-screen дизайн
- Валидация на каждом шаге
- Мотивация через прогресс-бар

✅ **Безопасность:**
- RLS политики защищают данные
- Service Role Key только для админов
- Уникальность по user_id предотвращает дубли

✅ **Аналитика:**
- Легко строить отчеты по источникам
- Сегментация по ролям и интересам
- Мониторинг незавершенных анкет

## Тестирование

1. Зарегистрируйтесь как новый пользователь через Google OAuth
2. Проверьте редирект на `/onboarding`
3. Заполните все 3 шага анкеты
4. Проверьте что после завершения:
   - Данные сохранились в `user_onboarding`
   - Начислилось 5 кредитов
   - Появилась транзакция "Начальный баланс"
   - Редирект на `/home`
5. Выйдите и войдите снова - должен быть редирект сразу на `/home` (без онбординга)
6. Откройте `/admin` → вкладка "Анкеты" - проверьте что данные отображаются

## Файлы проекта

### Компоненты:
- `src/components/onboarding/onboarding-wizard.tsx`
- `src/components/onboarding/step-1-personal.tsx`
- `src/components/onboarding/step-2-interests.tsx`
- `src/components/onboarding/step-3-source.tsx`
- `src/components/onboarding/step-indicator.tsx`

### API:
- `src/app/api/onboarding/route.ts`
- `src/app/api/admin/onboarding/route.ts`
- `src/app/api/ensure-user-balance/route.ts` (изменён)

### Страницы:
- `src/app/onboarding/page.tsx`
- `src/app/auth/callback/page.tsx` (изменён)
- `src/app/admin/page.tsx` (добавлена вкладка)

### База данных:
- `supabase/migrations/create_user_onboarding.sql`

## Будущие улучшения

- [ ] Добавить реальные изображения вместо SVG placeholder
- [ ] A/B тестирование различных вариантов вопросов
- [ ] Экспорт данных анкет в CSV для анализа
- [ ] Email уведомление команде при новой регистрации
- [ ] Дополнительные поля (размер компании, отрасль)
