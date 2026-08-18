import { supabase } from '../utils/supabase';
import { listPrograms } from './programs';
import { setActiveProgramId } from '../utils/storage';

// Called once per authenticated session (from App.tsx's existing auth-state-change
// effect). If the user has zero programs -- true for every brand-new signup -- clones
// the seeded template program (see supabase/migrations) into their account via the
// clone_template_program RPC, so existing behavior (a ready-to-run 60-min program) keeps
// working out of the box. Cheap and idempotent (a single count check) so it's safe to
// call on every auth-state-change firing, not just first-ever login.
export async function bootstrapDefaultProgramIfNeeded(userId: string): Promise<void> {
  try {
    const existing = await listPrograms(userId);
    if (existing.length > 0) return;

    const { data: newProgramId, error } = await supabase.rpc('clone_template_program', {
      p_user_id: userId,
    });
    if (error) throw error;

    setActiveProgramId(newProgramId as string);
  } catch (err) {
    console.error('Failed to bootstrap default program:', err);
  }
}
