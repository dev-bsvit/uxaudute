-- Исправление политик Row Level Security
-- Выполнить в Supabase SQL Editor

-- Временно отключаем RLS для тестирования
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history DISABLE ROW LEVEL SECURITY;

-- Удаляем старые политики
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

DROP POLICY IF EXISTS "Users can view own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can create own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON public.projects;

DROP POLICY IF EXISTS "Users can view audits in own projects" ON public.audits;
DROP POLICY IF EXISTS "Users can create audits in own projects" ON public.audits;
DROP POLICY IF EXISTS "Users can update audits in own projects" ON public.audits;
DROP POLICY IF EXISTS "Users can delete audits in own projects" ON public.audits;

DROP POLICY IF EXISTS "Users can view audit history in own projects" ON public.audit_history;
DROP POLICY IF EXISTS "Users can create audit history in own projects" ON public.audit_history;

-- Создаем упрощенные политики
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- Простые политики для profiles
CREATE POLICY "Enable all for profiles" ON public.profiles
  FOR ALL USING (true);

-- Простые политики для projects
CREATE POLICY "Enable all for projects" ON public.projects
  FOR ALL USING (true);

-- Простые политики для audits
CREATE POLICY "Enable all for audits" ON public.audits
  FOR ALL USING (true);

-- Простые политики для audit_history
CREATE POLICY "Enable all for audit_history" ON public.audit_history
  FOR ALL USING (true);






