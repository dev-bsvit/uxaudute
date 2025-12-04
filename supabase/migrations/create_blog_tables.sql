-- =====================================================
-- BLOG СИСТЕМА - МИГРАЦИЯ БАЗЫ ДАННЫХ
-- =====================================================
-- Дата: 04.12.2025
-- Описание: Создание таблиц для SEO блога на основе аудитов
-- =====================================================

-- 1. Добавляем поле согласия на публикацию в таблицу audits
ALTER TABLE public.audits
ADD COLUMN IF NOT EXISTS allow_blog_publication BOOLEAN DEFAULT false;

COMMENT ON COLUMN public.audits.allow_blog_publication IS 'Разрешение пользователя на публикацию аудита в блог';

-- =====================================================
-- 2. Таблица категорий блога
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.blog_categories IS 'Категории статей блога (UX Аудит, Аналитика, Гипотезы)';

-- Вставляем начальные категории
INSERT INTO public.blog_categories (name, slug, description)
VALUES
  ('UX Аудит', 'ux-audit', 'Статьи об UX аудитах и исследованиях'),
  ('Аналитика', 'analytics', 'Аналитика продуктов и пользовательского поведения'),
  ('Гипотезы', 'hypotheses', 'Продуктовые гипотезы и их проверка')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 3. Таблица статей блога
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES public.audits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,

  -- Основной контент
  title VARCHAR(200) NOT NULL,
  slug VARCHAR(250) NOT NULL UNIQUE,
  excerpt TEXT, -- Краткое описание (150-200 символов)
  content TEXT NOT NULL, -- Полный текст статьи
  featured_image_url TEXT, -- Главное изображение (скриншот из аудита)

  -- SEO
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),
  keywords TEXT[], -- Массив ключевых слов

  -- Метаданные
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  language VARCHAR(5) DEFAULT 'ru' CHECK (language IN ('ru', 'ua', 'en')),
  views_count INTEGER DEFAULT 0,

  -- Даты
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Индексы для поиска
  search_vector TSVECTOR
);

COMMENT ON TABLE public.blog_posts IS 'Статьи блога, сгенерированные из аудитов';
COMMENT ON COLUMN public.blog_posts.status IS 'Статус: draft (черновик), published (опубликовано), archived (архив)';
COMMENT ON COLUMN public.blog_posts.search_vector IS 'Полнотекстовый поиск';

-- Создаём индексы для производительности
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON public.blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_user ON public.blog_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_audit ON public.blog_posts(audit_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_search ON public.blog_posts USING GIN(search_vector);

-- Триггер для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_blog_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_posts_updated_at ON public.blog_posts;
CREATE TRIGGER trigger_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_updated_at();

-- Триггер для обновления search_vector при изменении контента
CREATE OR REPLACE FUNCTION update_blog_posts_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('russian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('russian', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('russian', COALESCE(NEW.content, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_blog_posts_search_vector ON public.blog_posts;
CREATE TRIGGER trigger_blog_posts_search_vector
  BEFORE INSERT OR UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_posts_search_vector();

-- =====================================================
-- 4. Таблица переводов статей
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_post_translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  language VARCHAR(5) NOT NULL CHECK (language IN ('ru', 'ua', 'en')),

  -- Переведённый контент
  title VARCHAR(200) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  meta_title VARCHAR(60),
  meta_description VARCHAR(160),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Один перевод на один язык для одного поста
  UNIQUE(post_id, language)
);

COMMENT ON TABLE public.blog_post_translations IS 'Переводы статей блога на другие языки';

CREATE INDEX IF NOT EXISTS idx_blog_translations_post ON public.blog_post_translations(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_translations_language ON public.blog_post_translations(language);

-- =====================================================
-- 5. Таблица комментариев
-- =====================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE, -- Для ответов на комментарии

  content TEXT NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE public.blog_comments IS 'Комментарии к статьям блога';
COMMENT ON COLUMN public.blog_comments.parent_id IS 'ID родительского комментария для threaded comments';

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON public.blog_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_user ON public.blog_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_blog_comments_created ON public.blog_comments(created_at DESC);

-- =====================================================
-- 6. RLS (Row Level Security) Политики
-- =====================================================

-- Включаем RLS для всех таблиц
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_post_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- Политики для blog_categories (публичное чтение)
DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.blog_categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.blog_categories FOR SELECT
  USING (true);

-- Политики для blog_posts
DROP POLICY IF EXISTS "Published posts are viewable by everyone" ON public.blog_posts;
CREATE POLICY "Published posts are viewable by everyone"
  ON public.blog_posts FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "Users can view their own posts" ON public.blog_posts;
CREATE POLICY "Users can view their own posts"
  ON public.blog_posts FOR SELECT
  USING (auth.uid() = user_id);

-- Политики для blog_post_translations (публичное чтение опубликованных)
DROP POLICY IF EXISTS "Translations are viewable with published posts" ON public.blog_post_translations;
CREATE POLICY "Translations are viewable with published posts"
  ON public.blog_post_translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE id = post_id AND status = 'published'
    )
  );

-- Политики для blog_comments
DROP POLICY IF EXISTS "Comments are viewable on published posts" ON public.blog_comments;
CREATE POLICY "Comments are viewable on published posts"
  ON public.blog_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.blog_posts
      WHERE id = post_id AND status = 'published'
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.blog_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.blog_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.blog_comments;
CREATE POLICY "Users can update their own comments"
  ON public.blog_comments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.blog_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.blog_comments FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. Вывод информации
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '=== БЛОГ СИСТЕМА СОЗДАНА ===';
  RAISE NOTICE 'Таблицы:';
  RAISE NOTICE '  - blog_categories (3 категории)';
  RAISE NOTICE '  - blog_posts (с SEO полями)';
  RAISE NOTICE '  - blog_post_translations (мультиязычность)';
  RAISE NOTICE '  - blog_comments (с поддержкой ответов)';
  RAISE NOTICE '';
  RAISE NOTICE 'Добавлено поле audits.allow_blog_publication';
  RAISE NOTICE '';
  RAISE NOTICE 'RLS политики настроены';
  RAISE NOTICE 'Индексы для производительности созданы';
  RAISE NOTICE '================================';
END $$;
