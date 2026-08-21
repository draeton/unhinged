import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Exercise, TargetMuscle } from '../types/workout';
import { createExercise, updateExercise, type ExerciseInput } from '../services/exercises';
import { SwipeToDelete } from './SwipeToDelete';

interface ExerciseEditorDrawerProps {
  userId: string;
  exercise: Exercise | null; // null = creating a new exercise
  onSaved: (exercise: Exercise) => void;
  onCancel: () => void;
}

const ALL_TARGET_MUSCLES: TargetMuscle[] = [
  'lats', 'biceps', 'scapula', 'hamstrings', 'glutes', 'lower_back', 'wrist_flexors', 'wrist_extensors', 'grip',
];

const clampSets = (value: number): number => Math.min(10, Math.max(1, Number.isFinite(value) ? value : 1));

const fieldLabelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: '700',
  color: 'var(--text-muted)',
  display: 'block',
  marginBottom: '6px',
};

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '10px',
  padding: '10px',
  color: '#FFFFFF',
  fontFamily: 'var(--font-main)',
  fontSize: '0.9rem',
};

const emptyFormState = (): ExerciseInput => ({
  name: '',
  workSeconds: null,
  restSeconds: null,
  sets: 1,
  repsOrTime: '',
  targetMuscles: [],
  equipment: '',
  description: '',
  formCues: [],
  safetyTip: '',
  videoUrls: [],
});

export const ExerciseEditorDrawer: React.FC<ExerciseEditorDrawerProps> = ({ userId, exercise, onSaved, onCancel }) => {
  const [form, setForm] = useState<ExerciseInput>(() =>
    exercise
      ? {
          name: exercise.name,
          workSeconds: exercise.workSeconds,
          restSeconds: exercise.restSeconds,
          sets: exercise.sets,
          repsOrTime: exercise.repsOrTime,
          targetMuscles: exercise.targetMuscles,
          equipment: exercise.equipment,
          description: exercise.description,
          formCues: exercise.formCues,
          safetyTip: exercise.safetyTip,
          videoUrls: exercise.videoUrls ?? [],
        }
      : emptyFormState()
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof ExerciseInput>(key: K, value: ExerciseInput[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const toggleTargetMuscle = (muscle: TargetMuscle) => {
    setField(
      'targetMuscles',
      form.targetMuscles.includes(muscle)
        ? form.targetMuscles.filter(m => m !== muscle)
        : [...form.targetMuscles, muscle]
    );
  };

  const updateFormCue = (index: number, value: string) => {
    const next = [...form.formCues];
    next[index] = value;
    setField('formCues', next);
  };

  const removeFormCue = (index: number) => {
    setField('formCues', form.formCues.filter((_, i) => i !== index));
  };

  const updateVideoUrl = (index: number, key: 'title' | 'url', value: string) => {
    const next = [...(form.videoUrls ?? [])];
    next[index] = { ...next[index], [key]: value };
    setField('videoUrls', next);
  };

  const removeVideoUrl = (index: number) => {
    setField('videoUrls', (form.videoUrls ?? []).filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = exercise ? await updateExercise(exercise.id, form) : await createExercise(userId, form);
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save exercise.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>
          {exercise ? 'Edit Exercise' : 'New Exercise'}
        </h2>
        <button onClick={onCancel} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
          <X size={22} />
        </button>
      </div>

      <div>
        <label style={fieldLabelStyle}>Name</label>
        <input
          type="text"
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          style={fieldInputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={fieldLabelStyle}>Sets</label>
          <input
            type="number"
            min={1}
            max={10}
            step={1}
            value={form.sets}
            onChange={e => setField('sets', clampSets(Number(e.target.value)))}
            style={fieldInputStyle}
          />
        </div>
        <div>
          <label style={fieldLabelStyle}>Reps / Time (display text)</label>
          <input
            type="text"
            value={form.repsOrTime}
            onChange={e => setField('repsOrTime', e.target.value)}
            placeholder="e.g. 3 x 10 Reps"
            style={fieldInputStyle}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={fieldLabelStyle}>Work Seconds (blank = no work timer)</label>
          <input
            type="number"
            min={0}
            value={form.workSeconds ?? ''}
            onChange={e => setField('workSeconds', e.target.value === '' ? null : Number(e.target.value))}
            style={fieldInputStyle}
          />
        </div>
        <div>
          <label style={fieldLabelStyle}>Rest Seconds (blank = no rest timer)</label>
          <input
            type="number"
            min={0}
            value={form.restSeconds ?? ''}
            onChange={e => setField('restSeconds', e.target.value === '' ? null : Number(e.target.value))}
            style={fieldInputStyle}
          />
        </div>
      </div>

      <div>
        <label style={fieldLabelStyle}>Equipment</label>
        <input
          type="text"
          value={form.equipment}
          onChange={e => setField('equipment', e.target.value)}
          style={fieldInputStyle}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Target Muscles</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {ALL_TARGET_MUSCLES.map(muscle => {
            const active = form.targetMuscles.includes(muscle);
            return (
              <button
                key={muscle}
                type="button"
                onClick={() => toggleTargetMuscle(muscle)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  border: active ? '1px solid var(--accent-cyan)' : '1px solid var(--border-subtle)',
                  background: active ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  color: active ? '#00F0FF' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {muscle.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label style={fieldLabelStyle}>Description</label>
        <textarea
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          style={{ ...fieldInputStyle, minHeight: '70px', resize: 'none' }}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Safety Tip</label>
        <textarea
          value={form.safetyTip}
          onChange={e => setField('safetyTip', e.target.value)}
          style={{ ...fieldInputStyle, minHeight: '50px', resize: 'none' }}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Form Cues</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {form.formCues.map((cue, i) => (
            <SwipeToDelete key={i} onDelete={() => removeFormCue(i)} ariaLabel={`Remove cue ${i + 1}`}>
              <input
                type="text"
                value={cue}
                onChange={e => updateFormCue(i, e.target.value)}
                style={{ ...fieldInputStyle, width: '100%' }}
              />
            </SwipeToDelete>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setField('formCues', [...form.formCues, ''])}
            style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Cue
          </button>
        </div>
      </div>

      <div>
        <label style={fieldLabelStyle}>Video Links</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(form.videoUrls ?? []).map((video, i) => (
            <SwipeToDelete key={i} onDelete={() => removeVideoUrl(i)} ariaLabel={`Remove video link ${i + 1}`}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={video.title}
                  onChange={e => updateVideoUrl(i, 'title', e.target.value)}
                  placeholder="Title"
                  style={{ ...fieldInputStyle, flex: 1 }}
                />
                <input
                  type="text"
                  value={video.url}
                  onChange={e => updateVideoUrl(i, 'url', e.target.value)}
                  placeholder="URL"
                  style={{ ...fieldInputStyle, flex: 1 }}
                />
              </div>
            </SwipeToDelete>
          ))}
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setField('videoUrls', [...(form.videoUrls ?? []), { title: '', url: '' }])}
            style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}
          >
            <Plus size={16} /> Add Video Link
          </button>
        </div>
      </div>

      {error && (
        <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>
      )}

      <button
        className="btn-primary"
        onClick={handleSave}
        disabled={saving}
        style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem', opacity: saving ? 0.6 : 1 }}
      >
        {saving ? 'Saving...' : 'Save Exercise'}
      </button>
    </div>
  );
};
