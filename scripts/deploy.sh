#!/bin/bash

# 🚀 Прямой деплой на продакшн для UX Audit Platform
# Без локальных проверок - тестируем на проде

set -e

echo "🚀 Деплой на продакшн (тестируем на проде)"
echo "=========================================="

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Проверяем, что мы в правильной директории
if [ ! -f "package.json" ] || [ ! -f "next.config.js" ]; then
    echo -e "${RED}❌ Запустите скрипт из корневой директории проекта${NC}"
    exit 1
fi

print_info "Деплой на продакшн без локальных проверок..."
echo "============================================="

# Проверяем статус git
if ! git diff --quiet || ! git diff --cached --quiet; then
    print_warning "Есть незакоммиченные изменения. Коммитим их..."
    
    # Добавляем все изменения
    git add .
    
    # Создаем коммит с текущей датой
    commit_message="🚀 Deploy $(date '+%Y-%m-%d %H:%M:%S')"
    git commit -m "$commit_message"
    print_status 0 "Изменения закоммичены: $commit_message"
else
    print_info "Нет изменений для коммита"
fi

# Пушим в main ветку
print_info "Отправляем изменения в GitHub..."
git push origin development
print_status 0 "Изменения отправлены в GitHub"

print_info "Vercel автоматически начнет деплой..."
print_info "Отслеживайте прогресс: https://vercel.com/dashboard"

echo ""
echo "=========================================="
print_status 0 "🎉 Деплой инициирован!"
echo ""
print_info "Полезные ссылки:"
echo "• Production: https://uxaudute.vercel.app"
echo "• GitHub: https://github.com/dev-bsvit/uxaudute"
echo "• Vercel Dashboard: https://vercel.com/dashboard"
echo ""
print_info "Для проверки статуса деплоя:"
echo "curl -s https://uxaudute.vercel.app/api/health"
echo ""
print_warning "⚠️  Тестируем изменения на продакшне!"