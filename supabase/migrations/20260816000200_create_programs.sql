-- Programs, blocks, and the block<->exercise placement (with per-placement overrides).

create type public.block_type as enum ('warmup', 'strength', 'mobility', 'cardio', 'cooldown');

create table public.programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index programs_user_id_idx on public.programs(user_id);

alter table public.programs enable row level security;
create policy "programs_select_own" on public.programs for select using (auth.uid() = user_id);
create policy "programs_insert_own" on public.programs for insert with check (auth.uid() = user_id);
create policy "programs_update_own" on public.programs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "programs_delete_own" on public.programs for delete using (auth.uid() = user_id);

create trigger programs_set_updated_at before update on public.programs
  for each row execute function public.set_updated_at();


create table public.program_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- denormalized for flat RLS, see README/CLAUDE.md
  program_id uuid not null references public.programs(id) on delete cascade,
  title text not null,
  subtitle text not null default '',
  block_type public.block_type not null,
  badge_color text not null default '#00F0FF',
  duration_minutes integer not null default 0,
  position integer not null,          -- 0-based ordering within the program
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (program_id, position) deferrable initially deferred
);

create index program_blocks_program_id_idx on public.program_blocks(program_id, position);
create index program_blocks_user_id_idx on public.program_blocks(user_id);

alter table public.program_blocks enable row level security;
create policy "program_blocks_select_own" on public.program_blocks for select using (auth.uid() = user_id);
create policy "program_blocks_insert_own" on public.program_blocks for insert with check (auth.uid() = user_id);
create policy "program_blocks_update_own" on public.program_blocks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "program_blocks_delete_own" on public.program_blocks for delete using (auth.uid() = user_id);

create trigger program_blocks_set_updated_at before update on public.program_blocks
  for each row execute function public.set_updated_at();


create table public.program_block_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,  -- denormalized for flat RLS
  block_id uuid not null references public.program_blocks(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  position integer not null,          -- 0-based ordering within the block
  -- Per-placement overrides; null = fall back to exercises.<column> default.
  sets_override integer,
  work_seconds_override integer,
  rest_seconds_override integer,
  reps_or_time_override text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (block_id, position) deferrable initially deferred
);

create index program_block_exercises_block_id_idx on public.program_block_exercises(block_id, position);
create index program_block_exercises_exercise_id_idx on public.program_block_exercises(exercise_id);
create index program_block_exercises_user_id_idx on public.program_block_exercises(user_id);

alter table public.program_block_exercises enable row level security;
create policy "pbe_select_own" on public.program_block_exercises for select using (auth.uid() = user_id);
create policy "pbe_insert_own" on public.program_block_exercises for insert with check (auth.uid() = user_id);
create policy "pbe_update_own" on public.program_block_exercises for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "pbe_delete_own" on public.program_block_exercises for delete using (auth.uid() = user_id);

create trigger pbe_set_updated_at before update on public.program_block_exercises
  for each row execute function public.set_updated_at();
