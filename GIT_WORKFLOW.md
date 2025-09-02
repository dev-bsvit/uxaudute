# 🌳 Git Workflow - Система Версионирования

## 📋 Структура веток

### 🎯 **main** (Production)
- **Назначение**: Стабильные релизы, подключен к Vercel
- **Статус**: Всегда рабочая версия
- **Деплой**: Автоматический на https://uxaudute.vercel.app

### 🔒 **stable** (Stable Releases)
- **Назначение**: Проверенные стабильные версии
- **Использование**: Для отката к последней рабочей версии
- **Обновление**: После тестирования main

### 🚧 **development** (Development)
- **Назначение**: Активная разработка новых функций
- **Использование**: Эксперименты, новые фичи, тестирование
- **Статус**: Может быть нестабильной

## 🏷️ Система тегов

### Формат версий: `v{MAJOR}.{MINOR}.{PATCH}`

- **MAJOR**: Крупные изменения, несовместимые API
- **MINOR**: Новые функции, совместимые изменения  
- **PATCH**: Исправления багов

### Текущие версии:
- **v1.1.0** - Текущая стабильная (авторизация + UI улучшения)
- **v1.0.0** - Первый полнофункциональный релиз

## 🔄 Рабочий процесс

### 1. **Разработка новых функций**
```bash
# Переходим на development
git checkout development
git pull origin development

# Создаем ветку для функции
git checkout -b feature/new-feature-name

# Разрабатываем...
git add .
git commit -m "✨ Добавлена новая функция"

# Отправляем на GitHub
git push origin feature/new-feature-name
```

### 2. **Тестирование и интеграция**
```bash
# Переходим на development
git checkout development

# Мержим функцию
git merge feature/new-feature-name

# Тестируем локально
npm run dev

# Если все ОК, отправляем
git push origin development
```

### 3. **Релиз в production**
```bash
# Переходим на main
git checkout main

# Мержим стабильную разработку
git merge development

# Создаем тег новой версии
git tag -a v1.2.0 -m "Версия 1.2.0: Описание изменений"

# Отправляем main (автоматический деплой)
git push origin main
git push origin v1.2.0

# Обновляем stable
git checkout stable
git merge main
git push origin stable
```

## 🚨 Откат к стабильной версии

### Если что-то сломалось в production:

```bash
# Быстрый откат main к stable
git checkout main
git reset --hard stable
git push origin main --force

# Или откат к конкретной версии
git checkout main
git reset --hard v1.1.0
git push origin main --force
```

## 📦 Создание релиза

### На GitHub:
1. Перейти в **Releases** → **Create a new release**
2. Выбрать тег (например `v1.2.0`)
3. Название: `Version 1.2.0`
4. Описать изменения:
   - ✨ **Новые функции**
   - 🐛 **Исправления**
   - 🎨 **Улучшения UI**
   - 🔧 **Технические изменения**

## 🎯 Команды для быстрого доступа

```bash
# Посмотреть все ветки
git branch -a

# Посмотреть все теги
git tag -l

# Переключиться на стабильную версию
git checkout stable

# Посмотреть историю коммитов
git log --oneline --graph --all

# Сравнить ветки
git diff main..development

# Откат файла к стабильной версии
git checkout stable -- path/to/file.tsx
```

## 📝 Соглашения о коммитах

### Используем эмодзи префиксы:

- ✨ `:sparkles:` - Новая функция
- 🐛 `:bug:` - Исправление бага
- 🎨 `:art:` - Улучшение UI/UX
- 🔧 `:wrench:` - Конфигурация/настройка
- 📦 `:package:` - Обновление зависимостей
- 🚀 `:rocket:` - Деплой/релиз
- 📝 `:memo:` - Документация
- 🔥 `:fire:` - Удаление кода
- ♻️ `:recycle:` - Рефакторинг
- 🔒 `:lock:` - Безопасность

## 🛡️ Защита веток

На GitHub настроены правила:
- **main**: Только через PR, обязательные проверки
- **stable**: Только администраторы
- **development**: Свободная разработка

---

## 📞 Контакты
- **Репозиторий**: https://github.com/dev-bsvit/uxaudute
- **Продакшн**: https://uxaudute.vercel.app
- **Документация**: Этот файл
