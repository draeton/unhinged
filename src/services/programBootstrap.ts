import { supabase } from '../utils/supabase';
import { listPrograms } from './programs';
import { getActiveProgramId, setActiveProgramId } from '../utils/storage';

// Called once per authenticated session (from App.tsx's existing auth-state-change
// effect). Ensures the user ends up with a usable active-program pointer on *this*
// device/browser:
//  - Zero programs (a brand-new signup) -- clones the seeded template program (see
//    supabase/migrations) via the clone_template_program RPC, so existing behavior (a
//    ready-to-run 60-min program) keeps working out of the box.
//  - One or more programs already exist (e.g. the account has used another device, or
//    this browser's localStorage was cleared) but this device has no local
//    active-program-id pointer yet -- point at their first program rather than leaving
//    the Start Workout button stuck indefinitely with nothing to load.
// Cheap and idempotent (a couple of reads) so it's safe to call on every
// auth-state-change firing, not just first-ever login.
export async function bootstrapDefaultProgramIfNeeded(userId: string): Promise<void> {
  try {
    const existing = await listPrograms(userId);

    if (existing.length === 0) {
      const { data: newProgramId, error } = await supabase.rpc('clone_template_program', {
        p_user_id: userId,
      });
      if (error) throw error;

      setActiveProgramId(newProgramId as string);
      return;
    }

    if (!getActiveProgramId()) {
      setActiveProgramId(existing[0].id);
    }
  } catch (err) {
    console.error('Failed to bootstrap default program:', err);
  }
}
