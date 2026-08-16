import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimerRuntimeState {
  remainingSeconds: number;
  totalSeconds: number;
  isStarted: boolean;
  isPaused: boolean;
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
  incrementTotalTime: () => void;

  setCurrentIndex: (updater: number | ((prev: number) => number)) => void;
  updateCompletedSets: (exerciseId: string, count: number) => void;

  startTimer: (key: string, totalSeconds: number) => void;
  pauseTimer: (key: string) => void;
  resumeTimer: (key: string) => void;
  resetTimer: (key: string) => void;
  tickTimer: (key: string) => void;
  expireTimer: (key: string) => void;

  resetStore: () => void;
}

const initialState = {
  isWorkoutStarted: false,
  isWorkoutPaused: false,
  totalSecondsElapsed: 0,

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
      }),

      pauseWorkout: () => set({ isWorkoutPaused: true }),

      resumeWorkout: () => set({ isWorkoutPaused: false }),

      stopWorkout: () => set({
        ...initialState,
      }),

      incrementTotalTime: () => set((state) => {
        if (state.isWorkoutStarted && !state.isWorkoutPaused) {
          return { totalSecondsElapsed: state.totalSecondsElapsed + 1 };
        }
        return state;
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
          [key]: { remainingSeconds: totalSeconds, totalSeconds, isStarted: true, isPaused: false },
        };

        // Starting one of an exercise's timers resets its sibling (work <-> rest), if it was started.
        const { exerciseId, type } = parseTimerKey(key);
        const siblingKey = `${exerciseId}:${type === 'work' ? 'rest' : 'work'}`;
        const sibling = state.timers[siblingKey];
        if (sibling?.isStarted) {
          timers[siblingKey] = { ...sibling, remainingSeconds: sibling.totalSeconds, isStarted: false, isPaused: false };
        }

        return { timers };
      }),

      pauseTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return { timers: { ...state.timers, [key]: { ...timer, isPaused: true } } };
      }),

      resumeTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return { timers: { ...state.timers, [key]: { ...timer, isPaused: false } } };
      }),

      resetTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return {
          timers: {
            ...state.timers,
            [key]: { ...timer, remainingSeconds: timer.totalSeconds, isStarted: false, isPaused: false },
          },
        };
      }),

      tickTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        const remainingSeconds = Math.max(0, timer.remainingSeconds - 1);
        return { timers: { ...state.timers, [key]: { ...timer, remainingSeconds } } };
      }),

      expireTimer: (key) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        return {
          timers: {
            ...state.timers,
            [key]: { ...timer, remainingSeconds: 0, isStarted: false, isPaused: false },
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
