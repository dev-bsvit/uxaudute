/**
 * Банк вопросов для UX-опросов
 * 120 базовых вопросов, организованных по категориям
 */

export type QuestionCategory =
  | 'general'
  | 'ecommerce'
  | 'mobile'
  | 'marketing'
  | 'customer-experience'
  | 'feedback'
  | 'additional'
  | 'user-testing'
  | 'ux-audit'
  | 'user-profile'
  | 'final'
  | 'ai-general'
  | 'ai-interface'
  | 'ai-satisfaction'
  | 'ai-interests'
  | 'ai-feedback'
  | 'ai-comparison'
  | 'ai-engagement'
  | 'ai-acquisition'
  | 'ai-registration'
  | 'ai-profile'
  | 'ai-content'
  | 'ai-design'

export type QuestionType = 'yes-no' | 'text' | 'rating' | 'scale'

export interface SurveyQuestion {
  id: string
  category: QuestionCategory
  text_ru: string
  text_en: string
  type: QuestionType
  tags?: string[]
}

export const QUESTION_BANK: SurveyQuestion[] = [
  // Общие вопросы (10)
  {
    id: 'gen-1',
    category: 'general',
    text_ru: 'Как часто вы используете наш продукт/сервис?',
    text_en: 'How often do you use our product/service?',
    type: 'scale',
    tags: ['usage', 'frequency']
  },
  {
    id: 'gen-2',
    category: 'general',
    text_ru: 'Что вас привлекло в нашем продукте/сервисе?',
    text_en: 'What attracted you to our product/service?',
    type: 'text',
    tags: ['motivation', 'value']
  },
  {
    id: 'gen-3',
    category: 'general',
    text_ru: 'Каким образом вы узнали о нашем продукте/сервисе?',
    text_en: 'How did you learn about our product/service?',
    type: 'text',
    tags: ['acquisition', 'discovery']
  },
  {
    id: 'gen-4',
    category: 'general',
    text_ru: 'Что вам нравится больше всего в нашем продукте?',
    text_en: 'What do you like most about our product?',
    type: 'text',
    tags: ['satisfaction', 'positive']
  },
  {
    id: 'gen-5',
    category: 'general',
    text_ru: 'Насколько интуитивен наш интерфейс?',
    text_en: 'How intuitive is our interface?',
    type: 'rating',
    tags: ['usability', 'interface']
  },
  {
    id: 'gen-6',
    category: 'general',
    text_ru: 'Что вам нравится меньше всего?',
    text_en: 'What do you like least?',
    type: 'text',
    tags: ['pain-points', 'negative']
  },
  {
    id: 'gen-7',
    category: 'general',
    text_ru: 'Есть ли функции, которые вы не используете?',
    text_en: 'Are there features you don\'t use?',
    type: 'text',
    tags: ['features', 'usage']
  },
  {
    id: 'gen-8',
    category: 'general',
    text_ru: 'Что, по вашему мнению, нам стоит улучшить?',
    text_en: 'What do you think we should improve?',
    type: 'text',
    tags: ['improvement', 'suggestions']
  },
  {
    id: 'gen-9',
    category: 'general',
    text_ru: 'Какова ваша общая оценка нашего продукта/сервиса?',
    text_en: 'What is your overall rating of our product/service?',
    type: 'rating',
    tags: ['satisfaction', 'nps']
  },
  {
    id: 'gen-10',
    category: 'general',
    text_ru: 'Рекомендовали бы вы нас друзьям или коллегам?',
    text_en: 'Would you recommend us to friends or colleagues?',
    type: 'yes-no',
    tags: ['nps', 'recommendation']
  },

  // E-commerce (10)
  {
    id: 'ecom-1',
    category: 'ecommerce',
    text_ru: 'Каково ваше впечатление от процесса размещения заказа?',
    text_en: 'What is your impression of the order placement process?',
    type: 'rating',
    tags: ['checkout', 'conversion']
  },
  {
    id: 'ecom-2',
    category: 'ecommerce',
    text_ru: 'Оцените удобство поиска на сайте.',
    text_en: 'Rate the convenience of site search.',
    type: 'rating',
    tags: ['search', 'navigation']
  },
  {
    id: 'ecom-3',
    category: 'ecommerce',
    text_ru: 'Что бы вы хотели видеть в ассортименте, чего сейчас не хватает?',
    text_en: 'What would you like to see in the assortment that is currently missing?',
    type: 'text',
    tags: ['products', 'catalog']
  },
  {
    id: 'ecom-4',
    category: 'ecommerce',
    text_ru: 'Какова была скорость доставки?',
    text_en: 'What was the delivery speed?',
    type: 'rating',
    tags: ['delivery', 'logistics']
  },
  {
    id: 'ecom-5',
    category: 'ecommerce',
    text_ru: 'Возникали ли проблемы с возвратом товаров?',
    text_en: 'Were there any problems with product returns?',
    type: 'yes-no',
    tags: ['returns', 'support']
  },
  {
    id: 'ecom-6',
    category: 'ecommerce',
    text_ru: 'Как вы оцениваете качество товаров?',
    text_en: 'How do you rate the quality of products?',
    type: 'rating',
    tags: ['quality', 'products']
  },
  {
    id: 'ecom-7',
    category: 'ecommerce',
    text_ru: 'Насколько удобна система скидок?',
    text_en: 'How convenient is the discount system?',
    type: 'rating',
    tags: ['pricing', 'promotions']
  },
  {
    id: 'ecom-8',
    category: 'ecommerce',
    text_ru: 'Используете ли вы мобильное приложение для покупок?',
    text_en: 'Do you use the mobile app for shopping?',
    type: 'yes-no',
    tags: ['mobile', 'channels']
  },
  {
    id: 'ecom-9',
    category: 'ecommerce',
    text_ru: 'Каково ваше мнение о фотографиях товаров?',
    text_en: 'What is your opinion about product photos?',
    type: 'rating',
    tags: ['visuals', 'content']
  },
  {
    id: 'ecom-10',
    category: 'ecommerce',
    text_ru: 'Как бы вы оценили работу поддержки?',
    text_en: 'How would you rate the support service?',
    type: 'rating',
    tags: ['support', 'service']
  },

  // Мобильные приложения (10)
  {
    id: 'mob-1',
    category: 'mobile',
    text_ru: 'Сколько времени вы обычно проводите в приложении?',
    text_en: 'How much time do you usually spend in the app?',
    type: 'text',
    tags: ['engagement', 'usage']
  },
  {
    id: 'mob-2',
    category: 'mobile',
    text_ru: 'Были ли ошибки или сбои?',
    text_en: 'Were there any errors or crashes?',
    type: 'yes-no',
    tags: ['bugs', 'stability']
  },
  {
    id: 'mob-3',
    category: 'mobile',
    text_ru: 'Чего не хватает в мобильном приложении?',
    text_en: 'What is missing in the mobile app?',
    type: 'text',
    tags: ['features', 'improvements']
  },
  {
    id: 'mob-4',
    category: 'mobile',
    text_ru: 'Насколько удобен интерфейс?',
    text_en: 'How convenient is the interface?',
    type: 'rating',
    tags: ['ui', 'usability']
  },
  {
    id: 'mob-5',
    category: 'mobile',
    text_ru: 'Активируете ли вы push-уведомления?',
    text_en: 'Do you enable push notifications?',
    type: 'yes-no',
    tags: ['notifications', 'engagement']
  },
  {
    id: 'mob-6',
    category: 'mobile',
    text_ru: 'Какую новую функцию вы бы предложили?',
    text_en: 'What new feature would you suggest?',
    type: 'text',
    tags: ['features', 'ideas']
  },
  {
    id: 'mob-7',
    category: 'mobile',
    text_ru: 'Как вы оцениваете дизайн приложения?',
    text_en: 'How do you rate the app design?',
    type: 'rating',
    tags: ['design', 'visual']
  },
  {
    id: 'mob-8',
    category: 'mobile',
    text_ru: 'Что вам нравится в мобильной версии?',
    text_en: 'What do you like about the mobile version?',
    type: 'text',
    tags: ['positive', 'mobile']
  },
  {
    id: 'mob-9',
    category: 'mobile',
    text_ru: 'Что вас не устраивает в мобильной версии?',
    text_en: 'What doesn\'t satisfy you in the mobile version?',
    type: 'text',
    tags: ['negative', 'mobile']
  },
  {
    id: 'mob-10',
    category: 'mobile',
    text_ru: 'Насколько быстро загружается приложение?',
    text_en: 'How fast does the app load?',
    type: 'rating',
    tags: ['performance', 'speed']
  },

  // Маркетинг (10)
  {
    id: 'mkt-1',
    category: 'marketing',
    text_ru: 'Как вы оцениваете нашу SEO-стратегию?',
    text_en: 'How do you rate our SEO strategy?',
    type: 'rating',
    tags: ['seo', 'discovery']
  },
  {
    id: 'mkt-2',
    category: 'marketing',
    text_ru: 'Какие соцсети лучше подходят для продвижения?',
    text_en: 'Which social networks are better for promotion?',
    type: 'text',
    tags: ['social', 'channels']
  },
  {
    id: 'mkt-3',
    category: 'marketing',
    text_ru: 'Насколько персонализировано взаимодействие?',
    text_en: 'How personalized is the interaction?',
    type: 'rating',
    tags: ['personalization', 'communication']
  },
  {
    id: 'mkt-4',
    category: 'marketing',
    text_ru: 'Что можно улучшить на сайте?',
    text_en: 'What can be improved on the website?',
    type: 'text',
    tags: ['website', 'improvements']
  },
  {
    id: 'mkt-5',
    category: 'marketing',
    text_ru: 'Как вы оцениваете рекламные материалы?',
    text_en: 'How do you rate the advertising materials?',
    type: 'rating',
    tags: ['advertising', 'content']
  },
  {
    id: 'mkt-6',
    category: 'marketing',
    text_ru: 'Как вы относитесь к рекламной кампании?',
    text_en: 'What do you think about the advertising campaign?',
    type: 'rating',
    tags: ['campaigns', 'advertising']
  },
  {
    id: 'mkt-7',
    category: 'marketing',
    text_ru: 'Что вы думаете о контент-маркетинге?',
    text_en: 'What do you think about content marketing?',
    type: 'text',
    tags: ['content', 'marketing']
  },
  {
    id: 'mkt-8',
    category: 'marketing',
    text_ru: 'Что вы думаете о наших акциях?',
    text_en: 'What do you think about our promotions?',
    type: 'rating',
    tags: ['promotions', 'offers']
  },
  {
    id: 'mkt-9',
    category: 'marketing',
    text_ru: 'Как вы оцениваете систему лояльности?',
    text_en: 'How do you rate the loyalty system?',
    type: 'rating',
    tags: ['loyalty', 'retention']
  },
  {
    id: 'mkt-10',
    category: 'marketing',
    text_ru: 'Что бы вы изменили в рекламных материалах?',
    text_en: 'What would you change in the advertising materials?',
    type: 'text',
    tags: ['advertising', 'improvements']
  },

  // Клиентский опыт (5)
  {
    id: 'cx-1',
    category: 'customer-experience',
    text_ru: 'Что делает наш продукт уникальным?',
    text_en: 'What makes our product unique?',
    type: 'text',
    tags: ['differentiation', 'value']
  },
  {
    id: 'cx-2',
    category: 'customer-experience',
    text_ru: 'Что было наиболее приятным в взаимодействии?',
    text_en: 'What was most pleasant about the interaction?',
    type: 'text',
    tags: ['positive', 'experience']
  },
  {
    id: 'cx-3',
    category: 'customer-experience',
    text_ru: 'Как вы оцениваете общее впечатление от использования?',
    text_en: 'How do you rate the overall experience?',
    type: 'rating',
    tags: ['satisfaction', 'overall']
  },
  {
    id: 'cx-4',
    category: 'customer-experience',
    text_ru: 'Что можно улучшить в обслуживании?',
    text_en: 'What can be improved in the service?',
    type: 'text',
    tags: ['service', 'improvements']
  },
  {
    id: 'cx-5',
    category: 'customer-experience',
    text_ru: 'Были ли негативные моменты?',
    text_en: 'Were there any negative moments?',
    type: 'text',
    tags: ['negative', 'pain-points']
  },

  // Обратная связь (5)
  {
    id: 'fb-1',
    category: 'feedback',
    text_ru: 'Что вы думаете о качестве поддержки?',
    text_en: 'What do you think about the quality of support?',
    type: 'rating',
    tags: ['support', 'quality']
  },
  {
    id: 'fb-2',
    category: 'feedback',
    text_ru: 'Удовлетворены ли скоростью ответа?',
    text_en: 'Are you satisfied with the response speed?',
    type: 'yes-no',
    tags: ['support', 'speed']
  },
  {
    id: 'fb-3',
    category: 'feedback',
    text_ru: 'Какие изменения вы бы предложили в системе обратной связи?',
    text_en: 'What changes would you suggest in the feedback system?',
    type: 'text',
    tags: ['feedback', 'improvements']
  },
  {
    id: 'fb-4',
    category: 'feedback',
    text_ru: 'Как бы вы оценили скорость решения проблем?',
    text_en: 'How would you rate the problem resolution speed?',
    type: 'rating',
    tags: ['support', 'resolution']
  },
  {
    id: 'fb-5',
    category: 'feedback',
    text_ru: 'Какие каналы связи вам удобнее?',
    text_en: 'Which communication channels are more convenient for you?',
    type: 'text',
    tags: ['channels', 'communication']
  },

  // Дополнительные вопросы (5)
  {
    id: 'add-1',
    category: 'additional',
    text_ru: 'Как вы оцениваете функционал создания опросов?',
    text_en: 'How do you rate the survey creation functionality?',
    type: 'rating',
    tags: ['features', 'surveys']
  },
  {
    id: 'add-2',
    category: 'additional',
    text_ru: 'Какие требования к безопасности важны для вас?',
    text_en: 'What security requirements are important to you?',
    type: 'text',
    tags: ['security', 'privacy']
  },
  {
    id: 'add-3',
    category: 'additional',
    text_ru: 'Что бы вы хотели добавить или изменить в продукте?',
    text_en: 'What would you like to add or change in the product?',
    type: 'text',
    tags: ['improvements', 'features']
  },
  {
    id: 'add-4',
    category: 'additional',
    text_ru: 'Что вы думаете о тарифах?',
    text_en: 'What do you think about the pricing?',
    type: 'rating',
    tags: ['pricing', 'value']
  },
  {
    id: 'add-5',
    category: 'additional',
    text_ru: 'Какие партнерские программы вам интересны?',
    text_en: 'What partnership programs interest you?',
    type: 'text',
    tags: ['partnerships', 'business']
  },

  // Пользовательское тестирование (5)
  {
    id: 'ut-1',
    category: 'user-testing',
    text_ru: 'С какими задачами вы применяли продукт?',
    text_en: 'What tasks did you use the product for?',
    type: 'text',
    tags: ['tasks', 'usage']
  },
  {
    id: 'ut-2',
    category: 'user-testing',
    text_ru: 'Сталкивались ли вы с трудностями?',
    text_en: 'Did you encounter any difficulties?',
    type: 'yes-no',
    tags: ['pain-points', 'usability']
  },
  {
    id: 'ut-3',
    category: 'user-testing',
    text_ru: 'Что было наиболее удобным?',
    text_en: 'What was most convenient?',
    type: 'text',
    tags: ['positive', 'usability']
  },
  {
    id: 'ut-4',
    category: 'user-testing',
    text_ru: 'Что было наименее удобным?',
    text_en: 'What was least convenient?',
    type: 'text',
    tags: ['negative', 'usability']
  },
  {
    id: 'ut-5',
    category: 'user-testing',
    text_ru: 'Какие функции хотели бы видеть в будущем?',
    text_en: 'What features would you like to see in the future?',
    type: 'text',
    tags: ['features', 'wishlist']
  },

  // UX-аудит (5)
  {
    id: 'ux-1',
    category: 'ux-audit',
    text_ru: 'Как вы оцениваете навигацию?',
    text_en: 'How do you rate the navigation?',
    type: 'rating',
    tags: ['navigation', 'usability']
  },
  {
    id: 'ux-2',
    category: 'ux-audit',
    text_ru: 'Есть ли лишние элементы?',
    text_en: 'Are there any unnecessary elements?',
    type: 'yes-no',
    tags: ['ui', 'clutter']
  },
  {
    id: 'ux-3',
    category: 'ux-audit',
    text_ru: 'Что вы думаете о цветах и шрифтах?',
    text_en: 'What do you think about colors and fonts?',
    type: 'rating',
    tags: ['design', 'visual']
  },
  {
    id: 'ux-4',
    category: 'ux-audit',
    text_ru: 'Как оцениваете скорость загрузки и производительность?',
    text_en: 'How do you rate the loading speed and performance?',
    type: 'rating',
    tags: ['performance', 'speed']
  },
  {
    id: 'ux-5',
    category: 'ux-audit',
    text_ru: 'Какие предложения у вас есть по улучшению UX?',
    text_en: 'What suggestions do you have for UX improvements?',
    type: 'text',
    tags: ['ux', 'improvements']
  },

  // Профиль пользователя (5)
  {
    id: 'up-1',
    category: 'user-profile',
    text_ru: 'Каков ваш опыт работы и сфера деятельности?',
    text_en: 'What is your work experience and field of activity?',
    type: 'text',
    tags: ['demographics', 'professional']
  },
  {
    id: 'up-2',
    category: 'user-profile',
    text_ru: 'Каков уровень знаний в подобных продуктах?',
    text_en: 'What is your knowledge level with similar products?',
    type: 'scale',
    tags: ['expertise', 'experience']
  },
  {
    id: 'up-3',
    category: 'user-profile',
    text_ru: 'Какие другие продукты вы используете?',
    text_en: 'What other products do you use?',
    type: 'text',
    tags: ['competitors', 'alternatives']
  },
  {
    id: 'up-4',
    category: 'user-profile',
    text_ru: 'Что является ключевым при выборе продукта?',
    text_en: 'What is key when choosing a product?',
    type: 'text',
    tags: ['criteria', 'decision']
  },
  {
    id: 'up-5',
    category: 'user-profile',
    text_ru: 'Какой формат обучения вы предпочитаете?',
    text_en: 'What learning format do you prefer?',
    type: 'text',
    tags: ['learning', 'onboarding']
  },

  // Заключительные вопросы (5)
  {
    id: 'fin-1',
    category: 'final',
    text_ru: 'Что, по вашему мнению, является нашим главным преимуществом?',
    text_en: 'What, in your opinion, is our main advantage?',
    type: 'text',
    tags: ['strengths', 'value']
  },
  {
    id: 'fin-2',
    category: 'final',
    text_ru: 'Что бы вы хотели сообщить команде?',
    text_en: 'What would you like to tell the team?',
    type: 'text',
    tags: ['feedback', 'message']
  },
  {
    id: 'fin-3',
    category: 'final',
    text_ru: 'Какие дополнительные услуги были бы полезны?',
    text_en: 'What additional services would be useful?',
    type: 'text',
    tags: ['services', 'features']
  },
  {
    id: 'fin-4',
    category: 'final',
    text_ru: 'Что вы хотите видеть в следующем обновлении?',
    text_en: 'What do you want to see in the next update?',
    type: 'text',
    tags: ['roadmap', 'features']
  },
  {
    id: 'fin-5',
    category: 'final',
    text_ru: 'Планируете ли вы продолжать использовать продукт?',
    text_en: 'Do you plan to continue using the product?',
    type: 'yes-no',
    tags: ['retention', 'loyalty']
  },

  // AI-добавленные вопросы - Общая информация (5)
  {
    id: 'ai-gen-1',
    category: 'ai-general',
    text_ru: 'Каким образом вы узнали о нашем продукте?',
    text_en: 'How did you learn about our product?',
    type: 'text',
    tags: ['acquisition', 'discovery']
  },
  {
    id: 'ai-gen-2',
    category: 'ai-general',
    text_ru: 'С какой целью вы обращаетесь к нему?',
    text_en: 'What is your purpose for using it?',
    type: 'text',
    tags: ['goals', 'motivation']
  },
  {
    id: 'ai-gen-3',
    category: 'ai-general',
    text_ru: 'Как долго вы уже пользуетесь продуктом?',
    text_en: 'How long have you been using the product?',
    type: 'text',
    tags: ['tenure', 'loyalty']
  },
  {
    id: 'ai-gen-4',
    category: 'ai-general',
    text_ru: 'Как часто вы используете его?',
    text_en: 'How often do you use it?',
    type: 'scale',
    tags: ['frequency', 'engagement']
  },
  {
    id: 'ai-gen-5',
    category: 'ai-general',
    text_ru: 'Что привлекло ваше внимание при первом знакомстве?',
    text_en: 'What caught your attention during first contact?',
    type: 'text',
    tags: ['first-impression', 'value']
  },

  // AI - Интерфейс и навигация (5)
  {
    id: 'ai-int-1',
    category: 'ai-interface',
    text_ru: 'Оцените удобство основного экрана.',
    text_en: 'Rate the convenience of the main screen.',
    type: 'rating',
    tags: ['ui', 'dashboard']
  },
  {
    id: 'ai-int-2',
    category: 'ai-interface',
    text_ru: 'Как вы оцениваете навигацию?',
    text_en: 'How do you rate the navigation?',
    type: 'rating',
    tags: ['navigation', 'usability']
  },
  {
    id: 'ai-int-3',
    category: 'ai-interface',
    text_ru: 'Насколько интерфейс понятен и логичен?',
    text_en: 'How clear and logical is the interface?',
    type: 'rating',
    tags: ['clarity', 'logic']
  },
  {
    id: 'ai-int-4',
    category: 'ai-interface',
    text_ru: 'Есть ли функции, которые вы не используете из-за сложности?',
    text_en: 'Are there features you don\'t use due to complexity?',
    type: 'yes-no',
    tags: ['complexity', 'adoption']
  },
  {
    id: 'ai-int-5',
    category: 'ai-interface',
    text_ru: 'Как вы оцениваете скорость загрузки?',
    text_en: 'How do you rate the loading speed?',
    type: 'rating',
    tags: ['performance', 'speed']
  },

  // AI - Удовлетворенность (4)
  {
    id: 'ai-sat-1',
    category: 'ai-satisfaction',
    text_ru: 'Насколько вы удовлетворены продуктом?',
    text_en: 'How satisfied are you with the product?',
    type: 'rating',
    tags: ['satisfaction', 'overall']
  },
  {
    id: 'ai-sat-2',
    category: 'ai-satisfaction',
    text_ru: 'Что вам нравится больше всего?',
    text_en: 'What do you like most?',
    type: 'text',
    tags: ['positive', 'strengths']
  },
  {
    id: 'ai-sat-3',
    category: 'ai-satisfaction',
    text_ru: 'Что вызывает недовольство?',
    text_en: 'What causes dissatisfaction?',
    type: 'text',
    tags: ['negative', 'pain-points']
  },
  {
    id: 'ai-sat-4',
    category: 'ai-satisfaction',
    text_ru: 'Как вы оцениваете качество работы функций?',
    text_en: 'How do you rate the quality of features?',
    type: 'rating',
    tags: ['quality', 'features']
  },

  // AI - Интересы и предпочтения (4)
  {
    id: 'ai-int-pref-1',
    category: 'ai-interests',
    text_ru: 'Какие функции вы хотели бы видеть в будущем?',
    text_en: 'What features would you like to see in the future?',
    type: 'text',
    tags: ['wishlist', 'roadmap']
  },
  {
    id: 'ai-int-pref-2',
    category: 'ai-interests',
    text_ru: 'Какой формат обучения вы предпочитаете?',
    text_en: 'What learning format do you prefer?',
    type: 'text',
    tags: ['learning', 'onboarding']
  },
  {
    id: 'ai-int-pref-3',
    category: 'ai-interests',
    text_ru: 'Какие другие сервисы вы используете?',
    text_en: 'What other services do you use?',
    type: 'text',
    tags: ['competitors', 'ecosystem']
  },
  {
    id: 'ai-int-pref-4',
    category: 'ai-interests',
    text_ru: 'Что вам больше всего нравится в других продуктах?',
    text_en: 'What do you like most in other products?',
    type: 'text',
    tags: ['benchmarking', 'inspiration']
  },

  // AI - Обратная связь (4)
  {
    id: 'ai-fb-1',
    category: 'ai-feedback',
    text_ru: 'Как улучшить процесс обслуживания?',
    text_en: 'How to improve the service process?',
    type: 'text',
    tags: ['service', 'improvements']
  },
  {
    id: 'ai-fb-2',
    category: 'ai-feedback',
    text_ru: 'Какие изменения вы предложили бы в обратной связи?',
    text_en: 'What changes would you suggest in feedback?',
    type: 'text',
    tags: ['feedback', 'improvements']
  },
  {
    id: 'ai-fb-3',
    category: 'ai-feedback',
    text_ru: 'Как вы оцениваете скорость реагирования?',
    text_en: 'How do you rate the response speed?',
    type: 'rating',
    tags: ['responsiveness', 'support']
  },
  {
    id: 'ai-fb-4',
    category: 'ai-feedback',
    text_ru: 'Какие дополнительные услуги вам были бы полезны?',
    text_en: 'What additional services would be useful to you?',
    type: 'text',
    tags: ['services', 'features']
  },

  // AI - Сравнение с конкурентами (3)
  {
    id: 'ai-comp-1',
    category: 'ai-comparison',
    text_ru: 'Что в нашем продукте лучше или хуже?',
    text_en: 'What is better or worse in our product?',
    type: 'text',
    tags: ['comparison', 'competitive']
  },
  {
    id: 'ai-comp-2',
    category: 'ai-comparison',
    text_ru: 'Что заставило бы вас перейти к конкуренту?',
    text_en: 'What would make you switch to a competitor?',
    type: 'text',
    tags: ['churn', 'retention']
  },
  {
    id: 'ai-comp-3',
    category: 'ai-comparison',
    text_ru: 'Почему вы выбрали именно нас?',
    text_en: 'Why did you choose us?',
    type: 'text',
    tags: ['decision', 'value']
  },

  // AI - Опыт и вовлеченность (3)
  {
    id: 'ai-eng-1',
    category: 'ai-engagement',
    text_ru: 'Как часто вы пользуетесь продуктом?',
    text_en: 'How often do you use the product?',
    type: 'scale',
    tags: ['frequency', 'usage']
  },
  {
    id: 'ai-eng-2',
    category: 'ai-engagement',
    text_ru: 'Что заставляет вас возвращаться?',
    text_en: 'What makes you come back?',
    type: 'text',
    tags: ['retention', 'habit']
  },
  {
    id: 'ai-eng-3',
    category: 'ai-engagement',
    text_ru: 'Как вы оцениваете свой опыт по шкале 1–10?',
    text_en: 'How do you rate your experience on a scale of 1-10?',
    type: 'rating',
    tags: ['nps', 'satisfaction']
  },

  // AI - Привлечение пользователей (2)
  {
    id: 'ai-acq-1',
    category: 'ai-acquisition',
    text_ru: 'Через какие каналы вы узнали о продукте?',
    text_en: 'Through which channels did you learn about the product?',
    type: 'text',
    tags: ['channels', 'discovery']
  },
  {
    id: 'ai-acq-2',
    category: 'ai-acquisition',
    text_ru: 'Были ли трудности при первом знакомстве?',
    text_en: 'Were there difficulties during first contact?',
    type: 'yes-no',
    tags: ['onboarding', 'friction']
  },

  // AI - Регистрация и начало (2)
  {
    id: 'ai-reg-1',
    category: 'ai-registration',
    text_ru: 'Как бы вы оценили процесс регистрации?',
    text_en: 'How would you rate the registration process?',
    type: 'rating',
    tags: ['registration', 'onboarding']
  },
  {
    id: 'ai-reg-2',
    category: 'ai-registration',
    text_ru: 'Что было сложным в начале использования?',
    text_en: 'What was difficult when starting to use?',
    type: 'text',
    tags: ['onboarding', 'friction']
  },

  // AI - Профиль и настройки (2)
  {
    id: 'ai-prof-1',
    category: 'ai-profile',
    text_ru: 'Насколько легко изменить настройки профиля?',
    text_en: 'How easy is it to change profile settings?',
    type: 'rating',
    tags: ['settings', 'usability']
  },
  {
    id: 'ai-prof-2',
    category: 'ai-profile',
    text_ru: 'Есть ли что-то, что вы хотите настроить, но не можете?',
    text_en: 'Is there something you want to configure but can\'t?',
    type: 'text',
    tags: ['customization', 'limitations']
  },

  // AI - Информация и контент (2)
  {
    id: 'ai-cont-1',
    category: 'ai-content',
    text_ru: 'Насколько полезна предоставленная информация?',
    text_en: 'How useful is the provided information?',
    type: 'rating',
    tags: ['content', 'value']
  },
  {
    id: 'ai-cont-2',
    category: 'ai-content',
    text_ru: 'Чего вам не хватает в контенте?',
    text_en: 'What is missing in the content?',
    type: 'text',
    tags: ['content', 'gaps']
  },

  // AI - Дизайн (2)
  {
    id: 'ai-des-1',
    category: 'ai-design',
    text_ru: 'Что вы думаете о визуальном оформлении?',
    text_en: 'What do you think about the visual design?',
    type: 'rating',
    tags: ['design', 'visual']
  },
  {
    id: 'ai-des-2',
    category: 'ai-design',
    text_ru: 'Насколько удобно воспринимается информация в интерфейсе?',
    text_en: 'How easy is it to perceive information in the interface?',
    type: 'rating',
    tags: ['readability', 'information-architecture']
  }
]

export const getCategoryLabel = (category: QuestionCategory, lang: 'ru' | 'en' = 'ru'): string => {
  const labels: Record<QuestionCategory, { ru: string; en: string }> = {
    'general': { ru: 'Общие вопросы', en: 'General Questions' },
    'ecommerce': { ru: 'E-commerce', en: 'E-commerce' },
    'mobile': { ru: 'Мобильные приложения', en: 'Mobile Apps' },
    'marketing': { ru: 'Маркетинг', en: 'Marketing' },
    'customer-experience': { ru: 'Клиентский опыт', en: 'Customer Experience' },
    'feedback': { ru: 'Обратная связь', en: 'Feedback' },
    'additional': { ru: 'Дополнительные', en: 'Additional' },
    'user-testing': { ru: 'Пользовательское тестирование', en: 'User Testing' },
    'ux-audit': { ru: 'UX-аудит', en: 'UX Audit' },
    'user-profile': { ru: 'Профиль пользователя', en: 'User Profile' },
    'final': { ru: 'Заключительные', en: 'Final Questions' },
    'ai-general': { ru: 'AI: Общая информация', en: 'AI: General Info' },
    'ai-interface': { ru: 'AI: Интерфейс', en: 'AI: Interface' },
    'ai-satisfaction': { ru: 'AI: Удовлетворенность', en: 'AI: Satisfaction' },
    'ai-interests': { ru: 'AI: Интересы', en: 'AI: Interests' },
    'ai-feedback': { ru: 'AI: Обратная связь', en: 'AI: Feedback' },
    'ai-comparison': { ru: 'AI: Сравнение', en: 'AI: Comparison' },
    'ai-engagement': { ru: 'AI: Вовлеченность', en: 'AI: Engagement' },
    'ai-acquisition': { ru: 'AI: Привлечение', en: 'AI: Acquisition' },
    'ai-registration': { ru: 'AI: Регистрация', en: 'AI: Registration' },
    'ai-profile': { ru: 'AI: Профиль', en: 'AI: Profile' },
    'ai-content': { ru: 'AI: Контент', en: 'AI: Content' },
    'ai-design': { ru: 'AI: Дизайн', en: 'AI: Design' }
  }

  return labels[category][lang]
}

export const getQuestionsByCategory = (category: QuestionCategory): SurveyQuestion[] => {
  return QUESTION_BANK.filter(q => q.category === category)
}

export const getQuestionsByTags = (tags: string[]): SurveyQuestion[] => {
  return QUESTION_BANK.filter(q =>
    q.tags?.some(tag => tags.includes(tag))
  )
}
