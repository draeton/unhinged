import React, { useRef, useState } from 'react';
import { Plus, X, Link } from 'lucide-react';
import type { Exercise, TargetMuscle } from '../types/workout';
import { createExercise, updateExercise, type ExerciseInput } from '../services/exercises';
import { SwipeToDelete } from './SwipeToDelete';
import { NumberReel } from './NumberReel';
import { Drawer } from './Drawer';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import { ConfirmDialog } from './ConfirmDialog';

interface ExerciseEditorDrawerProps {
  userId: string;
  exercise: Exercise | null; // null = creating a new exercise
  onSaved: (exercise: Exercise) => void;
  onCancel: () => void;
}

const ALL_TARGET_MUSCLES: TargetMuscle[] = [
  'lats', 'biceps', 'scapula', 'hamstrings', 'glutes', 'lower_back', 'wrist_flexors', 'wrist_extensors', 'grip',
];

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
  fontSize: '1.15rem',
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

const formFromExercise = (exercise: Exercise | null): ExerciseInput =>
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
    : emptyFormState();

export const ExerciseEditorDrawer: React.FC<ExerciseEditorDrawerProps> = ({ userId, exercise, onSaved, onCancel }) => {
  const initialForm = useRef(formFromExercise(exercise));
  const [form, setForm] = useState<ExerciseInput>(initialForm.current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingVideoUrlIndex, setEditingVideoUrlIndex] = useState<number | null>(null);
  const [urlDraft, setUrlDraft] = useState('');
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current);

  const requestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onCancel();
    }
  };

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

  const openUrlEditor = (index: number) => {
    setUrlDraft((form.videoUrls ?? [])[index]?.url ?? '');
    setEditingVideoUrlIndex(index);
  };

  const saveUrlDraft = () => {
    if (editingVideoUrlIndex === null) return;
    updateVideoUrl(editingVideoUrlIndex, 'url', urlDraft);
    setEditingVideoUrlIndex(null);
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
    <>
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>
          {exercise ? 'Edit Exercise' : 'New Exercise'}
        </h2>
        <button onClick={requestClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
          <X size={22} />
        </button>
      </div>

      <div>
        <label style={fieldLabelStyle}>Name</label>
        <AutoGrowTextarea
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          placeholder="e.g. Pistol Squat"
          style={fieldInputStyle}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <NumberReel value={form.sets} min={1} max={10} onChange={v => setField('sets', v)} label="Sets" />
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
          <NumberReel
            value={form.workSeconds ?? 0}
            min={0}
            max={600}
            step={15}
            onChange={v => setField('workSeconds', v === 0 ? null : v)}
            label="Work Seconds (0 = no timer)"
          />
        </div>
        <div>
          <NumberReel
            value={form.restSeconds ?? 0}
            min={0}
            max={600}
            step={15}
            onChange={v => setField('restSeconds', v === 0 ? null : v)}
            label="Rest Seconds (0 = no timer)"
          />
        </div>
      </div>

      <div>
        <label style={fieldLabelStyle}>Equipment</label>
        <AutoGrowTextarea
          value={form.equipment}
          onChange={e => setField('equipment', e.target.value)}
          placeholder="e.g. Pull-up bar, resistance band"
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
        <AutoGrowTextarea
          value={form.description}
          onChange={e => setField('description', e.target.value)}
          placeholder="Briefly describe how to perform this exercise..."
          style={{ ...fieldInputStyle, minHeight: '70px' }}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Safety Tip</label>
        <AutoGrowTextarea
          value={form.safetyTip}
          onChange={e => setField('safetyTip', e.target.value)}
          placeholder="e.g. Keep your core braced to protect your lower back"
          style={{ ...fieldInputStyle, minHeight: '50px' }}
        />
      </div>

      <div>
        <label style={fieldLabelStyle}>Form Cues</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {form.formCues.map((cue, i) => (
            <SwipeToDelete key={i} onDelete={() => removeFormCue(i)} ariaLabel={`Remove cue ${i + 1}`}>
              <div style={{ background: 'var(--bg-dark)', borderRadius: '10px' }}>
                <AutoGrowTextarea
                  value={cue}
                  onChange={e => updateFormCue(i, e.target.value)}
                  placeholder="e.g. Keep your chest up and core braced"
                  style={{ ...fieldInputStyle, width: '100%', outlineOffset: '-2px' }}
                />
              </div>
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
              <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-dark)', borderRadius: '10px' }}>
                <input
                  type="text"
                  value={video.title}
                  onChange={e => updateVideoUrl(i, 'title', e.target.value)}
                  placeholder="Title"
                  style={{ ...fieldInputStyle, flex: 1, outlineOffset: '-2px' }}
                />
                <button
                  type="button"
                  onClick={() => openUrlEditor(i)}
                  title={video.url ? 'Edit video URL' : 'Add video URL'}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '44px',
                    flexShrink: 0,
                    background: 'transparent',
                    border: 'none',
                    color: video.url ? '#00F0FF' : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  <Link size={18} />
                </button>
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
        disabled={saving || !isDirty}
        style={{
          width: '100%',
          justifyContent: 'center',
          padding: '14px',
          fontSize: '1rem',
          ...((saving || !isDirty) && {
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-dim)',
            boxShadow: 'none',
            cursor: 'not-allowed',
          }),
        }}
      >
        {saving ? 'Saving...' : 'Save Exercise'}
      </button>
    </div>

    <ConfirmDialog
      isOpen={showDiscardConfirm}
      title="Discard changes?"
      message="You have unsaved changes to this exercise. If you leave now, they'll be lost."
      onConfirm={onCancel}
      onCancel={() => setShowDiscardConfirm(false)}
    />

    <Drawer isOpen={editingVideoUrlIndex !== null} onClose={() => setEditingVideoUrlIndex(null)}>
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#FFFFFF' }}>Video URL</h3>
          <button onClick={() => setEditingVideoUrlIndex(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
            <X size={20} />
          </button>
        </div>
        <div>
          <label style={fieldLabelStyle}>URL</label>
          <input
            type="url"
            value={urlDraft}
            onChange={e => setUrlDraft(e.target.value)}
            placeholder="https://..."
            style={fieldInputStyle}
            autoFocus
          />
        </div>
        <button className="btn-primary" onClick={saveUrlDraft} style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}>
          Save
        </button>
      </div>
    </Drawer>
    </>
  );
};
