-- Exercise library: user-owned, reusable exercises that program blocks pull from.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  work_seconds integer,               -- null = no work timer
  rest_seconds integer,               -- null = no rest timer
  sets integer not null default 1,
  reps_or_time text not null default '',
  target_muscles text[] not null default '{}',
  equipment text not null default '',
  description text not null default '',
  form_cues text[] not null default '{}',
  safety_tip text not null default '',
  video_urls jsonb not null default '[]',   -- [{title, url}]
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_user_id_idx on public.exercises(user_id);
create index exercises_user_id_name_idx on public.exercises(user_id, name);

alter table public.exercises enable row level security;

create policy "exercises_select_own" on public.exercises
  for select using (auth.uid() = user_id);
create policy "exercises_insert_own" on public.exercises
  for insert with check (auth.uid() = user_id);
create policy "exercises_update_own" on public.exercises
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exercises_delete_own" on public.exercises
  for delete using (auth.uid() = user_id);

create trigger exercises_set_updated_at before update on public.exercises
  for each row execute function public.set_updated_at();
