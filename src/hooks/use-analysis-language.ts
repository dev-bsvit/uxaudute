import { useState, useEffect, useCallback } from 'react'
import { analysisLanguageTracker, AnalysisLanguageMetadata } from '@/lib/analysis-language-tracker'
import { useLanguage } from '@/hooks/use-language'

/**
 * Хук для работы с языковыми метаданными анализа
 */
export function useAnalysisLanguage(auditId?: string) {
  const { currentLanguage } = useLanguage()
  const [languageMetadata, setLanguageMetadata] = useState<AnalysisLanguageMetadata | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Загружает метаданные языка для анализа
   */
  const loadLanguageMetadata = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const metadata = await analysisLanguageTracker.getLanguageMetadata(id)
      setLanguageMetadata(metadata)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load language metadata'
      setError(errorMessage)
      console.error('Error loading language metadata:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Сохраняет метаданные языка для анализа
   */
  const saveLanguageMetadata = useCallback(async (
    id: string,
    analysisContent: string,
    promptLanguage: string
  ) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const metadata = analysisLanguageTracker.createLanguageMetadata(
        analysisContent,
        promptLanguage,
        currentLanguage
      )
      
      await analysisLanguageTracker.addLanguageMetadata(id, metadata)
      setLanguageMetadata(metadata)
      
      return metadata
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save language metadata'
      setError(errorMessage)
      console.error('Error saving language metadata:', err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [currentLanguage])

  /**
   * Определяет язык анализа из контента
   */
  const detectLanguage = useCallback((content: string) => {
    return analysisLanguageTracker.detectAnalysisLanguage(content)
  }, [])

  // Автоматически загружаем метаданные при изменении auditId
  useEffect(() => {
    if (auditId) {
      loadLanguageMetadata(auditId)
    }
  }, [auditId, loadLanguageMetadata])

  return {
    languageMetadata,
    isLoading,
    error,
    loadLanguageMetadata,
    saveLanguageMetadata,
    detectLanguage,
    analysisLanguage: languageMetadata?.analysisLanguage,
    promptLanguage: languageMetadata?.promptLanguage,
    userInterfaceLanguage: languageMetadata?.userInterfaceLanguage
  }
}

/**
 * Хук для получения статистики языков пользователя
 */
export function useUserLanguageStats(userId?: string) {
  const [stats, setStats] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadStats = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const userStats = await analysisLanguageTracker.getUserLanguageStats(id)
      setStats(userStats)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load language stats'
      setError(errorMessage)
      console.error('Error loading language stats:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (userId) {
      loadStats(userId)
    }
  }, [userId, loadStats])

  return {
    stats,
    isLoading,
    error,
    loadStats,
    totalAnalyses: Object.values(stats).reduce((sum, count) => sum + count, 0),
    mostUsedLanguage: Object.entries(stats).sort(([,a], [,b]) => b - a)[0]?.[0]
  }
}

/**
 * Хук для получения последних анализов с языковой информацией
 */
export function useRecentAnalysesWithLanguage(userId?: string, limit: number = 10) {
  const [analyses, setAnalyses] = useState<Array<{
    id: string
    title: string
    analysis_language: string
    language_metadata: AnalysisLanguageMetadata | null
    created_at: string
  }>>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadAnalyses = useCallback(async (id: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      const recentAnalyses = await analysisLanguageTracker.getRecentAnalysesWithLanguage(id, limit)
      setAnalyses(recentAnalyses)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load recent analyses'
      setError(errorMessage)
      console.error('Error loading recent analyses:', err)
    } finally {
      setIsLoading(false)
    }
  }, [limit])

  useEffect(() => {
    if (userId) {
      loadAnalyses(userId)
    }
  }, [userId, loadAnalyses])

  return {
    analyses,
    isLoading,
    error,
    loadAnalyses
  }
}