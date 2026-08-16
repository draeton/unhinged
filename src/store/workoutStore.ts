import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimerRuntimeState {
  remainingSeconds: number;
  totalSeconds: number;
  isStarted: boolean;
  isPaused: boolean;
  // Epoch ms when the current running segment began (null while paused/not started).
  startedAt: number | null;
  // Ms counted down across all previously-completed running segments (i.e. excluding paused time).
  accumulatedMs: number;
}

export function computeRemainingSeconds(timer: TimerRuntimeState): number {
  const runningMs = timer.startedAt ? Date.now() - timer.startedAt : 0;
  const elapsedMs = timer.accumulatedMs + runningMs;
  return Math.max(0, timer.totalSeconds - Math.floor(elapsedMs / 1000));
}

// Timer keys are `${exerciseId}:${'work' | 'rest'}` (see TimerDrawer's timerKey helper).
function parseTimerKey(key: string): { exerciseId: string; type: string } {
  const idx = key.lastIndexOf(':');
  return { exerciseId: key.slice(0, idx), type: key.slice(idx + 1) };
}

interface WorkoutState {
  // Workout Status
  isWorkoutStarted: boolean;
  isWorkoutPaused: boolean;
  totalSecondsElapsed: number;
  // Epoch ms when the current running segment began (null while paused/not started).
  workoutStartedAt: number | null;
  // Total ms elapsed across all previously-completed running segments (i.e. excluding time spent paused).
  accumulatedMs: number;

  // Live Player Progress
  currentIndex: number;
  completedSets: { [exerciseId: string]: number };

  // Work/Rest Timer State, keyed by `${exerciseId}:${'work' | 'rest'}`
  timers: { [key: string]: TimerRuntimeState };

  // Actions
  startWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  stopWorkout: () => void;
  // Recomputes totalSecondsElapsed from workoutStartedAt/accumulatedMs. Call on a tick and
  // whenever the app regains focus, so the displayed duration reflects real elapsed wall time
  // even if setInterval ticks were throttled/missed while backgrounded.
  refreshElapsedTime: () => void;

  setCurrentIndex: (updater: number | ((prev: number) => number)) => void;
  updateCompletedSets: (exerciseId: string, count: number) => void;

  startTimer: (key: string, totalSeconds: number) => void;
  pauseTimer: (key: string) => void;
  resumeTimer: (key: string) => void;
  resetTimer: (key: string) => void;
  // Recomputes a running timer's remainingSeconds from startedAt/accumulatedMs. Call on a tick
  // and on visibilitychange/focus so it reflects real elapsed time even after being backgrounded.
  refreshTimer: (key: string) => void;
  expireTimer: (key: string) => void;

  resetStore: () => void;
}

const initialState = {
  isWorkoutStarted: false,
  isWorkoutPaused: false,
  totalSecondsElapsed: 0,
  workoutStartedAt: null as number | null,
  accumulatedMs: 0,

  currentIndex: 0,
  completedSets: {},

  timers: {} as { [key: string]: TimerRuntimeState },
};

export const useWorkoutStore = create<WorkoutState>()(
  persist(
    (set) => ({
      ...initialState,

      startWorkout: () => set({
        isWorkoutStarted: true,
        isWorkoutPaused: false,
        totalSecondsElapsed: 0,
        workoutStartedAt: Date.now(),
        accumulatedMs: 0,
      }),

      pauseWorkout: () => set((state) => {
        if (state.isWorkoutPaused || !state.workoutStartedAt) return { isWorkoutPaused: true };
        const accumulatedMs = state.accumulatedMs + (Date.now() - state.workoutStartedAt);
        return {
          isWorkoutPaused: true,
          workoutStartedAt: null,
          accumulatedMs,
          totalSecondsElapsed: Math.floor(accumulatedMs / 1000),
        };
      }),

      resumeWorkout: () => set({ isWorkoutPaused: false, workoutStartedAt: Date.now() }),

      stopWorkout: () => set({
        ...initialState,
      }),

      refreshElapsedTime: () => set((state) => {
        if (!state.isWorkoutStarted || state.isWorkoutPaused || !state.workoutStartedAt) return state;
        const totalSecondsElapsed = Math.floor((state.accumulatedMs + (Date.now() - state.workoutStartedAt)) / 1000);
        if (totalSecondsElapsed === state.totalSecondsElapsed) return state;
        return { totalSecondsElapsed };
      }),

      setCurrentIndex: (updater) => set((state) => ({
        currentIndex: typeof updater === 'function' ? updater(state.currentIndex) : updater
      })),

      updateCompletedSets: (exerciseId, count) => set((state) => ({
        completedSets: {
          ...state.completedSets,
          [exerciseId]: count
        }
      })),

      startTimer: (key, totalSeconds) => set((state) => {
        const timers = {
          ...state.timers,
          [key]: {
            remainingSeconds: totalSeconds,
            totalSeconds,
            isStarted: true,
            isPaused: false,
            startedAt: Date.now(),
            accumulatedMs: 0,
          },
        };

        // Starting one of an exercise's timers resets its sibling (work <-> rest), if it was started.
        const { exerciseId, type } = parseTimerKey(key);
        const siblingKey = `${exerciseId}:${type === 'work' ? 'rest' : 'work'}`;
        const sibling = state.timers[siblingKey];
        if (sibling?.isStarted) {
          timers[siblingKey] = {
            ...sibling,
            remainingSeconds: sibling.totalSeconds,
            isStarted: false,
            isPaused: false,
            startedAt: null,
            accumulatedMs: 0,
          };
        }

        return { timers };
      }),

      pauseTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer || timer.isPaused || !timer.startedAt) return state;
        const accumulatedMs = timer.accumulatedMs + (Date.now() - timer.startedAt);
        return {
          timers: {
            ...state.timers,
            [key]: {
              ...timer,
              isPaused: true,
              startedAt: null,
              accumulatedMs,
              remainingSeconds: Math.max(0, timer.totalSeconds - Math.floor(accumulatedMs / 1000)),
            },
          },
        };
      }),

      resumeTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return { timers: { ...state.timers, [key]: { ...timer, isPaused: false, startedAt: Date.now() } } };
      }),

      resetTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return {
          timers: {
            ...state.timers,
            [key]: {
              ...timer,
              remainingSeconds: timer.totalSeconds,
              isStarted: false,
              isPaused: false,
              startedAt: null,
              accumulatedMs: 0,
            },
          },
        };
      }),

      refreshTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer || !timer.isStarted || timer.isPaused) return state;
        const remainingSeconds = computeRemainingSeconds(timer);
        if (remainingSeconds === timer.remainingSeconds) return state;
        return { timers: { ...state.timers, [key]: { ...timer, remainingSeconds } } };
      }),

      expireTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return {
          timers: {
            ...state.timers,
            [key]: { ...timer, remainingSeconds: 0, isStarted: false, isPaused: false, startedAt: null },
          },
        };
      }),

      resetStore: () => set({
        ...initialState
      }),
    }),
    {
      name: 'unhinged_workout_state',
    }
  )
);
