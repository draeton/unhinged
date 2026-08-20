import React, { useEffect, useMemo, useState } from 'react';
import { Plus, ChevronUp, ChevronDown, ChevronRight, ChevronDown as ChevronDownIcon, Search } from 'lucide-react';
import type { Exercise } from '../types/workout';
import type { BlockExercise } from '../types/program';
import { listExercises } from '../services/exercises';
import { SwipeToDelete } from './SwipeToDelete';
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

const overrideFieldsFromForm = (form: {
  sets: string; workSeconds: string; restSeconds: string; repsOrTime: string;
}): BlockExerciseOverrides => ({
  setsOverride: form.sets === '' ? null : Number(form.sets),
  workSecondsOverride: form.workSeconds === '' ? null : Number(form.workSeconds),
  restSecondsOverride: form.restSeconds === '' ? null : Number(form.restSeconds),
  repsOrTimeOverride: form.repsOrTime === '' ? null : form.repsOrTime,
});

export const BlockEditorDrawer: React.FC<BlockEditorDrawerProps> = ({ userId, blockId, blockTitle }) => {
  const [placements, setPlacements] = useState<BlockExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [overrideForm, setOverrideForm] = useState({ sets: '', workSeconds: '', restSeconds: '', repsOrTime: '' });

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

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= placements.length) return;
    const reordered = [...placements];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setPlacements(reordered); // optimistic
    try {
      await reorderBlockExercises(userId, blockId, reordered.map(p => p.id));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reorder.');
      refresh();
    }
  };

  const startEditingOverrides = (placement: BlockExercise) => {
    setExpandedId(placement.id);
    setOverrideForm({
      sets: placement.setsOverride?.toString() ?? '',
      workSeconds: placement.workSecondsOverride?.toString() ?? '',
      restSeconds: placement.restSecondsOverride?.toString() ?? '',
      repsOrTime: placement.repsOrTimeOverride ?? '',
    });
  };

  const handleSaveOverrides = async (id: string) => {
    try {
      await updateBlockExercise(id, overrideFieldsFromForm(overrideForm));
      setExpandedId(null);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to save overrides.');
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>{blockTitle}</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '-8px' }}>Exercises in this block</p>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!loading && placements.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises in this block yet.</div>
        )}
        {placements.map((placement, index) => {
          const exercise = libraryById.get(placement.exerciseId);
          const isExpanded = expandedId === placement.id;
          return (
            <SwipeToDelete key={placement.id} onDelete={() => handleRemove(placement.id)} ariaLabel={`Remove ${exercise?.name ?? 'exercise'}`}>
              <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button onClick={() => handleMove(index, -1)} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: index === 0 ? 'default' : 'pointer', padding: '2px' }}>
                      <ChevronUp size={16} />
                    </button>
                    <button onClick={() => handleMove(index, 1)} disabled={index === placements.length - 1} style={{ background: 'transparent', border: 'none', color: index === placements.length - 1 ? 'var(--text-dim)' : 'var(--text-muted)', cursor: index === placements.length - 1 ? 'default' : 'pointer', padding: '2px' }}>
                      <ChevronDown size={16} />
                    </button>
                  </div>

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
                      Leave a field blank to use the library default ({exercise?.sets} sets, {exercise?.repsOrTime || '—'}, work {exercise?.workSeconds ?? '—'}s, rest {exercise?.restSeconds ?? '—'}s).
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <input type="number" placeholder="Sets" value={overrideForm.sets} onChange={e => setOverrideForm(f => ({ ...f, sets: e.target.value }))} style={fieldInputStyle} />
                      <input type="text" placeholder="Reps / Time" value={overrideForm.repsOrTime} onChange={e => setOverrideForm(f => ({ ...f, repsOrTime: e.target.value }))} style={fieldInputStyle} />
                      <input type="number" placeholder="Work seconds" value={overrideForm.workSeconds} onChange={e => setOverrideForm(f => ({ ...f, workSeconds: e.target.value }))} style={fieldInputStyle} />
                      <input type="number" placeholder="Rest seconds" value={overrideForm.restSeconds} onChange={e => setOverrideForm(f => ({ ...f, restSeconds: e.target.value }))} style={fieldInputStyle} />
                    </div>
                    <button className="btn-primary" onClick={() => handleSaveOverrides(placement.id)} style={{ justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}>
                      Save Overrides
                    </button>
                  </div>
                )}
              </div>
            </SwipeToDelete>
          );
        })}
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
