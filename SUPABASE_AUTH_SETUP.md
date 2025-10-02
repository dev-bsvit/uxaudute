# Настройка Supabase Auth

## 🔧 Настройка в Supabase Dashboard

### 1. Настройка Redirect URLs

Зайдите в **Supabase Dashboard** → **Authentication** → **URL Configuration**

Добавьте следующие URLs:

**Site URL:**
```
https://your-domain.vercel.app
```

**Redirect URLs:**
```
http://localhost:3000/dashboard
https://your-domain.vercel.app/dashboard
```

### 2. Настройка Google OAuth

В **Supabase Dashboard** → **Authentication** → **Providers**:

1. **Включите Google provider**
2. **Получите Google OAuth credentials:**
   
   a) Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
   
   b) Создайте новый проект или выберите существующий
   
   c) Включите **Google+ API** и **Google Identity**
   
   d) Перейдите в **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   
   e) **Application type**: Web application
   
   f) **Authorized redirect URIs**:
   ```
   https://zdgscvlfclqqtqshjcgi.supabase.co/auth/v1/callback
   ```
   
   g) Скопируйте **Client ID** и **Client Secret**

3. **В Supabase вставьте:**
   - Google Client ID
   - Google Client Secret

### 3. Email Templates (опционально)

В **Authentication** → **Email Templates** настройте:

- **Confirm signup**: перенаправление на `/dashboard`
- **Magic Link**: перенаправление на `/dashboard`
- **Change Email Address**: перенаправление на `/dashboard`

## 🚀 Проверка

1. **Локально**: `http://localhost:3000/dashboard`
2. **Продакшн**: `https://your-domain.vercel.app/dashboard`

## ⚠️ Важные моменты

1. **После настройки Google OAuth** пользователи смогут войти одним кликом
2. **Email подтверждение** больше не будет приходить на localhost
3. **Все редиректы** будут вести на `/dashboard`
4. **RLS политики** уже настроены в базе данных

## 🔐 Переменные окружения

Убедитесь, что в Vercel Environment Variables добавлены:

```env
NEXT_PUBLIC_SUPABASE_URL=https://zdgscvlfclqqtqshjcgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```












