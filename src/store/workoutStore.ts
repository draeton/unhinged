import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimerRuntimeState {
  remainingSeconds: number;
  totalSeconds: number;
  isStarted: boolean;
  isPaused: boolean;
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
  adjustTimer: (key: string, deltaSeconds: number) => void;
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

      startTimer: (key, totalSeconds) => set((state) => ({
        timers: {
          ...state.timers,
          [key]: { remainingSeconds: totalSeconds, totalSeconds, isStarted: true, isPaused: false },
        },
      })),

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

      adjustTimer: (key, deltaSeconds) => set((state) => {
        const timer = state.timers[key];
        if (!timer) return state;
        const nextRemaining = Math.max(5, timer.remainingSeconds + deltaSeconds);
        const actualDelta = nextRemaining - timer.remainingSeconds;
        return {
          timers: {
            ...state.timers,
            [key]: {
              ...timer,
              remainingSeconds: nextRemaining,
              totalSeconds: timer.totalSeconds + actualDelta,
            },
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
