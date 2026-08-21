import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ChevronRight, ChevronDown as ChevronDownIcon, Search, X } from 'lucide-react';
import type { Exercise } from '../types/workout';
import type { BlockExercise } from '../types/program';
import { listExercises } from '../services/exercises';
import { SwipeToDelete } from './SwipeToDelete';
import { SortableList } from './SortableList';
import { SortableRow } from './SortableRow';
import { NumberReel } from './NumberReel';
import {
  listBlockExercises,
  addExerciseToBlock,
  updateBlockExercise,
  removeExerciseFromBlock,
  reorderBlockExercises,
  type BlockExerciseOverrides,
} from '../services/programs';

interface BlockEditorDrawerProps {
  userId: string;
  blockId: string;
  blockTitle: string;
  onClose: () => void;
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '8px',
  color: '#FFFFFF',
  fontSize: '0.85rem',
};

interface OverrideForm {
  sets: number;
  workSeconds: string;
  restSeconds: string;
  repsOrTime: string;
}

// Override fields are pre-filled with the exercise's library default rather than left blank, so
// a value only becomes a stored override once it actually diverges from that default.
const overrideFieldsFromForm = (form: OverrideForm, exercise: Exercise | undefined): BlockExerciseOverrides => {
  const defaultWorkSeconds = exercise?.workSeconds ?? null;
  const defaultRestSeconds = exercise?.restSeconds ?? null;
  const formWorkSeconds = form.workSeconds === '' ? null : Number(form.workSeconds);
  const formRestSeconds = form.restSeconds === '' ? null : Number(form.restSeconds);
  return {
    setsOverride: exercise && form.sets === exercise.sets ? null : form.sets,
    workSecondsOverride: formWorkSeconds === defaultWorkSeconds ? null : formWorkSeconds,
    restSecondsOverride: formRestSeconds === defaultRestSeconds ? null : formRestSeconds,
    repsOrTimeOverride: form.repsOrTime === (exercise?.repsOrTime ?? '') ? null : form.repsOrTime,
  };
};

export const BlockEditorDrawer: React.FC<BlockEditorDrawerProps> = ({ userId, blockId, blockTitle, onClose }) => {
  const [placements, setPlacements] = useState<BlockExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState<OverrideForm>({ sets: 1, workSeconds: '', restSeconds: '', repsOrTime: '' });

  const refresh = () => {
    setLoading(true);
    setError(null);
    Promise.all([listBlockExercises(blockId), listExercises(userId)])
      .then(([placementRows, libraryRows]) => {
        setPlacements(placementRows);
        setLibrary(libraryRows);
      })
      .catch(err => setError(err?.message ?? 'Failed to load block.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blockId, userId]);

  const libraryById = useMemo(() => new Map(library.map(ex => [ex.id, ex])), [library]);

  const availableToAdd = useMemo(() => {
    const placedIds = new Set(placements.map(p => p.exerciseId));
    const q = pickerSearch.trim().toLowerCase();
    return library.filter(ex => !placedIds.has(ex.id) && (!q || ex.name.toLowerCase().includes(q)));
  }, [library, placements, pickerSearch]);

  const handleAdd = async (exerciseId: string) => {
    try {
      await addExerciseToBlock(userId, blockId, exerciseId);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add exercise.');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeExerciseFromBlock(id);
      if (expandedId === id) setExpandedId(null);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to remove exercise.');
    }
  };

  const handleReorder = async (reordered: BlockExercise[]) => {
    setPlacements(reordered); // optimistic
    try {
      await reorderBlockExercises(userId, blockId, reordered.map(p => p.id));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reorder.');
      refresh();
    }
  };

  const startEditingOverrides = (placement: BlockExercise) => {
    const exercise = libraryById.get(placement.exerciseId);
    setExpandedId(placement.id);
    setOverrideForm({
      sets: placement.setsOverride ?? exercise?.sets ?? 1,
      workSeconds: (placement.workSecondsOverride ?? exercise?.workSeconds)?.toString() ?? '',
      restSeconds: (placement.restSecondsOverride ?? exercise?.restSeconds)?.toString() ?? '',
      repsOrTime: placement.repsOrTimeOverride ?? exercise?.repsOrTime ?? '',
    });
  };

  const handleSaveOverrides = async (id: string, exercise: Exercise | undefined) => {
    try {
      await updateBlockExercise(id, overrideFieldsFromForm(overrideForm, exercise));
      setExpandedId(null);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save overrides.');
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>{blockTitle}</h2>
        <button
          title="Close"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
        >
          <X size={22} />
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-8px' }}>Exercises in this block</p>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!loading && placements.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises in this block yet.</div>
        )}
        <SortableList items={placements} onReorder={handleReorder}>
          {placement => {
            const exercise = libraryById.get(placement.exerciseId);
            const isExpanded = expandedId === placement.id;
            return (
              <SortableRow key={placement.id} id={placement.id}>
                {dragHandle => (
                  <SwipeToDelete onDelete={() => handleRemove(placement.id)} ariaLabel={`Remove ${exercise?.name ?? 'exercise'}`}>
                    <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {dragHandle}

                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>
                            {exercise?.name ?? '(exercise not found)'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {placement.setsOverride ?? exercise?.sets} sets
                            {(placement.repsOrTimeOverride ?? exercise?.repsOrTime) ? ` • ${placement.repsOrTimeOverride ?? exercise?.repsOrTime}` : ''}
                            {placement.setsOverride != null || placement.repsOrTimeOverride != null || placement.workSecondsOverride != null || placement.restSecondsOverride != null ? ' (overridden)' : ''}
                          </div>
                        </div>

                        <button
                          onClick={() => (isExpanded ? setExpandedId(null) : startEditingOverrides(placement))}
                          style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          {isExpanded ? <ChevronDownIcon size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>

                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '8px', borderTop: '1px dashed var(--border-subtle)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                            Fields start at the library default — only a value you change is saved as an override for this block.
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignItems: 'end' }}>
                            <NumberReel
                              compact
                              value={overrideForm.sets}
                              min={1}
                              max={10}
                              onChange={v => setOverrideForm(f => ({ ...f, sets: v }))}
                              label="Sets"
                            />
                            <input type="text" placeholder="Reps / Time" value={overrideForm.repsOrTime} onChange={e => setOverrideForm(f => ({ ...f, repsOrTime: e.target.value }))} style={fieldInputStyle} />
                            <input type="number" placeholder="Work seconds" value={overrideForm.workSeconds} onChange={e => setOverrideForm(f => ({ ...f, workSeconds: e.target.value }))} style={fieldInputStyle} />
                            <input type="number" placeholder="Rest seconds" value={overrideForm.restSeconds} onChange={e => setOverrideForm(f => ({ ...f, restSeconds: e.target.value }))} style={fieldInputStyle} />
                          </div>
                          <button className="btn-primary" onClick={() => handleSaveOverrides(placement.id, exercise)} style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}>
                            Save Overrides
                          </button>
                        </div>
                      )}
                    </div>
                  </SwipeToDelete>
                )}
              </SortableRow>
            );
          }}
        </SortableList>
      </div>

      {!showPicker ? (
        <button className="btn-primary" onClick={() => setShowPicker(true)} style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}>
          <Plus size={18} /> Add Exercise
        </button>
      ) : (
        <div className="glass-panel" style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              placeholder="Search library..."
              style={{ ...fieldInputStyle, paddingLeft: '32px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {availableToAdd.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching exercises.</div>
            )}
            {availableToAdd.map(ex => (
              <button
                key={ex.id}
                onClick={() => handleAdd(ex.id)}
                style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: 'none', borderRadius: '8px', padding: '10px', color: '#FFFFFF', fontSize: '0.85rem', cursor: 'pointer' }}
              >
                {ex.name}
              </button>
            ))}
          </div>
          <button className="btn-secondary" onClick={() => { setShowPicker(false); setPickerSearch(''); }} style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}>
            Done
          </button>
        </div>
      )}
    </div>
  );
};
