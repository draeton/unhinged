import { useEffect, useRef } from 'react';
import { useWorkoutStore, computeRemainingSeconds } from '../store/workoutStore';
import { audio } from '../utils/audio';

export function useTimerTicker(onExpire: (key: string) => void) {
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    // Recomputes every running timer from its startedAt/accumulatedMs timestamps rather than
    // decrementing a counter, so remainingSeconds reflects real elapsed time even after the
    // interval was throttled/missed while backgrounded — refresh() catches it up in one jump.
    const refresh = () => {
      const { timers, refreshTimer, expireTimer } = useWorkoutStore.getState();
      Object.entries(timers).forEach(([key, timer]) => {
        if (!timer.isStarted || timer.isPaused) return;

        const computedRemaining = computeRemainingSeconds(timer);
        if (computedRemaining <= 0) {
          expireTimer(key);
          onExpireRef.current(key);
        } else {
          if (computedRemaining <= 3 && computedRemaining !== timer.remainingSeconds) {
            audio.playBeep(600, 100);
          }
          refreshTimer(key);
        }
      });
    };

    const intervalId = setInterval(refresh, 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', refresh);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', refresh);
    };
  }, []);
}
