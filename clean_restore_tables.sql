-- Восстановление таблиц для UX Audit Platform
-- Выполнить в Supabase SQL Editor

-- 1. Создание таблицы profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Создание таблицы projects
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Создание таблицы audits
CREATE TABLE IF NOT EXISTS public.audits (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('research', 'collect', 'business', 'ab_test', 'hypotheses')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'failed')),
  input_data jsonb,
  result_data jsonb,
  annotations jsonb,
  confidence integer CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Создание таблицы audit_history
CREATE TABLE IF NOT EXISTS public.audit_history (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id uuid REFERENCES public.audits(id) ON DELETE CASCADE NOT NULL,
  action_type text NOT NULL,
  input_data jsonb,
  output_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Включение Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- 6. Создание политик безопасности для profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Создание политик безопасности для projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- 8. Создание политик безопасности для audits
CREATE POLICY "Users can view audits in own projects" ON public.audits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = audits.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create audits in own projects" ON public.audits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = audits.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update audits in own projects" ON public.audits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = audits.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete audits in own projects" ON public.audits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects 
      WHERE projects.id = audits.project_id 
      AND projects.user_id = auth.uid()
    )
  );

-- 9. Создание политик безопасности для audit_history
CREATE POLICY "Users can view audit history in own projects" ON public.audit_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.audits
      JOIN public.projects ON projects.id = audits.project_id
      WHERE audits.id = audit_history.audit_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create audit history in own projects" ON public.audit_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.audits
      JOIN public.projects ON projects.id = audits.project_id
      WHERE audits.id = audit_history.audit_id 
      AND projects.user_id = auth.uid()
    )
  );

-- 10. Создание функции для обновления updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Создание триггеров для updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.audits
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 12. Создание функции для автоматического создания профиля при регистрации
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Создание триггера для автоматического создания профиля
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 14. Создание bucket для загрузки файлов
INSERT INTO storage.buckets (id, name, public) 
VALUES ('audit-uploads', 'audit-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- 15. Создание политик для storage
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'audit-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own uploads" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'audit-uploads' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );







