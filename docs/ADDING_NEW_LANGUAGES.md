# Adding New Languages to UX Audit Platform

This guide explains how to add support for new languages to the UX Audit Platform.

## Overview

The platform uses a modular i18n system that supports:
- Interface translations
- Localized AI prompts
- User language preferences
- Automatic language detection

## Steps to Add a New Language

### 1. Add Language Configuration

Edit `src/lib/i18n/types.ts` and add your language to `SUPPORTED_LANGUAGES`:

```typescript
export const SUPPORTED_LANGUAGES: Language[] = [
  {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  // Add your new language here
  {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  }
]
```

### 2. Create Translation Files

Create translation files in `public/locales/[language-code]/`:

```
public/locales/es/
├── common.json          # Common UI elements
├── navigation.json      # Navigation items
├── settings.json        # Settings page
├── analysis-results.json # Analysis result display
└── components.json      # Component-specific translations
```

**Example `public/locales/es/common.json`:**
```json
{
  "loading": "Cargando...",
  "save": "Guardar",
  "cancel": "Cancelar",
  "error": "Error",
  "success": "Éxito"
}
```

### 3. Create Localized Prompts

Create AI prompts in `public/prompts/[language-code]/`:

```
public/prompts/es/
├── main-prompt.md
├── json-structured-prompt.md
├── sonoma-structured-prompt.md
├── ab-test-prompt.md
├── business-analytics-prompt.md
└── hypotheses-prompt.md
```

**Example `public/prompts/es/main-prompt.md`:**
```markdown
Eres un diseñador UX experimentado con 20 años de experiencia. Analiza la interfaz basándote en metodologías UX probadas: heurísticas de Nielsen, WCAG 2.2, Ley de Fitts, Hick-Hyman, ISO 9241, etc.

Entrada: captura de pantalla estática (requerida) + contexto y audiencia objetivo si está disponible.

Salida:
1. Descripción de la pantalla
2. Encuesta UX con 5 preguntas
3. Problemas y recomendaciones
4. Autoevaluación y confianza

Responde en español.
```

### 4. Translation File Structure

Each translation file should follow this nested structure:

**common.json:**
```json
{
  "loading": "Loading text",
  "buttons": {
    "save": "Save",
    "cancel": "Cancel",
    "submit": "Submit"
  },
  "messages": {
    "success": "Success message",
    "error": "Error message"
  }
}
```

**navigation.json:**
```json
{
  "quickAnalysis": "Quick Analysis",
  "myProjects": "My Projects", 
  "settings": "Settings"
}
```

### 5. Update API Routes for AI Analysis

**CRITICAL STEP**: Update API routes to support multilingual prompts and responses.

For each analysis type that uses AI (AB tests, hypotheses, business analytics), you need to add multilingual support to the API routes.

#### Files to Update:
- `src/app/api/ab-test/route.ts`
- `src/app/api/hypotheses/route.ts`
- `src/app/api/business-analytics/route.ts`

#### Changes Required:

**1. Add imports at the top:**
```typescript
import { LanguageManager } from '@/lib/language-manager'
import { PromptType } from '@/lib/i18n/types'
```

**2. Add language detection (after getting audit data):**
```typescript
// Определяем языковой контекст из данных аудита
let auditLanguage = audit.input_data?.language

// Если язык не сохранен, определяем по содержимому result_data
if (!auditLanguage && audit.result_data) {
  const resultText = JSON.stringify(audit.result_data)
  // Проверяем есть ли кириллица в данных (включая украинские буквы)
  const hasCyrillic = /[а-яА-ЯёЁїієґ]/.test(resultText)
  auditLanguage = hasCyrillic ? 'ru' : 'en'
  console.log('🌐 Language auto-detected from result_data:', auditLanguage)
}

// Fallback на русский если язык всё ещё не определен
auditLanguage = auditLanguage || 'ru'
console.log('🌐 Final audit language:', auditLanguage)

const languageContext = {
  requestLanguage: auditLanguage,
  detectedLanguage: auditLanguage,
  promptLanguage: auditLanguage,
  responseLanguage: auditLanguage,
  isConsistent: true,
  source: 'user-preference' as const
}
```

**3. Replace old prompt loading with LanguageManager:**
```typescript
// OLD - Don't use this:
// const promptPath = path.join(process.cwd(), 'prompts', 'ab-test-prompt.md')
// const abTestPrompt = fs.readFileSync(promptPath, 'utf-8')

// NEW - Use this:
let promptText = await LanguageManager.loadPromptForLanguage(
  PromptType.AB_TEST, // or PromptType.HYPOTHESES, PromptType.BUSINESS_ANALYTICS
  languageContext
)

// Enforce response language
promptText = LanguageManager.enforceResponseLanguage(
  promptText,
  languageContext.responseLanguage
)
```

**4. Add multilingual data labels:**
```typescript
const dataLabels = {
  ru: {
    title: '**Данные для анализа:**',
    image: 'Изображение',
    context: 'Контекст аудита',
    projectContext: 'Контекст проекта',
    targetAudience: 'Целевая аудитория',
    analysisResult: 'Результат UX анализа',
    instruction: 'Сгенерируй [AB тесты/гипотезы/бизнес-аналитику] на основе этих данных.'
  },
  en: {
    title: '**Analysis Data:**',
    image: 'Image',
    context: 'Audit Context',
    projectContext: 'Project Context',
    targetAudience: 'Target Audience',
    analysisResult: 'UX Analysis Result',
    instruction: 'Generate [AB tests/hypotheses/business analytics] based on this data.'
  },
  ua: {
    title: '**Дані для аналізу:**',
    image: 'Зображення',
    context: 'Контекст аудиту',
    projectContext: 'Контекст проєкту',
    targetAudience: 'Цільова аудиторія',
    analysisResult: 'Результат UX аналізу',
    instruction: 'Згенеруй [AB тести/гіпотези/бізнес-аналітику] на основі цих даних.'
  }
  // Add your new language here
}

const labels = dataLabels[auditLanguage as keyof typeof dataLabels] || dataLabels.ru
```

**5. Update fullPrompt construction:**
```typescript
const fullPrompt = `${promptText}

${labels.title}
- ${labels.image}: ${auditData.imageUrl}
- ${labels.context}: ${auditData.context}
- ${labels.projectContext}: ${auditData.projectContext}
- ${labels.targetAudience}: ${auditData.targetAudience}
- ${labels.analysisResult}: ${JSON.stringify(auditData.analysisResult, null, 2)}

${labels.instruction}`
```

**6. Add multilingual system messages:**
```typescript
const systemMessages = {
  ru: "Ты - Senior UI/UX & CRO консультант. Генерируй [AB тесты/гипотезы] в JSON формате.",
  en: "You are a Senior UI/UX & CRO consultant. Generate [AB tests/hypotheses] in JSON format.",
  ua: "Ти - Senior UI/UX & CRO консультант. Генеруй [AB тести/гіпотези] в JSON форматі."
  // Add your new language here
}

const systemMessage = systemMessages[auditLanguage as keyof typeof systemMessages] || systemMessages.ru

// Use systemMessage in OpenAI call
const completion = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    {
      role: "system",
      content: systemMessage
    },
    // ...
  ]
})
```

**Why This Step is Critical:**
Without updating API routes, the AI will receive prompts and data labels in Russian even if the user selected another language. This causes mixed-language responses where the interface is translated but AI responses remain in Russian.

### 6. Test the New Language

1. **Add the language code** to your browser's language preferences
2. **Clear localStorage** to test automatic detection:
   ```javascript
   localStorage.removeItem('preferred_language')
   ```
3. **Refresh the page** and verify the new language is detected
4. **Test language switching** using the language selector
5. **Create a new analysis** to test localized prompts
6. **Test all analysis types** (Main audit, AB tests, Hypotheses, Business Analytics) to verify AI responds in the correct language

### 7. Validation Checklist

- [ ] Language appears in language selector
- [ ] All UI elements are translated
- [ ] No missing translation keys (check browser console)
- [ ] AI prompts work correctly in the new language
- [ ] Main audit analysis results are in the correct language
- [ ] **AB tests results are in the correct language**
- [ ] **Hypotheses results are in the correct language**
- [ ] **Business analytics results are in the correct language**
- [ ] Language preference is saved to database
- [ ] Fallback to Russian works if translations are missing
- [ ] API routes use LanguageManager for prompt loading
- [ ] System messages in API routes are multilingual

## File Naming Conventions

- **Language codes**: Use ISO 639-1 two-letter codes (e.g., 'es', 'fr', 'de')
- **Translation files**: Use kebab-case (e.g., `analysis-results.json`)
- **Prompt files**: Use kebab-case with `.md` extension

## Translation Keys

Use dot notation for nested keys:
```typescript
t('common.buttons.save')        // "Save"
t('navigation.quickAnalysis')   // "Quick Analysis"
t('settings.interface.language') // "Language"
```

## Prompt Guidelines

1. **Maintain structure**: Keep the same sections as existing prompts
2. **Preserve instructions**: Ensure AI instructions are clear in the target language
3. **Cultural adaptation**: Adapt examples and references to the target culture
4. **Technical terms**: Use appropriate technical terminology for UX/UI in that language

## Testing New Languages

Run the language initialization test:
```bash
npm test src/lib/i18n/__tests__/language-initialization.test.ts
```

## Troubleshooting

### Missing Translations
- Check browser console for missing translation keys
- Verify file paths and naming conventions
- Ensure JSON syntax is valid

### Prompt Loading Errors
- Verify prompt files exist in correct directory
- Check file encoding (should be UTF-8)
- Ensure markdown syntax is correct

### Language Not Detected
- Verify language is added to `SUPPORTED_LANGUAGES`
- Check browser language settings
- Clear localStorage and test again

## Performance Considerations

- Translation files are loaded on-demand
- Prompts are cached after first load
- Fallback language (Russian) is preloaded for reliability

## Future Enhancements

- RTL language support
- Pluralization rules
- Date/number formatting per locale
- Dynamic language loading from CMS