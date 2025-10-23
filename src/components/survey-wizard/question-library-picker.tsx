'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Search, X } from 'lucide-react'
import { QUESTION_BANK, QuestionCategory, SurveyQuestion } from '@/lib/survey-question-bank'

interface QuestionLibraryPickerProps {
  selectedQuestionIds: string[]
  onSelect: (questions: SurveyQuestion[]) => void
  onClose: () => void
  currentLanguage: 'ru' | 'en'
}

const CATEGORY_LABELS: Record<QuestionCategory, { ru: string; en: string }> = {
  'general': { ru: 'Общие', en: 'General' },
  'ecommerce': { ru: 'E-commerce', en: 'E-commerce' },
  'mobile': { ru: 'Мобильные', en: 'Mobile' },
  'marketing': { ru: 'Маркетинг', en: 'Marketing' },
  'customer-experience': { ru: 'Клиентский опыт', en: 'Customer Experience' },
  'feedback': { ru: 'Обратная связь', en: 'Feedback' },
  'additional': { ru: 'Дополнительные', en: 'Additional' },
  'user-testing': { ru: 'Тестирование', en: 'User Testing' },
  'ux-audit': { ru: 'UX Аудит', en: 'UX Audit' },
  'user-profile': { ru: 'Профиль пользователя', en: 'User Profile' },
  'final': { ru: 'Завершающие', en: 'Final' },
  'ai-general': { ru: 'AI: Общие', en: 'AI: General' },
  'ai-interface': { ru: 'AI: Интерфейс', en: 'AI: Interface' },
  'ai-satisfaction': { ru: 'AI: Удовлетворенность', en: 'AI: Satisfaction' },
  'ai-interests': { ru: 'AI: Интересы', en: 'AI: Interests' },
  'ai-feedback': { ru: 'AI: Отзывы', en: 'AI: Feedback' },
  'ai-comparison': { ru: 'AI: Сравнение', en: 'AI: Comparison' },
  'ai-engagement': { ru: 'AI: Вовлеченность', en: 'AI: Engagement' },
  'ai-acquisition': { ru: 'AI: Привлечение', en: 'AI: Acquisition' },
  'ai-registration': { ru: 'AI: Регистрация', en: 'AI: Registration' },
  'ai-profile': { ru: 'AI: Профиль', en: 'AI: Profile' },
  'ai-content': { ru: 'AI: Контент', en: 'AI: Content' },
  'ai-design': { ru: 'AI: Дизайн', en: 'AI: Design' },
}

export function QuestionLibraryPicker({
  selectedQuestionIds,
  onSelect,
  onClose,
  currentLanguage
}: QuestionLibraryPickerProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(selectedQuestionIds))
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Get unique categories
  const categories = useMemo(() => {
    const cats = new Set(QUESTION_BANK.map(q => q.category))
    return Array.from(cats).sort()
  }, [])

  // Filter questions
  const filteredQuestions = useMemo(() => {
    let questions = QUESTION_BANK

    // Filter by category
    if (selectedCategory !== 'all') {
      questions = questions.filter(q => q.category === selectedCategory)
    }

    // Filter by search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      questions = questions.filter(q => {
        const text = currentLanguage === 'ru' ? q.text_ru : q.text_en
        return text.toLowerCase().includes(query)
      })
    }

    return questions
  }, [selectedCategory, searchQuery, currentLanguage])

  const handleToggle = (questionId: string) => {
    const newSelected = new Set(selectedIds)
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId)
    } else {
      newSelected.add(questionId)
    }
    setSelectedIds(newSelected)
  }

  const handleSelectAll = () => {
    const newSelected = new Set(selectedIds)
    filteredQuestions.forEach(q => newSelected.add(q.id))
    setSelectedIds(newSelected)
  }

  const handleDeselectAll = () => {
    const newSelected = new Set(selectedIds)
    filteredQuestions.forEach(q => newSelected.delete(q.id))
    setSelectedIds(newSelected)
  }

  const handleConfirm = () => {
    const selected = QUESTION_BANK.filter(q => selectedIds.has(q.id))
    onSelect(selected)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Библиотека вопросов
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Выбрано: {selectedIds.size} из {QUESTION_BANK.length}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLanguage === 'ru' ? 'Поиск по вопросам...' : 'Search questions...'}
              className="pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              {currentLanguage === 'ru' ? 'Все' : 'All'} ({QUESTION_BANK.length})
            </Button>
            {categories.map(cat => {
              const count = QUESTION_BANK.filter(q => q.category === cat).length
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                >
                  {CATEGORY_LABELS[cat][currentLanguage]} ({count})
                </Button>
              )
            })}
          </div>

          {/* Bulk Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Выбрать все на странице
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Снять выбор со страницы
            </Button>
          </div>
        </div>

        {/* Questions List */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-3">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Вопросы не найдены
              </div>
            ) : (
              filteredQuestions.map(question => {
                const isSelected = selectedIds.has(question.id)
                const text = currentLanguage === 'ru' ? question.text_ru : question.text_en

                return (
                  <Card
                    key={question.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'
                    }`}
                    onClick={() => handleToggle(question.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(question.id)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">{text}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {CATEGORY_LABELS[question.category][currentLanguage]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.type}
                          </Badge>
                          {question.tags?.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-6 border-t flex justify-between items-center">
          <p className="text-sm text-slate-600">
            Выбрано вопросов: <span className="font-semibold">{selectedIds.size}</span>
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Отмена
            </Button>
            <Button onClick={handleConfirm} disabled={selectedIds.size === 0}>
              Добавить выбранные ({selectedIds.size})
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
