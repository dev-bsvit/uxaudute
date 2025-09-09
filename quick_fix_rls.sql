-- Быстрое исправление RLS политик
-- Выполнить в Supabase SQL Editor

-- Временно отключаем RLS для всех таблиц
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history DISABLE ROW LEVEL SECURITY;

-- Удаляем все существующие политики
DROP POLICY IF EXISTS "Enable all for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable all for projects" ON public.projects;
DROP POLICY IF EXISTS "Enable all for audits" ON public.audits;
DROP POLICY IF EXISTS "Enable all for audit_history" ON public.audit_history;
DROP POLICY IF EXISTS "Users can view own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can create own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can update own audits" ON public.audits;
DROP POLICY IF EXISTS "Users can delete own audits" ON public.audits;

-- Добавляем колонку user_id в audits если её нет
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'audits' AND column_name = 'user_id') THEN
        ALTER TABLE public.audits ADD COLUMN user_id uuid;
    END IF;
END $$;

-- Обновляем user_id для существующих записей
UPDATE public.audits 
SET user_id = (
  SELECT p.user_id 
  FROM public.projects p 
  WHERE p.id = audits.project_id
)
WHERE user_id IS NULL;

-- Делаем user_id NOT NULL
ALTER TABLE public.audits ALTER COLUMN user_id SET NOT NULL;

-- Добавляем внешний ключ
ALTER TABLE public.audits 
ADD CONSTRAINT fk_audits_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Создаем индекс
CREATE INDEX IF NOT EXISTS idx_audits_user_id ON public.audits(user_id);

-- Включаем RLS обратно
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- Создаем простые политики
CREATE POLICY "Allow all for profiles" ON public.profiles FOR ALL USING (true);
CREATE POLICY "Allow all for projects" ON public.projects FOR ALL USING (true);
CREATE POLICY "Allow all for audits" ON public.audits FOR ALL USING (true);
CREATE POLICY "Allow all for audit_history" ON public.audit_history FOR ALL USING (true);
