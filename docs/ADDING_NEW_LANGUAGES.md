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

### 5. Test the New Language

1. **Add the language code** to your browser's language preferences
2. **Clear localStorage** to test automatic detection:
   ```javascript
   localStorage.removeItem('preferred_language')
   ```
3. **Refresh the page** and verify the new language is detected
4. **Test language switching** using the language selector
5. **Create a new analysis** to test localized prompts

### 6. Validation Checklist

- [ ] Language appears in language selector
- [ ] All UI elements are translated
- [ ] No missing translation keys (check browser console)
- [ ] AI prompts work correctly in the new language
- [ ] Analysis results are in the correct language
- [ ] Language preference is saved to database
- [ ] Fallback to Russian works if translations are missing

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