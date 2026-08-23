import React, { useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Exercise } from '../types/workout';
import type { BlockExercise } from '../types/program';
import { updateBlockExercise, type BlockExerciseOverrides } from '../services/programs';
import { NumberReel } from './NumberReel';
import { ConfirmDialog } from './ConfirmDialog';

interface ExerciseOverridesDrawerProps {
  placement: BlockExercise;
  exercise: Exercise | undefined;
  onSaved: (placement: BlockExercise) => void;
  onClose: () => void;
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '8px',
  color: '#FFFFFF',
  fontSize: '0.95rem',
};

interface OverrideForm {
  sets: number;
  workSeconds: number;
  restSeconds: number;
  repsOrTime: string;
}

const formFromPlacement = (placement: BlockExercise, exercise: Exercise | undefined): OverrideForm => ({
  sets: placement.setsOverride ?? exercise?.sets ?? 1,
  workSeconds: (placement.workSecondsOverride ?? exercise?.workSeconds) ?? 0,
  restSeconds: (placement.restSecondsOverride ?? exercise?.restSeconds) ?? 0,
  repsOrTime: placement.repsOrTimeOverride ?? exercise?.repsOrTime ?? '',
});

// Override fields are pre-filled with the exercise's library default rather than left blank, so
// a value only becomes a stored override once it actually diverges from that default. Work/rest
// seconds use 0 (not null) to mean "no timer" in the form, matching the NumberReel's range.
const overrideFieldsFromForm = (form: OverrideForm, exercise: Exercise | undefined): BlockExerciseOverrides => {
  const defaultWorkSeconds = exercise?.workSeconds ?? 0;
  const defaultRestSeconds = exercise?.restSeconds ?? 0;
  return {
    setsOverride: exercise && form.sets === exercise.sets ? null : form.sets,
    workSecondsOverride: form.workSeconds === defaultWorkSeconds ? null : form.workSeconds,
    restSecondsOverride: form.restSeconds === defaultRestSeconds ? null : form.restSeconds,
    repsOrTimeOverride: form.repsOrTime === (exercise?.repsOrTime ?? '') ? null : form.repsOrTime,
  };
};

export const ExerciseOverridesDrawer: React.FC<ExerciseOverridesDrawerProps> = ({ placement, exercise, onSaved, onClose }) => {
  const initialForm = useRef(formFromPlacement(placement, exercise));
  const [form, setForm] = useState<OverrideForm>(initialForm.current);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm.current);

  const requestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await updateBlockExercise(placement.id, overrideFieldsFromForm(form, exercise));
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save overrides.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>{exercise?.name ?? 'Edit Exercise'}</h2>
          <button onClick={requestClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}>
            <X size={22} />
          </button>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: '-8px' }}>
          Fields start at the library default — only a value you change is saved as an override for this block.
        </p>

        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Reps / Time</label>
          <input
            type="text"
            value={form.repsOrTime}
            onChange={e => setForm(f => ({ ...f, repsOrTime: e.target.value }))}
            placeholder="e.g. 3 x 10 Reps"
            style={fieldInputStyle}
          />
        </div>

        <NumberReel value={form.sets} min={1} max={10} onChange={v => setForm(f => ({ ...f, sets: v }))} label="Sets" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <NumberReel
            value={form.workSeconds}
            min={0}
            max={600}
            step={15}
            onChange={v => setForm(f => ({ ...f, workSeconds: v }))}
            label="Work Seconds"
          />
          <NumberReel
            value={form.restSeconds}
            min={0}
            max={600}
            step={15}
            onChange={v => setForm(f => ({ ...f, restSeconds: v }))}
            label="Rest Seconds"
          />
        </div>

        {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

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
          {saving ? 'Saving...' : 'Save Overrides'}
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard changes?"
        message="You have unsaved override changes for this exercise. If you leave now, they'll be lost."
        onConfirm={onClose}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </>
  );
};
