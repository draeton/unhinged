import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Search } from 'lucide-react';
import type { Exercise } from '../types/workout';
import type { BlockExercise } from '../types/program';
import { listExercises } from '../services/exercises';
import { SwipeToDelete } from './SwipeToDelete';
import { SortableList } from './SortableList';
import { SortableRow } from './SortableRow';
import { Drawer } from './Drawer';
import { ExerciseOverridesDrawer } from './ExerciseOverridesDrawer';
import {
  listBlockExercises,
  addExerciseToBlock,
  removeExerciseFromBlock,
  reorderBlockExercises,
} from '../services/programs';

interface BlockExercisesSectionProps {
  userId: string;
  blockId: string;
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

export const BlockExercisesSection: React.FC<BlockExercisesSectionProps> = ({ userId, blockId }) => {
  const [placements, setPlacements] = useState<BlockExercise[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [editingPlacement, setEditingPlacement] = useState<BlockExercise | null>(null);

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
      if (editingPlacement?.id === id) setEditingPlacement(null);
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

  const handleOverridesSaved = (updated: BlockExercise) => {
    setPlacements(prev => prev.map(p => (p.id === updated.id ? updated : p)));
    setEditingPlacement(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      {!loading && placements.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises in this block yet.</div>
      )}
      <SortableList items={placements} onReorder={handleReorder}>
        {placement => {
          const exercise = libraryById.get(placement.exerciseId);
          return (
            <SortableRow key={placement.id} id={placement.id}>
              {dragHandle => (
                <SwipeToDelete onDelete={() => handleRemove(placement.id)} ariaLabel={`Remove ${exercise?.name ?? 'exercise'}`}>
                  <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                      onClick={() => setEditingPlacement(placement)}
                      title={`Edit ${exercise?.name ?? 'exercise'}`}
                      style={{ background: 'rgba(0, 240, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#00F0FF', cursor: 'pointer' }}
                    >
                      <Pencil size={16} />
                    </button>
                  </div>
                </SwipeToDelete>
              )}
            </SortableRow>
          );
        }}
      </SortableList>

      {!showPicker ? (
        <button className="btn-secondary" onClick={() => setShowPicker(true)} style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}>
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

      <Drawer isOpen={!!editingPlacement} onClose={() => setEditingPlacement(null)}>
        {editingPlacement && (
          <ExerciseOverridesDrawer
            placement={editingPlacement}
            exercise={libraryById.get(editingPlacement.exerciseId)}
            onSaved={handleOverridesSaved}
            onClose={() => setEditingPlacement(null)}
          />
        )}
      </Drawer>
    </div>
  );
};
