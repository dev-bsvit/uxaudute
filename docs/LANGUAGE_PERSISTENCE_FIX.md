# Исправление проблем с сохранением языка

## Проблемы, которые были исправлены:

### 1. ❌ Язык сбрасывается при переходе между страницами
**Причина:** LanguageProvider каждый раз заново инициализировался и не проверял сохраненный язык в localStorage.

**Решение:**
- Добавлена функция `getSavedLanguage()` для проверки localStorage
- Изменена логика инициализации: сначала проверяется сохраненный язык, затем автоопределение
- Улучшено логирование для отслеживания процесса

### 2. ❌ Экран загрузки появляется при каждом переходе
**Причина:** `SmoothLanguageInitializer` показывал экран загрузки при каждой инициализации.

**Решение:**
- Добавлен флаг `hasInitialized` и проверка `sessionStorage`
- Экран загрузки показывается только при первой инициализации в сессии
- Уменьшено минимальное время показа с 500ms до 200ms

### 3. ❌ Медленная инициализация при переходах
**Причина:** Избыточные компоненты инициализации в layout.

**Решение:**
- Убран `LanguageAutoInitializer` из layout (логика перенесена в LanguageProvider)
- Отладочные компоненты показываются только в development режиме
- Оптимизирована последовательность загрузки

## Изменения в коде:

### `src/components/smooth-language-initializer.tsx`
```typescript
// Добавлена проверка sessionStorage для предотвращения повторных экранов загрузки
const [hasInitialized, setHasInitialized] = useState(false)

useEffect(() => {
  const wasInitialized = sessionStorage.getItem('language_initialized')
  if (wasInitialized) {
    setHasInitialized(true)
    setShowLoading(false)
  }
}, [])
```

### `src/components/language-provider.tsx`
```typescript
// Добавлена проверка сохраненного языка перед автоопределением
const initializeLanguage = async () => {
  const savedLanguage = getSavedLanguage()
  if (savedLanguage && isSupportedLanguage(savedLanguage)) {
    setCurrentLanguage(savedLanguage)
    await translationService.loadTranslations(savedLanguage)
    setIsLoading(false)
    return
  }
  // Только если нет сохраненного языка - используем автоопределение
}
```

### `src/app/layout.tsx`
```typescript
// Упрощена структура и убраны избыточные компоненты
<LanguageProvider>
  <SmoothLanguageInitializer minLoadingTime={200}>
    <DynamicHtmlLang />
    <DynamicMetadata />
    {children}
    {/* Отладочные компоненты только в development */}
  </SmoothLanguageInitializer>
</LanguageProvider>
```

## Новые компоненты для отладки:

### `LanguagePersistenceTest`
- Тестирование сохранения языка в localStorage
- Проверка соответствия текущего и сохраненного языка
- Кнопки для быстрого переключения языков
- Показывается только в development режиме

## Результат:

✅ **Язык сохраняется между переходами** - выбранный язык остается активным при навигации

✅ **Экран загрузки показывается только один раз** - при первом посещении сайта в сессии

✅ **Быстрая инициализация** - сохраненный язык загружается мгновенно

✅ **Улучшенная отладка** - компоненты для тестирования в development режиме

✅ **Лучший UX** - плавная работа без лишних экранов загрузки

## Тестирование:

1. Откройте приложение в браузере
2. Смените язык в настройках на английский
3. Перейдите на другие страницы - язык должен остаться английским
4. Обновите страницу - язык должен остаться английским
5. Экран загрузки должен появиться только при первом посещении

## Отладка:

В development режиме доступны компоненты:
- `LanguageDetectionDebug` - информация о определении языка
- `LanguageInitializationTest` - тестирование инициализации
- `LanguagePersistenceTest` - тестирование сохранения языка