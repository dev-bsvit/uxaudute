# 🌐 Руководство по локализации UX Audit Platform

## 📋 Алгоритм добавления нового языка

### **Шаг 1: Подготовка инфраструктуры**

#### 1.1 Обновить конфигурацию локалей
```typescript
// src/i18n/config.ts
export const locales = ['ru', 'ua', 'en', 'de'] as const // добавить новый язык
export type Locale = (typeof locales)[number]
```

#### 1.2 Создать файл переводов
```bash
# Скопировать базовый файл переводов
cp messages/ru.json messages/de.json

# Перевести содержимое на новый язык
```

#### 1.3 Обновить компоненты языка
```typescript
// src/components/language-select.tsx
const languages = [
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' } // добавить новый
]

// Обновить типы
const urlLocale = pathname.split('/')[1] as 'ru' | 'ua' | 'en' | 'de' | undefined
const actualLocale = urlLocale && ['ru', 'ua', 'en', 'de'].includes(urlLocale) ? urlLocale : locale
```

### **Шаг 2: Локализация навигации**

#### 2.1 Использовать правильный способ получения локали
```typescript
// ❌ Неправильно - может быть неточным
const locale = useLocale()

// ✅ Правильно - всегда точный
const pathname = usePathname()
const actualLocale = pathname.split('/')[1] || 'ru'
```

#### 2.2 Обновить все навигационные ссылки
```typescript
// ❌ Неправильно
href="/dashboard"

// ✅ Правильно
href={`/${actualLocale}/dashboard`}
```

#### 2.3 Использовать next/link для SPA навигации
```typescript
// ❌ Неправильно
<a href="/dashboard">Dashboard</a>

// ✅ Правильно
<Link href={`/${actualLocale}/dashboard`}>Dashboard</Link>
```

### **Шаг 3: Локализация контента**

#### 3.1 Добавить useTranslations в компонент
```typescript
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('sectionName')
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  )
}
```

#### 3.2 Заменить hardcoded тексты
```typescript
// ❌ Неправильно
<p>Текст на русском языке</p>

// ✅ Правильно
<p>{t('textKey')}</p>
```

#### 3.3 Добавить ключи в файлы переводов
```json
// messages/ru.json
{
  "sectionName": {
    "title": "Заголовок",
    "description": "Описание"
  }
}

// messages/de.json
{
  "sectionName": {
    "title": "Titel",
    "description": "Beschreibung"
  }
}
```

### **Шаг 4: Локализация AI промптов**

#### 4.1 Создать промпты на новом языке
```bash
# Основной промпт
cp prompts/основной-промпт.md prompts/main-prompt-de.md

# JSON структурированный промпт
cp prompts/json-structured-prompt-v2.md prompts/json-structured-prompt-de.md
```

#### 4.2 Обновить prompt-loader.ts
```typescript
export async function loadMainPrompt(locale: string = 'ru'): Promise<string> {
  let fileName = 'основной-промпт.md'
  if (locale === 'ua') fileName = 'основной-промпт-ua.md'
  else if (locale === 'en') fileName = 'main-prompt-en.md'
  else if (locale === 'de') fileName = 'main-prompt-de.md'
  
  const promptPath = join(process.cwd(), 'prompts', fileName)
  return readFileSync(promptPath, 'utf-8')
}
```

#### 4.3 Передать locale в API
```typescript
// В компонентах, которые вызывают AI
const response = await fetch('/api/research-with-credits', {
  method: 'POST',
  body: JSON.stringify({ 
    locale: params.locale, // передать текущую локаль
    // ... другие параметры
  })
})
```

### **Шаг 5: Тестирование и исправления**

#### 5.1 Проверить hardcoded ссылки
```bash
# Найти все hardcoded ссылки
grep -r "href=\"/" src/components/ | grep -v "actualLocale"
grep -r "href=\"/" src/app/ | grep -v "actualLocale"
```

#### 5.2 Проверить hardcoded тексты
```bash
# Найти все hardcoded тексты на русском
grep -r "\"[А-Яа-я]" src/components/ | grep -v "t("
grep -r "\"[А-Яа-я]" src/app/ | grep -v "t("
```

#### 5.3 Проверить лимиты токенов
```typescript
// Убедиться что max_tokens достаточно для полного JSON
max_tokens: 8000 // вместо 2000
```

#### 5.4 Добавить fallback для массивов
```typescript
// ❌ Неправильно
{items.map(item => ...)}

// ✅ Правильно
{(items || []).map(item => ...)}
```

## 🔧 Утилиты для локализации

### **Создать утилиты для работы с локалями**
```typescript
// src/lib/locale-utils.ts
export function getActualLocale(pathname: string): string {
  return pathname.split('/')[1] || 'ru'
}

export function createLocalizedHref(path: string, locale: string): string {
  return `/${locale}${path}`
}

export function isValidLocale(locale: string): boolean {
  return ['ru', 'ua', 'en', 'de'].includes(locale)
}
```

### **Создать типы для переводов**
```typescript
// src/types/translations.ts
export interface TranslationKeys {
  common: {
    loading: string
    error: string
    success: string
    // ...
  }
  navigation: {
    home: string
    dashboard: string
    // ...
  }
  // ...
}
```

## ⚠️ Частые ошибки и их решения

### **1. Неправильное получение локали**
```typescript
// ❌ Ошибка
const locale = useLocale() // может быть неправильным

// ✅ Решение
const pathname = usePathname()
const actualLocale = pathname.split('/')[1] || 'ru'
```

### **2. Hardcoded ссылки**
```typescript
// ❌ Ошибка
href="/dashboard"

// ✅ Решение
href={`/${actualLocale}/dashboard`}
```

### **3. Отсутствие fallback для массивов**
```typescript
// ❌ Ошибка
{items.map(item => ...)}

// ✅ Решение
{(items || []).map(item => ...)}
```

### **4. Недостаточные лимиты токенов**
```typescript
// ❌ Ошибка
max_tokens: 2000

// ✅ Решение
max_tokens: 8000
```

### **5. Забыли обновить типы**
```typescript
// ❌ Ошибка
const urlLocale = pathname.split('/')[1] as 'ru' | 'ua' | undefined

// ✅ Решение
const urlLocale = pathname.split('/')[1] as 'ru' | 'ua' | 'en' | 'de' | undefined
```

## 📝 Чек-лист для локализации раздела

### **🔧 Техническая подготовка**
- [ ] Добавить язык в `src/i18n/config.ts`
- [ ] Создать файл переводов `messages/{lang}.json`
- [ ] Обновить middleware для нового языка
- [ ] Проверить все hardcoded ссылки

### **🎨 Локализация компонентов**
- [ ] Добавить `useTranslations()` в компонент
- [ ] Заменить все hardcoded тексты на ключи переводов
- [ ] Добавить переводы в файлы локализации
- [ ] Проверить навигационные ссылки

### **🤖 Локализация AI (если применимо)**
- [ ] Создать промпты на новом языке
- [ ] Обновить `prompt-loader.ts`
- [ ] Передать `locale` в API endpoints
- [ ] Проверить лимиты токенов

### **🧪 Тестирование**
- [ ] Проверить все страницы на новом языке
- [ ] Убедиться что ссылки работают корректно
- [ ] Проверить что AI генерирует контент на правильном языке
- [ ] Протестировать все интерактивные элементы

## 🚀 Примеры использования

### **Добавление немецкого языка**
```bash
# 1. Обновить конфигурацию
# src/i18n/config.ts: locales = ['ru', 'ua', 'en', 'de']

# 2. Создать файл переводов
cp messages/ru.json messages/de.json

# 3. Обновить компоненты языка
# src/components/language-select.tsx: добавить { code: 'de', name: 'Deutsch', flag: '🇩🇪' }

# 4. Создать промпты
cp prompts/основной-промпт.md prompts/main-prompt-de.md
cp prompts/json-structured-prompt-v2.md prompts/json-structured-prompt-de.md

# 5. Обновить prompt-loader.ts
# Добавить поддержку 'de' в loadMainPrompt и loadJSONPromptV2

# 6. Протестировать
npm run build
```

### **Локализация нового компонента**
```typescript
// 1. Добавить useTranslations
import { useTranslations } from 'next-intl'
import { usePathname } from 'next/navigation'

export function NewComponent() {
  const t = useTranslations('newSection')
  const pathname = usePathname()
  const actualLocale = pathname.split('/')[1] || 'ru'
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <a href={`/${actualLocale}/path`}>{t('linkText')}</a>
    </div>
  )
}

// 2. Добавить переводы в messages/*.json
{
  "newSection": {
    "title": "Заголовок",
    "linkText": "Ссылка"
  }
}
```

Этот алгоритм поможет систематически локализовать любые разделы и добавить новые языки без повторения ошибок! 🚀
