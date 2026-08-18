import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../services/programs', () => ({
  getResolvedProgram: vi.fn(),
}));
vi.mock('../utils/storage', () => ({
  getActiveProgramId: vi.fn(),
  getCachedActiveProgram: vi.fn(),
  setCachedActiveProgram: vi.fn(),
}));

import { getResolvedProgram } from '../services/programs';
import { getActiveProgramId, getCachedActiveProgram, setCachedActiveProgram } from '../utils/storage';
import { useActiveProgram } from './useActiveProgram';

const RESOLVED = { id: 'prog-1', name: 'Test Program', blocks: [] };

describe('useActiveProgram', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and caches the active program on success', async () => {
    (getActiveProgramId as any).mockReturnValue('prog-1');
    (getResolvedProgram as any).mockResolvedValue(RESOLVED);

    const { result } = renderHook(() => useActiveProgram('user-1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.program).toEqual(RESOLVED);
    expect(result.current.error).toBeNull();
    expect(setCachedActiveProgram).toHaveBeenCalledWith(RESOLVED);
  });

  it('falls back to the cached program when the fetch fails', async () => {
    (getActiveProgramId as any).mockReturnValue('prog-1');
    (getResolvedProgram as any).mockRejectedValue(new Error('offline'));
    (getCachedActiveProgram as any).mockReturnValue(RESOLVED);

    const { result } = renderHook(() => useActiveProgram('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.program).toEqual(RESOLVED);
    expect(result.current.error).toBeNull();
  });

  it('surfaces an error when the fetch fails and there is no cache', async () => {
    (getActiveProgramId as any).mockReturnValue('prog-1');
    (getResolvedProgram as any).mockRejectedValue(new Error('offline'));
    (getCachedActiveProgram as any).mockReturnValue(null);

    const { result } = renderHook(() => useActiveProgram('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.program).toBeNull();
    expect(result.current.error).toBe('offline');
  });

  it('returns null without fetching when no active program id is set', async () => {
    (getActiveProgramId as any).mockReturnValue(null);

    const { result } = renderHook(() => useActiveProgram('user-1'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.program).toBeNull();
    expect(getResolvedProgram).not.toHaveBeenCalled();
  });

  it('returns null without fetching when there is no signed-in user', async () => {
    const { result } = renderHook(() => useActiveProgram(null));
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.program).toBeNull();
    expect(getResolvedProgram).not.toHaveBeenCalled();
  });
});
