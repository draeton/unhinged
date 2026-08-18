import { useCallback, useEffect, useState } from 'react';
import type { ResolvedProgram } from '../types/program';
import { getResolvedProgram } from '../services/programs';
import { getActiveProgramId, getCachedActiveProgram, setCachedActiveProgram } from '../utils/storage';

interface UseActiveProgramResult {
  program: ResolvedProgram | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

// Loads the active program: reads the active-program-id pointer from localStorage,
// fetches the resolved program from Supabase (the source of truth), and updates the
// local read-cache on success. If the fetch fails (e.g. offline) and a cache exists,
// falls back to the cached copy so an in-progress workout can still run. Returns null
// if no active-program-id is set at all (e.g. bootstrap hasn't completed yet).
export function useActiveProgram(userId: string | null): UseActiveProgramResult {
  const [program, setProgram] = useState<ResolvedProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchToken, setRefetchToken] = useState(0);

  const refetch = useCallback(() => setRefetchToken(t => t + 1), []);

  useEffect(() => {
    if (!userId) {
      setProgram(null);
      setLoading(false);
      return;
    }

    const activeProgramId = getActiveProgramId();
    if (!activeProgramId) {
      setProgram(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    getResolvedProgram(activeProgramId)
      .then(resolved => {
        if (cancelled) return;
        setProgram(resolved);
        setCachedActiveProgram(resolved);
      })
      .catch(err => {
        if (cancelled) return;
        const cached = getCachedActiveProgram();
        if (cached) {
          setProgram(cached);
        } else {
          setError(err?.message ?? 'Failed to load active program.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId, refetchToken]);

  return { program, loading, error, refetch };
}
