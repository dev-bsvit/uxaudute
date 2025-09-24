import { supabase } from '@/lib/supabase'
import { DEFAULT_LANGUAGE, isSupportedLanguage } from './types'

export class UserSettingsService {
  /**
   * Сохраняет языковые предпочтения пользователя в базу данных
   */
  async saveLanguagePreference(userId: string, language: string): Promise<void> {
    if (!isSupportedLanguage(language)) {
      throw new Error(`Unsupported language: ${language}`)
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          preferred_language: language,
          updated_at: new Date().toISOString()
        })

      if (error) {
        throw new Error(`Failed to save language preference: ${error.message}`)
      }

      console.log(`Language preference saved for user ${userId}: ${language}`)
    } catch (error) {
      console.error('Error saving language preference:', error)
      throw error
    }
  }

  /**
   * Получает языковые предпочтения пользователя из базы данных
   */
  async getLanguagePreference(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // Профиль не найден
          return null
        }
        throw new Error(`Failed to get language preference: ${error.message}`)
      }

      const language = data?.preferred_language
      
      // Проверяем, что язык поддерживается
      if (language && isSupportedLanguage(language)) {
        return language
      }

      return null
    } catch (error) {
      console.error('Error getting language preference:', error)
      return null
    }
  }

  /**
   * Получает языковые предпочтения текущего пользователя
   */
  async getCurrentUserLanguagePreference(): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      return await this.getLanguagePreference(user.id)
    } catch (error) {
      console.error('Error getting current user language preference:', error)
      return null
    }
  }

  /**
   * Сохраняет язык в localStorage
   */
  saveToLocalStorage(language: string): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem('preferred_language', language)
    } catch (error) {
      console.error('Failed to save language to localStorage:', error)
    }
  }

  /**
   * Получает язык из localStorage
   */
  getFromLocalStorage(): string | null {
    if (typeof window === 'undefined') return null

    try {
      const language = localStorage.getItem('preferred_language')
      
      // Проверяем, что язык поддерживается
      if (language && isSupportedLanguage(language)) {
        return language
      }

      return null
    } catch (error) {
      console.error('Failed to get language from localStorage:', error)
      return null
    }
  }

  /**
   * Определяет предпочтительный язык пользователя
   * Приоритет: база данных -> localStorage -> браузер -> по умолчанию
   */
  async determinePreferredLanguage(): Promise<string> {
    try {
      // 1. Пытаемся получить из базы данных для авторизованных пользователей
      const dbLanguage = await this.getCurrentUserLanguagePreference()
      if (dbLanguage) {
        return dbLanguage
      }

      // 2. Пытаемся получить из localStorage
      const localLanguage = this.getFromLocalStorage()
      if (localLanguage) {
        return localLanguage
      }

      // 3. Пытаемся определить по браузеру
      if (typeof window !== 'undefined') {
        const browserLang = navigator.language.split('-')[0]
        if (isSupportedLanguage(browserLang)) {
          return browserLang
        }
      }

      // 4. Возвращаем язык по умолчанию
      return DEFAULT_LANGUAGE
    } catch (error) {
      console.error('Error determining preferred language:', error)
      return DEFAULT_LANGUAGE
    }
  }

  /**
   * Синхронизирует языковые настройки между localStorage и базой данных
   */
  async syncLanguageSettings(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Пользователь не авторизован, синхронизация не нужна
        return
      }

      const dbLanguage = await this.getLanguagePreference(user.id)
      const localLanguage = this.getFromLocalStorage()

      if (dbLanguage && localLanguage && dbLanguage !== localLanguage) {
        // Приоритет у базы данных
        this.saveToLocalStorage(dbLanguage)
        console.log(`Language synced from database: ${dbLanguage}`)
      } else if (!dbLanguage && localLanguage) {
        // Сохраняем локальные настройки в базу данных
        await this.saveLanguagePreference(user.id, localLanguage)
        console.log(`Language synced to database: ${localLanguage}`)
      }
    } catch (error) {
      console.error('Error syncing language settings:', error)
    }
  }

  /**
   * Очищает языковые настройки
   */
  clearLanguageSettings(): void {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem('preferred_language')
    } catch (error) {
      console.error('Failed to clear language settings:', error)
    }
  }
}

export const userSettingsService = new UserSettingsService()