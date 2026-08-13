import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WorkoutState {
  // Workout Status
  isWorkoutStarted: boolean;
  isWorkoutPaused: boolean;
  totalSecondsElapsed: number;

  // Live Player Progress
  currentIndex: number;
  completedSets: { [exerciseId: string]: number };

  // Interval Timer State
  isResting: boolean;
  timeLeft: number;
  isIntervalStarted: boolean;
  isIntervalPaused: boolean;
  timeOffset: number;

  // Actions
  startWorkout: () => void;
  pauseWorkout: () => void;
  resumeWorkout: () => void;
  stopWorkout: () => void;
  incrementTotalTime: () => void;

  setCurrentIndex: (updater: number | ((prev: number) => number)) => void;
  updateCompletedSets: (exerciseId: string, count: number) => void;
  setIntervalState: (updater: Partial<WorkoutState> | ((state: WorkoutState) => Partial<WorkoutState>)) => void;
  setTimeLeft: (updater: number | ((prev: number) => number)) => void;
  resetStore: () => void;
}

const initialState = {
  isWorkoutStarted: false,
  isWorkoutPaused: false,
  totalSecondsElapsed: 0,
  
  currentIndex: 0,
  completedSets: {},
  
  isResting: false,
  timeLeft: 0,
  isIntervalStarted: false,
  isIntervalPaused: false,
  timeOffset: 0,
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

      setTimeLeft: (updater) => set((state) => ({
        timeLeft: typeof updater === 'function' ? updater(state.timeLeft) : updater
      })),

      updateCompletedSets: (exerciseId, count) => set((state) => ({
        completedSets: {
          ...state.completedSets,
          [exerciseId]: count
        }
      })),

      setIntervalState: (updater) => set((state) => {
        const updates = typeof updater === 'function' ? updater(state) : updater;
        return { ...state, ...updates };
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
