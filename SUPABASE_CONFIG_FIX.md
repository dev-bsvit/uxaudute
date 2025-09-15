# 🔧 Исправление конфигурации Supabase

## Проблема
Обнаружена проблема с ключами Supabase в файле `.env.local`:
- Ключи обрезаны (207 и 218 символов вместо ~2000)
- Ошибка "Invalid API key" при попытке подключения

## Решение

### 1. Получить правильные ключи из Supabase Dashboard

1. Перейдите в [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите проект `zdgscvlfclqqtqshjcgi`
3. Перейдите в Settings → API
4. Скопируйте:
   - **Project URL**: `https://zdgscvlfclqqtqshjcgi.supabase.co`
   - **anon public key**: (длинный ключ ~2000 символов)
   - **service_role secret key**: (длинный ключ ~2000 символов)

### 2. Обновить .env.local

Замените содержимое файла `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zdgscvlfclqqtqshjcgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3NjdmxmY2xxcXRxc2hqY2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY2NzQ0MzQsImV4cCI6MjA1MjI1MDQzNH0.ПОЛНЫЙ_КЛЮЧ_ЗДЕСЬ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3NjdmxmY2xxcXRxc2hqY2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNjY3NDQzNCwiZXhwIjoyMDUyMjUwNDM0fQ.ПОЛНЫЙ_КЛЮЧ_ЗДЕСЬ
OPENROUTER_API_KEY=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
```

### 3. Проверить исправление

После обновления ключей:

```bash
# Перезапустить сервер
npm run dev

# Проверить подключение
curl -s "http://localhost:3000/api/test-supabase-connection" | jq '.'

# Проверить токеномику
curl -s "http://localhost:3000/api/test-tokens-simple" | jq '.'
```

### 4. Ожидаемый результат

После исправления должны получить:

```json
{
  "success": true,
  "message": "Supabase connection test completed",
  "results": {
    "anonKeyTest": {
      "data": [...],
      "error": null
    },
    "serviceKeyTest": {
      "data": [...],
      "error": null
    }
  }
}
```

## Альтернативное решение

Если нет доступа к Supabase Dashboard, можно:

1. Создать новый проект Supabase
2. Скопировать схему базы данных из `database_complete_schema.sql`
3. Обновить ключи в `.env.local`

## Статус

- ✅ Схема токеномики создана
- ✅ API endpoints готовы
- ✅ Код исправлен для fallback
- ⚠️ Требуется обновление ключей Supabase

