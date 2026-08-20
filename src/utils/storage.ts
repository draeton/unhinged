import type { CompletedWorkout, PersonalRecord } from '../types/workout';
import type { ResolvedProgram } from '../types/program';

const STORAGE_KEYS = {
  COMPLETED_WORKOUTS: 'unhinged_completed_workouts',
  PERSONAL_RECORDS: 'unhinged_personal_records',
  USER_SETTINGS: 'unhinged_settings',
  ACTIVE_PROGRAM_ID: 'unhinged_active_program_id',
  ACTIVE_PROGRAM_CACHE: 'unhinged_active_program_cache',
};

export interface UserSettings {
  soundEnabled: boolean;
  autoAdvanceRest: boolean;
  leftScapulaAlerts: boolean;
}

export const getCompletedWorkouts = (): CompletedWorkout[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPLETED_WORKOUTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const saveCompletedWorkout = (workout: CompletedWorkout): void => {
  try {
    const existing = getCompletedWorkouts();
    const updated = [workout, ...existing];
    localStorage.setItem(STORAGE_KEYS.COMPLETED_WORKOUTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save workout to localStorage:', e);
  }
};

export const getPersonalRecords = (): PersonalRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PERSONAL_RECORDS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const deleteCompletedWorkout = (id: string): void => {
  try {
    const updated = getCompletedWorkouts().filter(w => w.id !== id);
    localStorage.setItem(STORAGE_KEYS.COMPLETED_WORKOUTS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete workout from localStorage:', e);
  }
};

export const savePersonalRecord = (record: PersonalRecord): void => {
  try {
    const records = getPersonalRecords();
    const idx = records.findIndex(r => r.exerciseId === record.exerciseId);
    if (idx >= 0) {
      records[idx] = record;
    } else {
      records.push(record);
    }
    localStorage.setItem(STORAGE_KEYS.PERSONAL_RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('Failed to save PR to localStorage:', e);
  }
};

export const getUserSettings = (): UserSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_SETTINGS);
    return raw ? JSON.parse(raw) : { soundEnabled: true, autoAdvanceRest: true, leftScapulaAlerts: true };
  } catch {
    return { soundEnabled: true, autoAdvanceRest: true, leftScapulaAlerts: true };
  }
};

export const saveUserSettings = (settings: UserSettings): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

// Which program is currently selected to run. Supabase is the source of truth for
// editing programs; this is just a pointer to which one, so the app knows what to fetch.
export const getActiveProgramId = (): string | null => {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM_ID);
  } catch {
    return null;
  }
};

export const setActiveProgramId = (id: string): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM_ID, id);
  } catch (e) {
    console.error('Failed to save active program id:', e);
  }
};

// A read-only cache of the active program's resolved blocks/exercises, so an
// in-progress workout can keep running if connectivity drops mid-session. This is NOT
// an editable local copy -- programs/exercises are Supabase-only for writes.
export const getCachedActiveProgram = (): ResolvedProgram | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_PROGRAM_CACHE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setCachedActiveProgram = (program: ResolvedProgram): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PROGRAM_CACHE, JSON.stringify(program));
  } catch (e) {
    console.error('Failed to cache active program:', e);
  }
};
