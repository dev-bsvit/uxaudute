-- UX Audit Database Schema for Supabase

-- Enable Row Level Security
alter default privileges revoke execute on functions from public;

-- Users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Projects table
create table public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audits table
create table public.audits (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('research', 'collect', 'business', 'ab_test', 'hypotheses')),
  status text not null default 'draft' check (status in ('draft', 'in_progress', 'completed', 'failed')),
  input_data jsonb, -- Store URL, screenshot info, etc.
  result_data jsonb, -- Store analysis results
  annotations jsonb, -- Store canvas annotations data
  confidence integer check (confidence >= 0 and confidence <= 100),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Audit history for tracking conversation flow
create table public.audit_history (
  id uuid default gen_random_uuid() primary key,
  audit_id uuid references public.audits(id) on delete cascade not null,
  action_type text not null,
  input_data jsonb,
  output_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Storage for uploaded files (screenshots)
insert into storage.buckets (id, name, public) values ('audit-uploads', 'audit-uploads', false);

-- Row Level Security Policies

-- Profiles
alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Projects  
alter table public.projects enable row level security;
create policy "Users can view own projects" on public.projects
  for select using (auth.uid() = user_id);
create policy "Users can create own projects" on public.projects
  for insert with check (auth.uid() = user_id);
create policy "Users can update own projects" on public.projects
  for update using (auth.uid() = user_id);
create policy "Users can delete own projects" on public.projects
  for delete using (auth.uid() = user_id);

-- Audits
alter table public.audits enable row level security;
create policy "Users can view audits in own projects" on public.audits
  for select using (
    exists (
      select 1 from public.projects 
      where projects.id = audits.project_id 
      and projects.user_id = auth.uid()
    )
  );
create policy "Users can create audits in own projects" on public.audits
  for insert with check (
    exists (
      select 1 from public.projects 
      where projects.id = audits.project_id 
      and projects.user_id = auth.uid()
    )
  );
create policy "Users can update audits in own projects" on public.audits
  for update using (
    exists (
      select 1 from public.projects 
      where projects.id = audits.project_id 
      and projects.user_id = auth.uid()
    )
  );
create policy "Users can delete audits in own projects" on public.audits
  for delete using (
    exists (
      select 1 from public.projects 
      where projects.id = audits.project_id 
      and projects.user_id = auth.uid()
    )
  );

-- Audit History
alter table public.audit_history enable row level security;
create policy "Users can view audit history in own projects" on public.audit_history
  for select using (
    exists (
      select 1 from public.audits
      join public.projects on projects.id = audits.project_id
      where audits.id = audit_history.audit_id 
      and projects.user_id = auth.uid()
    )
  );
create policy "Users can create audit history in own projects" on public.audit_history
  for insert with check (
    exists (
      select 1 from public.audits
      join public.projects on projects.id = audits.project_id
      where audits.id = audit_history.audit_id 
      and projects.user_id = auth.uid()
    )
  );

-- Storage policies
create policy "Users can upload to own folder" on storage.objects
  for insert with check (
    bucket_id = 'audit-uploads' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view own uploads" on storage.objects
  for select using (
    bucket_id = 'audit-uploads' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Functions for updated_at triggers
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_updated_at before update on public.profiles
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.projects
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.audits
  for each row execute procedure public.handle_updated_at();

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
