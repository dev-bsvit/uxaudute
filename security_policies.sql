-- Часть 2: Настройка безопасности
-- Выполнить после создания таблиц

-- Включение Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_history ENABLE ROW LEVEL SECURITY;

-- Политики для profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для projects
CREATE POLICY "Users can view own projects" ON public.projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON public.projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
  FOR DELETE USING (auth.uid() = user_id);

-- Политики для audits
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

-- Политики для audit_history
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






