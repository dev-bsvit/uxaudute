#!/bin/bash

# 🚀 Скрипт для создания релиза
# Использование: ./scripts/release.sh [patch|minor|major] "Описание изменений"

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 UX Audit Release Script${NC}"

# Проверяем параметры
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Использование: ./scripts/release.sh [patch|minor|major] \"Описание изменений\"${NC}"
    exit 1
fi

BUMP_TYPE=$1
DESCRIPTION=$2

# Проверяем, что мы на main
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo -e "${YELLOW}⚠️  Переключаемся на main...${NC}"
    git checkout main
    git pull origin main
fi

# Получаем текущую версию
CURRENT_VERSION=$(git describe --tags --abbrev=0 2>/dev/null || echo "v0.0.0")
echo -e "${BLUE}📦 Текущая версия: $CURRENT_VERSION${NC}"

# Вычисляем новую версию
IFS='.' read -ra VERSION_PARTS <<< "${CURRENT_VERSION#v}"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $BUMP_TYPE in
    "major")
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
    "minor")
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    "patch")
        PATCH=$((PATCH + 1))
        ;;
    *)
        echo -e "${RED}❌ Неверный тип версии. Используйте: patch, minor, или major${NC}"
        exit 1
        ;;
esac

NEW_VERSION="v$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}🎯 Новая версия: $NEW_VERSION${NC}"

# Подтверждение
echo -e "${YELLOW}❓ Создать релиз $NEW_VERSION? (y/N)${NC}"
read -r CONFIRM
if [[ ! $CONFIRM =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Отменено${NC}"
    exit 1
fi

# Создаем тег
echo -e "${BLUE}🏷️  Создаем тег...${NC}"
git tag -a "$NEW_VERSION" -m "Версия $NEW_VERSION: $DESCRIPTION"

# Отправляем на GitHub
echo -e "${BLUE}📤 Отправляем на GitHub...${NC}"
git push origin main
git push origin "$NEW_VERSION"

# Обновляем stable
echo -e "${BLUE}🔒 Обновляем stable ветку...${NC}"
git checkout stable
git merge main
git push origin stable

# Возвращаемся на main
git checkout main

echo -e "${GREEN}✅ Релиз $NEW_VERSION успешно создан!${NC}"
echo -e "${BLUE}🌐 Проверьте деплой: https://uxaudute.vercel.app${NC}"
echo -e "${BLUE}📦 GitHub Release: https://github.com/dev-bsvit/uxaudute/releases/tag/$NEW_VERSION${NC}"
