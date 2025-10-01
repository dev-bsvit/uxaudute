-- Исправление таблицы audits - добавление колонки user_id
-- Выполнить в Supabase SQL Editor

-- Добавляем колонку user_id в таблицу audits
ALTER TABLE public.audits 
ADD COLUMN user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Обновляем существующие записи (если есть)
UPDATE public.audits 
SET user_id = (
  SELECT p.user_id 
  FROM public.projects p 
  WHERE p.id = audits.project_id
)
WHERE user_id IS NULL;

-- Делаем колонку NOT NULL после обновления
ALTER TABLE public.audits 
ALTER COLUMN user_id SET NOT NULL;

-- Создаем индекс для производительности
CREATE INDEX idx_audits_user_id ON public.audits(user_id);

-- Обновляем политики RLS для audits
DROP POLICY IF EXISTS "Enable all for audits" ON public.audits;

-- Создаем правильные политики для audits
CREATE POLICY "Users can view own audits" ON public.audits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own audits" ON public.audits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own audits" ON public.audits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own audits" ON public.audits
  FOR DELETE USING (auth.uid() = user_id);








