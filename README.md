# 🎯 UX Audit MVP - Готов к деплою на Vercel!

## 🚀 Деплой инструкция

### Шаг 1: Создайте GitHub репозиторий
1. Идите на github.com → Create new repository
2. Назовите: `ux-audit-mvp`
3. НЕ добавляйте README (он уже есть)

### Шаг 2: Загрузите код на GitHub
```bash
git remote add origin https://github.com/ваш-username/ux-audit-mvp.git
git branch -M main
git push -u origin main
```

### Шаг 3: Деплой на Vercel
1. Идите на vercel.com → Sign up with GitHub
2. Import project → выберите ваш репозиторий
3. Deploy!

### Шаг 4: Настройте переменные окружения в Vercel
В настройках проекта Vercel → Environment Variables добавьте:

```
NEXT_PUBLIC_SUPABASE_URL = https://zdgscvlfclqqtqshjcgi.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3NjdmxmY2xxcXRxc2hqY2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4MDMwNTMsImV4cCI6MjA3MjM3OTA1M30.z9AFsMGau2PeMilKO1ggzvp5iQhQkrUevrzl-vOTGRw
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkZ3NjdmxmY2xxcXRxc2hqY2dpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjgwMzA1MywiZXhwIjoyMDcyMzc5MDUzfQ.gcsVi-5VpPRTLL8qt-nQlWNr1isffbKlC0yyclHrb1Q
OPENAI_API_KEY = your_openai_api_key_here
```

## ✅ Что работает
- Полный UX Audit интерфейс 
- Реальный ИИ анализ через OpenAI
- База данных Supabase готова
- Все 5 действий настроены
- Адаптивный дизайн

## 🎯 После деплоя
1. Проверьте https://ваш-проект.vercel.app
2. Протестируйте "Начать исследование" 
3. Готово к использованию! 🚀

---
**Создано с помощью Cursor AI**