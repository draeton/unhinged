-- completed_workouts predates this repo's migration tracking (it was created by hand in
-- the Supabase dashboard, see 20260819000100_add_program_name_to_completed_workouts.sql
-- and README.md). This migration reconstructs its actual current schema -- table, RLS,
-- and existing policies -- so a fresh environment (supabase db reset, a new project) ends
-- up matching production, and so the schema is fully visible in the repo instead of only
-- in the dashboard. Every statement is written to be a no-op against a database that
-- already has these objects (production), since this is describing reality, not changing
-- it. Dated before 20260819000100 so a fresh replay creates the table before that
-- migration's `alter table` runs against it.
--
-- Note this reproduces an existing gap as-is: there is no delete policy on this table
-- (only select/insert/update), and no index on user_id. Fixing either is a separate
-- change.

create table if not exists public.completed_workouts (
  id uuid primary key,
  user_id uuid not null references auth.users(id),
  date timestamptz not null,
  duration_minutes integer not null,
  total_sets_completed integer not null,
  rpe integer not null,
  notes text,
  exercise_logs jsonb not null default '[]',
  created_at timestamptz default now()
);

alter table public.completed_workouts enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'completed_workouts'
      and policyname = 'Users can view their own workouts'
  ) then
    create policy "Users can view their own workouts" on public.completed_workouts
      for select using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'completed_workouts'
      and policyname = 'Users can insert their own workouts'
  ) then
    create policy "Users can insert their own workouts" on public.completed_workouts
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'completed_workouts'
      and policyname = 'Users can update their own workouts'
  ) then
    create policy "Users can update their own workouts" on public.completed_workouts
      for update using (auth.uid() = user_id);
  end if;
end $$;
