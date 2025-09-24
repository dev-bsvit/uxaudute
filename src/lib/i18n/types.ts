export interface Language {
  code: string
  name: string
  nativeName: string
  flag: string
  isRTL?: boolean
}

export interface TranslationMap {
  [key: string]: string | TranslationMap
}

export interface LanguageContextType {
  currentLanguage: string
  availableLanguages: Language[]
  setLanguage: (language: string) => Promise<void>
  t: (key: string, params?: Record<string, string>) => string
  isLoading: boolean
}

export enum PromptType {
  MAIN = 'main',
  JSON_STRUCTURED = 'json-structured',
  SONOMA_STRUCTURED = 'sonoma-structured',
  AB_TEST = 'ab-test',
  BUSINESS_ANALYTICS = 'business-analytics',
  HYPOTHESES = 'hypotheses'
}

export interface LanguageConfig {
  code: string
  name: string
  nativeName: string
  flag: string
  isRTL: boolean
  dateFormat: string
  numberFormat: Intl.NumberFormatOptions
  prompts: {
    [key in PromptType]: string
  }
}

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
  }
]

export const DEFAULT_LANGUAGE = 'ru'
export const FALLBACK_LANGUAGE = 'ru'