import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../utils/supabase', () => ({
  supabase: { rpc: vi.fn() },
}));
vi.mock('./programs', () => ({
  listPrograms: vi.fn(),
}));
vi.mock('../utils/storage', () => ({
  setActiveProgramId: vi.fn(),
}));

import { supabase } from '../utils/supabase';
import { listPrograms } from './programs';
import { setActiveProgramId } from '../utils/storage';
import { bootstrapDefaultProgramIfNeeded } from './programBootstrap';

describe('bootstrapDefaultProgramIfNeeded', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clones the template program and sets it active when the user has zero programs', async () => {
    (listPrograms as any).mockResolvedValue([]);
    (supabase.rpc as any).mockResolvedValue({ data: 'new-program-id', error: null });

    await bootstrapDefaultProgramIfNeeded('user-1');

    expect(supabase.rpc).toHaveBeenCalledWith('clone_template_program', { p_user_id: 'user-1' });
    expect(setActiveProgramId).toHaveBeenCalledWith('new-program-id');
  });

  it('does nothing when the user already has programs', async () => {
    (listPrograms as any).mockResolvedValue([{ id: 'existing' }]);

    await bootstrapDefaultProgramIfNeeded('user-1');

    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(setActiveProgramId).not.toHaveBeenCalled();
  });

  it('swallows errors rather than throwing (fire-and-forget from App.tsx)', async () => {
    (listPrograms as any).mockRejectedValue(new Error('network down'));

    await expect(bootstrapDefaultProgramIfNeeded('user-1')).resolves.toBeUndefined();
  });
});
