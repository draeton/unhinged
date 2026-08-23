-- completed_workouts has select/insert/update policies (see
-- 20260817000100_create_completed_workouts.sql) but was missing a delete policy. Since
-- Postgres RLS filters rows a DELETE can touch rather than rejecting the statement, a
-- delete for a row with no matching policy still returns success with zero rows actually
-- removed -- the client sees a clean 204 and the workout silently reappears after the
-- next sync. Add the missing policy so deletes actually take effect.
create policy "Users can delete their own workouts" on public.completed_workouts
  for delete using (auth.uid() = user_id);
