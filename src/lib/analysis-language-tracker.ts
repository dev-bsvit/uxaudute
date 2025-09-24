/**
 * Утилиты для отслеживания языка анализа
 */

import { supabase } from '@/lib/supabase'

export interface AnalysisLanguageMetadata {
  analysisLanguage: string
  promptLanguage: string
  userInterfaceLanguage: string
  timestamp: string
  confidence?: number
}

export class AnalysisLanguageTracker {
  /**
   * Добавляет метаданные языка к анализу
   */
  static async addLanguageMetadata(
    auditId: string,
    metadata: AnalysisLanguageMetadata
  ): Promise<void> {
    try {
      // Обновляем запись аудита с метаданными языка
      const { error } = await supabase
        .from('audits')
        .update({
          language_metadata: metadata,
          analysis_language: metadata.analysisLanguage,
          updated_at: new Date().toISOString()
        })
        .eq('id', auditId)

      if (error) {
        throw new Error(`Failed to add language metadata: ${error.message}`)
      }

      console.log(`Language metadata added to audit ${auditId}:`, metadata)
    } catch (error) {
      console.error('Error adding language metadata:', error)
      throw error
    }
  }

  /**
   * Получает метаданные языка для анализа
   */
  static async getLanguageMetadata(auditId: string): Promise<AnalysisLanguageMetadata | null> {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('language_metadata, analysis_language')
        .eq('id', auditId)
        .single()

      if (error) {
        throw new Error(`Failed to get language metadata: ${error.message}`)
      }

      return data?.language_metadata || null
    } catch (error) {
      console.error('Error getting language metadata:', error)
      return null
    }
  }

  /**
   * Определяет язык анализа на основе контента
   */
  static detectAnalysisLanguage(analysisContent: string): string {
    // Простая эвристика для определения языка
    const russianChars = (analysisContent.match(/[а-яё]/gi) || []).length
    const englishChars = (analysisContent.match(/[a-z]/gi) || []).length
    const totalChars = russianChars + englishChars

    if (totalChars === 0) return 'unknown'

    const russianRatio = russianChars / totalChars
    
    // Если больше 30% русских символов, считаем русским
    if (russianRatio > 0.3) return 'ru'
    
    // Иначе английским
    return 'en'
  }

  /**
   * Создает метаданные языка для нового анализа
   */
  static createLanguageMetadata(
    analysisContent: string,
    promptLanguage: string,
    userLanguage: string
  ): AnalysisLanguageMetadata {
    const analysisLanguage = this.detectAnalysisLanguage(analysisContent)
    
    return {
      analysisLanguage,
      promptLanguage,
      userInterfaceLanguage: userLanguage,
      timestamp: new Date().toISOString(),
      confidence: this.calculateLanguageConfidence(analysisContent, analysisLanguage)
    }
  }

  /**
   * Вычисляет уверенность в определении языка
   */
  private static calculateLanguageConfidence(content: string, detectedLanguage: string): number {
    const russianChars = (content.match(/[а-яё]/gi) || []).length
    const englishChars = (content.match(/[a-z]/gi) || []).length
    const totalChars = russianChars + englishChars

    if (totalChars === 0) return 0

    if (detectedLanguage === 'ru') {
      return Math.min(0.95, russianChars / totalChars)
    } else {
      return Math.min(0.95, englishChars / totalChars)
    }
  }

  /**
   * Получает статистику по языкам анализов пользователя
   */
  static async getUserLanguageStats(userId: string): Promise<Record<string, number>> {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('analysis_language')
        .eq('user_id', userId)
        .not('analysis_language', 'is', null)

      if (error) {
        throw new Error(`Failed to get language stats: ${error.message}`)
      }

      const stats: Record<string, number> = {}
      
      data?.forEach(audit => {
        const lang = audit.analysis_language || 'unknown'
        stats[lang] = (stats[lang] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Error getting language stats:', error)
      return {}
    }
  }

  /**
   * Получает последние анализы с информацией о языке
   */
  static async getRecentAnalysesWithLanguage(
    userId: string, 
    limit: number = 10
  ): Promise<Array<{
    id: string
    title: string
    analysis_language: string
    language_metadata: AnalysisLanguageMetadata | null
    created_at: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('audits')
        .select('id, title, analysis_language, language_metadata, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) {
        throw new Error(`Failed to get recent analyses: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Error getting recent analyses:', error)
      return []
    }
  }

  /**
   * Обновляет язык анализа для существующих записей (миграция)
   */
  static async updateExistingAnalysesLanguage(userId: string): Promise<void> {
    try {
      // Получаем анализы без языковых метаданных
      const { data: audits, error: fetchError } = await supabase
        .from('audits')
        .select('id, analysis_result')
        .eq('user_id', userId)
        .is('analysis_language', null)

      if (fetchError) {
        throw new Error(`Failed to fetch audits: ${fetchError.message}`)
      }

      if (!audits || audits.length === 0) {
        console.log('No audits to update')
        return
      }

      // Обновляем каждый анализ
      for (const audit of audits) {
        if (audit.analysis_result) {
          const content = typeof audit.analysis_result === 'string' 
            ? audit.analysis_result 
            : JSON.stringify(audit.analysis_result)
          
          const detectedLanguage = this.detectAnalysisLanguage(content)
          
          await supabase
            .from('audits')
            .update({ analysis_language: detectedLanguage })
            .eq('id', audit.id)
        }
      }

      console.log(`Updated ${audits.length} audits with language information`)
    } catch (error) {
      console.error('Error updating existing analyses:', error)
      throw error
    }
  }
}

export const analysisLanguageTracker = AnalysisLanguageTracker