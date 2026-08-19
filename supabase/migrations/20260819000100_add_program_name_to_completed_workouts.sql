-- completed_workouts predates this repo's migration tracking (it was created by hand
-- in the Supabase dashboard, see README.md) and its original schema isn't reproduced
-- here -- but there's nothing stopping an *additive* change to an already-existing
-- table via a normal migration, same as any other table. This does not attempt to
-- reconstruct or manage the rest of that table's schema.
alter table public.completed_workouts
  add column if not exists program_name text;
