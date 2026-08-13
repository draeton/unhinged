import type { CompletedWorkout, PersonalRecord } from '../types/workout';

const STORAGE_KEYS = {
  COMPLETED_WORKOUTS: 'unhinged_completed_workouts',
  PERSONAL_RECORDS: 'unhinged_personal_records',
  USER_SETTINGS: 'unhinged_settings',
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
