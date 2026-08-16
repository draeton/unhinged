import { useEffect, useRef } from 'react';
import { useWorkoutStore } from '../store/workoutStore';
import { audio } from '../utils/audio';

export function useTimerTicker(onExpire: (key: string) => void) {
  const onExpireRef = useRef(onExpire);
  useEffect(() => { onExpireRef.current = onExpire; }, [onExpire]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const { timers, tickTimer, expireTimer } = useWorkoutStore.getState();
      Object.entries(timers).forEach(([key, timer]) => {
        if (!timer.isStarted || timer.isPaused) return;
        if (timer.remainingSeconds <= 1) {
          expireTimer(key);
          onExpireRef.current(key);
        } else {
          if (timer.remainingSeconds <= 4) {
            audio.playBeep(600, 100);
          }
          tickTimer(key);
        }
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
}
