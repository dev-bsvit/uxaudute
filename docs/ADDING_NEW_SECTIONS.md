# Механизм добавления новых разделов

Документация по добавлению новых разделов в систему UX аудита на примере AB тестов.

## Структура раздела

Каждый новый раздел состоит из 5 компонентов:

### 1. Промт (`prompts/section-name-prompt.md`)
- Специализированный промт для генерации контента
- JSON-структурированный ответ
- Инструкции по генерации

### 2. Типы данных (`src/lib/analysis-types.ts`)
- TypeScript интерфейсы для ответа
- Утилиты для проверки типа ответа
- Union типы для всех возможных ответов

### 3. API endpoint (`src/app/api/section-name/route.ts`)
- POST endpoint для генерации контента
- Использует данные основного аудита
- Сохраняет результат в `result_data.section_name`

### 4. UI компонент (`src/components/section-name-display.tsx`)
- React компонент для отображения
- Обработка состояний загрузки/ошибок
- Красивое отображение данных

### 5. Интеграция в страницу аудита (`src/app/audit/[id]/page.tsx`)
- Добавление состояния для раздела
- Функция генерации контента
- Замена заглушки на реальный компонент

## Пример: AB тесты

### 1. Промт
```markdown
# prompts/ab-test-prompt.md
- Роль: Senior UI/UX & CRO консультант
- Цель: Генерация AB тестов
- JSON формат ответа
- Инструкции по генерации
```

### 2. Типы
```typescript
// src/lib/analysis-types.ts
export interface ABTest { ... }
export interface ABTestResponse { ... }
export function isABTestResponse(response: AllAnalysisResponse): response is ABTestResponse
```

### 3. API
```typescript
// src/app/api/ab-test/route.ts
export async function POST(request: NextRequest) {
  // Получение данных аудита
  // Генерация через OpenAI
  // Сохранение в result_data.ab_tests
}
```

### 4. Компонент
```typescript
// src/components/ab-test-display.tsx
export const ABTestDisplay: React.FC<ABTestDisplayProps> = ({ 
  data, isLoading, onGenerate 
}) => { ... }
```

### 5. Интеграция
```typescript
// src/app/audit/[id]/page.tsx
const [abTestData, setAbTestData] = useState<ABTestResponse | null>(null)
const generateABTests = async () => { ... }
// В табе: <ABTestDisplay data={abTestData} onGenerate={generateABTests} />
```

## Шаблон для новых разделов

### 1. Создать промт
```bash
touch prompts/hypotheses-prompt.md
```

### 2. Добавить типы
```typescript
// В src/lib/analysis-types.ts
export interface Hypothesis { ... }
export interface HypothesisResponse { ... }
export function isHypothesisResponse(response: AllAnalysisResponse): response is HypothesisResponse
```

### 3. Создать API
```bash
mkdir -p src/app/api/hypotheses
touch src/app/api/hypotheses/route.ts
```

### 4. Создать компонент
```bash
touch src/components/hypotheses-display.tsx
```

### 5. Интегрировать в страницу
```typescript
// В src/app/audit/[id]/page.tsx
const [hypothesesData, setHypothesesData] = useState<HypothesisResponse | null>(null)
const generateHypotheses = async () => { ... }
```

## Логика активации кнопок

```typescript
// Кнопка активна только после завершения основного аудита
onGenerate={audit?.status === 'completed' ? generateSection : undefined}
```

## Сохранение в БД

```typescript
// Все разделы сохраняются в result_data
{
  "result_data": {
    "screenDescription": { ... },
    "uxSurvey": { ... },
    "problemsAndSolutions": [ ... ],
    "ab_tests": { ... },        // ← Новый раздел
    "hypotheses": { ... },      // ← Новый раздел
    "business_analytics": { ... } // ← Новый раздел
  }
}
```

## Порядок добавления нового раздела

1. **Создать промт** - определить что генерировать
2. **Добавить типы** - структура данных
3. **Создать API** - логика генерации
4. **Создать компонент** - отображение
5. **Интегрировать** - добавить в страницу
6. **Протестировать** - проверить работу

## Примечания

- Все разделы используют один механизм
- Состояние загрузки обрабатывается единообразно
- Ошибки логируются в консоль
- Результаты сохраняются в `result_data`
- Кнопки активируются только после основного аудита



