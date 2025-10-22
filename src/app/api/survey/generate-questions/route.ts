import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { QUESTION_BANK } from '@/lib/survey-question-bank'
import type { SurveyQuestionInstance } from '@/types/survey'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

/**
 * API endpoint для генерации вопросов опроса на основе скриншота
 *
 * POST /api/survey/generate-questions
 * Body: { screenshotUrl: string, language: 'ru' | 'en' }
 *
 * Возвращает:
 * - ai_questions: ~20 вопросов, сгенерированных AI
 * - selected_bank_questions: релевантные вопросы из банка (~100)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { screenshotUrl, language = 'ru' } = body

    if (!screenshotUrl) {
      return NextResponse.json(
        { error: 'Screenshot URL is required' },
        { status: 400 }
      )
    }

    // Шаг 1: Анализ скриншота и генерация AI вопросов
    const aiQuestions = await generateAIQuestions(screenshotUrl, language)

    // Шаг 2: Выбор релевантных вопросов из банка
    const selectedBankQuestions = await selectRelevantBankQuestions(
      screenshotUrl,
      language,
      aiQuestions
    )

    // Шаг 3: Формирование основного и дополнительного пулов
    // По умолчанию первые 15 вопросов идут в основной пул
    const mainQuestions = [
      ...aiQuestions.slice(0, 10), // 10 AI вопросов в основной пул
      ...selectedBankQuestions.slice(0, 5) // 5 из банка в основной пул
    ]

    const additionalQuestions = [
      ...aiQuestions.slice(10), // Остальные AI вопросы
      ...selectedBankQuestions.slice(5) // Остальные из банка
    ]

    return NextResponse.json({
      ai_questions: aiQuestions,
      selected_bank_questions: selectedBankQuestions,
      main_questions: mainQuestions,
      additional_questions: additionalQuestions,
      total_count: aiQuestions.length + selectedBankQuestions.length
    })

  } catch (error) {
    console.error('Error generating survey questions:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Генерация вопросов с помощью AI на основе скриншота
 */
async function generateAIQuestions(
  screenshotUrl: string,
  language: 'ru' | 'en'
): Promise<SurveyQuestionInstance[]> {
  const systemPrompt = language === 'ru'
    ? `Ты эксперт по UX и созданию опросов для пользователей.
Проанализируй предоставленный скриншот интерфейса и создай 20 релевантных вопросов для опроса пользователей.

Вопросы должны:
1. Быть специфичными для показанного интерфейса
2. Помогать понять пользовательский опыт и удовлетворенность
3. Выявлять проблемные места в дизайне/функционале
4. Быть короткими и понятными
5. Охватывать разные аспекты: навигацию, визуальный дизайн, удобство, функционал, производительность

Верни ответ в формате JSON массива объектов с полями:
{
  "text": "Текст вопроса",
  "type": "yes-no" | "text" | "rating" | "scale",
  "category": "краткая категория на английском",
  "tags": ["тег1", "тег2"]
}`
    : `You are an expert in UX and creating user surveys.
Analyze the provided interface screenshot and create 20 relevant survey questions for users.

Questions should:
1. Be specific to the shown interface
2. Help understand user experience and satisfaction
3. Identify problem areas in design/functionality
4. Be short and clear
5. Cover different aspects: navigation, visual design, usability, functionality, performance

Return answer in JSON array format with objects having fields:
{
  "text": "Question text",
  "type": "yes-no" | "text" | "rating" | "scale",
  "category": "brief category",
  "tags": ["tag1", "tag2"]
}`

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: language === 'ru'
                ? 'Проанализируй этот скриншот интерфейса и создай 20 релевантных вопросов для опроса пользователей:'
                : 'Analyze this interface screenshot and create 20 relevant survey questions for users:'
            },
            {
              type: 'image_url',
              image_url: {
                url: screenshotUrl,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from AI')
    }

    // Парсим JSON из ответа
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response')
    }

    const questions = JSON.parse(jsonMatch[0])

    // Преобразуем в SurveyQuestionInstance
    return questions.map((q: any, index: number) => ({
      id: `ai-gen-${Date.now()}-${index}`,
      instance_id: `ai-inst-${Date.now()}-${index}`,
      category: q.category || 'ai-general',
      text_ru: language === 'ru' ? q.text : '',
      text_en: language === 'en' ? q.text : '',
      type: q.type || 'text',
      tags: q.tags || [],
      order: index,
      required: false,
      is_custom: true,
      pool: 'main'
    }))

  } catch (error) {
    console.error('Error in generateAIQuestions:', error)
    // Возвращаем пустой массив в случае ошибки
    return []
  }
}

/**
 * Выбор релевантных вопросов из банка с помощью AI
 */
async function selectRelevantBankQuestions(
  screenshotUrl: string,
  language: 'ru' | 'en',
  aiQuestions: SurveyQuestionInstance[]
): Promise<SurveyQuestionInstance[]> {
  const systemPrompt = language === 'ru'
    ? `Ты эксперт по UX-исследованиям. У тебя есть банк из ${QUESTION_BANK.length} стандартных вопросов для UX-опросов.
Проанализируй скриншот интерфейса и уже сгенерированные AI вопросы, затем выбери наиболее релевантные вопросы из банка.

Критерии отбора:
1. Вопрос должен быть применим к показанному интерфейсу
2. Вопрос не должен дублировать уже созданные AI вопросы
3. Вопрос должен дополнять общую картину исследования
4. Приоритет вопросам, которые помогут получить количественные метрики

Верни массив ID вопросов из банка (до 100 вопросов), отсортированных по релевантности (самые релевантные первые).
Формат: ["gen-1", "ecom-3", "mob-5", ...]`
    : `You are an expert in UX research. You have a bank of ${QUESTION_BANK.length} standard UX survey questions.
Analyze the interface screenshot and already generated AI questions, then select the most relevant questions from the bank.

Selection criteria:
1. Question must be applicable to the shown interface
2. Question should not duplicate already created AI questions
3. Question should complement the overall research picture
4. Priority to questions that help get quantitative metrics

Return array of question IDs from bank (up to 100 questions), sorted by relevance (most relevant first).
Format: ["gen-1", "ecom-3", "mob-5", ...]`

  try {
    // Создаем описание банка вопросов для AI
    const bankDescription = QUESTION_BANK.map(q => ({
      id: q.id,
      category: q.category,
      text: language === 'ru' ? q.text_ru : q.text_en,
      tags: q.tags
    }))

    const aiQuestionsText = aiQuestions.map(q =>
      language === 'ru' ? q.text_ru : q.text_en
    ).join('\n')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `${language === 'ru' ? 'Скриншот интерфейса:' : 'Interface screenshot:'}`
            },
            {
              type: 'image_url',
              image_url: {
                url: screenshotUrl,
                detail: 'low'
              }
            },
            {
              type: 'text',
              text: `\n\n${language === 'ru' ? 'Уже созданные AI вопросы:' : 'Already created AI questions:'}\n${aiQuestionsText}\n\n${language === 'ru' ? 'Банк вопросов:' : 'Question bank:'}\n${JSON.stringify(bankDescription, null, 2)}`
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.5
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      // Если AI не ответил, выбираем случайные вопросы
      return selectRandomBankQuestions(80, language)
    }

    // Парсим массив ID
    const jsonMatch = content.match(/\[[\s\S]*?\]/)
    if (!jsonMatch) {
      return selectRandomBankQuestions(80, language)
    }

    const selectedIds: string[] = JSON.parse(jsonMatch[0])

    // Преобразуем ID в SurveyQuestionInstance
    const selectedQuestions = selectedIds
      .map(id => QUESTION_BANK.find(q => q.id === id))
      .filter(q => q !== undefined)
      .slice(0, 100) // Максимум 100 вопросов
      .map((q, index) => ({
        ...q!,
        instance_id: `bank-inst-${Date.now()}-${index}`,
        order: index + aiQuestions.length,
        required: false,
        is_custom: false,
        pool: 'additional' as const
      }))

    return selectedQuestions

  } catch (error) {
    console.error('Error in selectRelevantBankQuestions:', error)
    // В случае ошибки возвращаем случайные вопросы
    return selectRandomBankQuestions(80, language)
  }
}

/**
 * Fallback: выбор случайных вопросов из банка
 */
function selectRandomBankQuestions(
  count: number,
  language: 'ru' | 'en'
): SurveyQuestionInstance[] {
  const shuffled = [...QUESTION_BANK].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map((q, index) => ({
    ...q,
    instance_id: `bank-inst-${Date.now()}-${index}`,
    order: index + 20, // После AI вопросов
    required: false,
    is_custom: false,
    pool: 'additional' as const
  }))
}
