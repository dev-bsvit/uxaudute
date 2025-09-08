# 📋 Шпаргалка команд - UX Audit Platform

> **Быстрый доступ к командам для работы с проектом**

## 🚀 Основные команды

### **Навигация:**
```bash
# Переход в проект
cd "/Users/bsvit/Documents/Мои разроботки/UX_AUDIT/ux-audit"

# Проверка текущей директории
pwd

# Список файлов
ls -la
```

### **Git операции:**
```bash
# Статус репозитория
git status

# Просмотр изменений
git diff
git diff --staged

# Добавление файлов
git add .
git add src/components/layout.tsx

# Коммит
git commit -m "📝 Описание изменений"
git commit -m "🐛 Исправлен баг в навигации"
git commit -m "✨ Добавлена новая функция"

# Пуш в GitHub
git push origin main
git push origin development

# Просмотр истории
git log --oneline -5
git log --oneline -10

# Ветки
git branch -a
git checkout development
git checkout main
```

### **NPM команды:**
```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev

# Сборка проекта
npm run build

# Запуск продакшн версии
npm start

# Линтинг
npm run lint
```

### **Проверка приложения:**
```bash
# Проверка здоровья API (если запущено локально)
curl -s http://localhost:3000/api/health

# Проверка переменных окружения
curl -s http://localhost:3000/api/debug

# Проверка авторизации
curl -s http://localhost:3000/api/auth-test

# Остановка локального сервера
pkill -f "next dev"
```

## 🔧 Полезные команды

### **Поиск в коде:**
```bash
# Поиск текста в файлах
grep -r "Главная" src/
grep -r "navigation" src/
grep -r "href" src/components/

# Поиск файлов
find src/ -name "*.tsx" -type f
find src/ -name "*layout*" -type f
```

### **Проверка файлов:**
```bash
# Просмотр содержимого файла
cat src/components/layout.tsx
head -20 src/components/layout.tsx
tail -10 src/components/layout.tsx

# Размер файлов
du -sh src/
du -sh node_modules/
```

### **Системные команды:**
```bash
# Процессы Node.js
ps aux | grep node
ps aux | grep next

# Порт 3000
lsof -i :3000
netstat -an | grep 3000

# Очистка кеша
rm -rf .next/
rm -rf node_modules/
npm install
```

## 📊 Мониторинг

### **Проверка статуса:**
```bash
# Git статус
git status
git log --oneline -3

# Размер проекта
du -sh .

# Зависимости
npm list --depth=0
```

### **Логи:**
```bash
# Логи npm
ls ~/.npm/_logs/

# Последний лог
tail -f ~/.npm/_logs/$(ls -t ~/.npm/_logs/ | head -1)
```

## 🚨 Аварийные команды

### **Сброс изменений:**
```bash
# Отмена изменений в файле
git checkout -- src/components/layout.tsx

# Отмена всех изменений
git reset --hard HEAD

# Отмена последнего коммита
git reset --soft HEAD~1
```

### **Очистка:**
```bash
# Очистка кеша Next.js
rm -rf .next/

# Очистка node_modules
rm -rf node_modules/
npm install

# Очистка Git
git clean -fd
```

## 📝 Шаблоны коммитов

```bash
# Новые функции
git commit -m "✨ Добавлена функция экспорта отчетов"
git commit -m "🎨 Улучшен дизайн навигации"

# Исправления
git commit -m "🐛 Исправлена ошибка в API"
git commit -m "🔧 Исправлена типизация TypeScript"

# Документация
git commit -m "📝 Обновлена документация API"
git commit -m "📚 Добавлен QUICKSTART_GUIDE"

# Рефакторинг
git commit -m "♻️ Рефакторинг компонента навигации"
git commit -m "🔨 Улучшена структура кода"

# Настройка
git commit -m "⚙️ Обновлены переменные окружения"
git commit -m "🔧 Настроена конфигурация Vercel"
```

## 🎯 Быстрые задачи

### **Добавить новую страницу:**
```bash
# 1. Создать файл
touch src/app/new-page/page.tsx

# 2. Добавить в навигацию
# Редактировать src/components/layout.tsx

# 3. Закоммитить
git add .
git commit -m "✨ Добавлена страница new-page"
git push origin main
```

### **Исправить баг:**
```bash
# 1. Найти проблему
grep -r "ошибка" src/

# 2. Исправить файл
# Редактировать файл

# 3. Протестировать
npm run dev

# 4. Закоммитить
git add .
git commit -m "🐛 Исправлен баг в компоненте"
git push origin main
```

---

*Шпаргалка обновляется при добавлении новых команд*



