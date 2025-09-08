# 🎨 Canvas Annotations System - Руководство

> **Обновлено**: 4 января 2025  
> **Статус**: Готово к использованию

## 📋 Обзор

Система аннотаций Canvas API теперь поддерживает **персистентное хранение** аннотаций в базе данных Supabase. Аннотации сохраняются автоматически и доступны при перезагрузке страницы или обмене ссылками.

## 🏗️ Архитектура

### **Хранение данных:**
1. **База данных** (основное) - таблица `audits`, поле `annotations` (JSONB)
2. **LocalStorage** (fallback) - для быстрого доступа
3. **API** - `/api/annotations` для синхронизации

### **Приоритет загрузки:**
1. **API** (если есть `auditId`) - загружает из базы данных
2. **Props** (если есть `initialAnnotationData`) - загружает из пропсов
3. **LocalStorage** (fallback) - загружает из локального хранилища

## 🔧 Использование

### **Базовое использование:**
```tsx
<CanvasAnnotations
  src="/path/to/image.jpg"
  alt="Описание изображения"
  auditId="audit-uuid-here" // Для сохранения в БД
  autoSave={true} // Автоматическое сохранение
  onAnnotationSave={(data) => console.log('Saved:', data)}
/>
```

### **Пропсы компонента:**
- `src` - URL изображения
- `alt` - Описание изображения
- `className` - CSS классы
- `auditId` - ID аудита для сохранения в БД
- `autoSave` - Автоматическое сохранение (по умолчанию: true)
- `onAnnotationSave` - Callback при сохранении
- `initialAnnotationData` - Начальные данные аннотаций

## 📊 API Endpoints

### **GET /api/annotations**
Получить аннотации для аудита:
```bash
curl "http://localhost:3000/api/annotations?auditId=audit-uuid"
```

### **POST /api/annotations**
Сохранить аннотации:
```bash
curl -X POST "http://localhost:3000/api/annotations" \
  -H "Content-Type: application/json" \
  -d '{
    "auditId": "audit-uuid",
    "annotations": {
      "annotations": [...],
      "timestamp": "2025-01-04T10:30:00Z"
    }
  }'
```

### **DELETE /api/annotations**
Удалить аннотации:
```bash
curl -X DELETE "http://localhost:3000/api/annotations?auditId=audit-uuid"
```

## 🗄️ Структура данных

### **В базе данных:**
```json
{
  "annotations": [
    {
      "id": "1234567890",
      "type": "rectangle",
      "x": 100,
      "y": 50,
      "width": 200,
      "height": 100,
      "color": "#3b82f6"
    },
    {
      "id": "1234567891",
      "type": "text",
      "x": 150,
      "y": 75,
      "width": 0,
      "height": 0,
      "text": "Комментарий",
      "color": "#3b82f6"
    }
  ],
  "timestamp": "2025-01-04T10:30:00Z"
}
```

### **Типы аннотаций:**
- `rectangle` - Прямоугольник
- `circle` - Круг
- `arrow` - Стрелка
- `text` - Текст

## 🔄 Автоматическое сохранение

### **Как работает:**
1. Пользователь создает/изменяет аннотацию
2. Через 1 секунду после последнего изменения срабатывает автосохранение
3. Данные сохраняются в базу данных через API
4. Отображается статус сохранения

### **Статусы:**
- 💾 **Сохранение...** - идет процесс сохранения
- ✓ **Сохранено 10:30:15** - успешно сохранено
- **Синхронизировано с базой данных** - готово к работе

## 🚀 Миграция базы данных

### **Выполните миграцию:**
```sql
-- Добавить поле annotations в таблицу audits
ALTER TABLE public.audits 
ADD COLUMN annotations jsonb;

-- Создать индекс для производительности
CREATE INDEX idx_audits_annotations ON public.audits USING gin (annotations);
```

### **Или используйте готовую миграцию:**
```bash
# В Supabase SQL Editor выполните:
# migrations/add_annotations_field.sql
```

## 🔒 Безопасность

### **Права доступа:**
- Пользователи могут видеть только свои аннотации
- Проверка прав через RLS (Row Level Security)
- API требует аутентификации

### **Валидация:**
- Проверка существования аудита
- Проверка прав доступа к проекту
- Валидация JSON структуры

## 🐛 Отладка

### **Логи в консоли:**
```javascript
// Загрузка аннотаций
console.log('Loading annotations from database for audit:', auditId)
console.log('Loaded annotations from database:', annotations)

// Сохранение аннотаций
console.log('Annotations saved to database')
console.log('Annotations saved to localStorage:', annotations)
```

### **Проверка API:**
```bash
# Проверить состояние API
curl http://localhost:3000/api/health

# Проверить аннотации
curl "http://localhost:3000/api/annotations?auditId=your-audit-id"
```

## 📱 Совместимость

### **Поддерживаемые браузеры:**
- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

### **Требования:**
- JavaScript включен
- Canvas API поддержка
- LocalStorage доступен

## 🔄 Миграция с старой системы

### **Автоматическая миграция:**
Система автоматически мигрирует данные:
1. Сначала пытается загрузить из API (новая система)
2. Если нет - загружает из LocalStorage (старая система)
3. При сохранении записывает в обе системы

### **Ручная миграция:**
```javascript
// Получить данные из LocalStorage
const oldData = localStorage.getItem('canvas-annotations-filename')

// Сохранить через API
await fetch('/api/annotations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    auditId: 'your-audit-id',
    annotations: JSON.parse(oldData)
  })
})
```

## 🎯 Лучшие практики

### **Производительность:**
- Используйте `autoSave={true}` для автоматического сохранения
- Не создавайте слишком много аннотаций (>100)
- Очищайте старые аннотации периодически

### **UX:**
- Показывайте статус сохранения пользователю
- Предупреждайте о потере данных при выходе
- Используйте понятные цвета для аннотаций

### **Разработка:**
- Всегда передавайте `auditId` для персистентности
- Тестируйте на разных устройствах
- Логируйте ошибки для отладки

---

## 📞 Поддержка

При возникновении проблем:
1. Проверьте консоль браузера на ошибки
2. Убедитесь, что API доступен
3. Проверьте права доступа к аудиту
4. Обратитесь к разработчику

**Готово к использованию! 🚀**
