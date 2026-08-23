import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Search, X } from 'lucide-react';
import type { BlockType, Program } from '../types/program';
import type { Exercise } from '../types/workout';
import { createProgram, createBlock, addExerciseToBlock } from '../services/programs';
import { listExercises } from '../services/exercises';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import { SwipeToDelete } from './SwipeToDelete';
import { SortableList } from './SortableList';
import { SortableRow } from './SortableRow';
import { ConfirmDialog } from './ConfirmDialog';

interface NewProgramDrawerProps {
  userId: string;
  onCreated: (program: Program) => void;
  onClose: () => void;
}

const BLOCK_TYPES: BlockType[] = ['warmup', 'strength', 'mobility', 'cardio', 'cooldown'];

// Held only in local state until "Create Program" succeeds -- nothing here is written to
// Supabase before then, so `id` is a client-generated key for React/dnd-kit, not a DB id.
interface DraftExercise {
  id: string;
  exerciseId: string;
}

interface DraftBlock {
  id: string;
  title: string;
  subtitle: string;
  blockType: BlockType;
  durationMinutes: number;
  exercises: DraftExercise[];
}

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '10px',
  color: '#FFFFFF',
  fontFamily: 'var(--font-main)',
  fontSize: '0.9rem',
};

const sectionHeadingStyle: React.CSSProperties = {
  fontSize: '0.78rem',
  fontWeight: '800',
  color: 'var(--text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const emptyNewBlock = () => ({ title: '', subtitle: '', blockType: 'warmup' as BlockType, durationMinutes: 10 });

const makeLocalId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

// The gate for "Create Program": a name, and at least one block that itself has at least one
// exercise -- an empty block or a nameless program isn't a useful save. Exported so the gating
// logic is unit-testable without mounting the drawer.
export const canCreateProgram = (name: string, blocks: DraftBlock[]): boolean =>
  name.trim().length > 0 && blocks.some(b => b.exercises.length > 0);

interface DraftBlockExercisesProps {
  library: Exercise[];
  exercises: DraftExercise[];
  onAdd: (exerciseId: string) => void;
  onRemove: (id: string) => void;
  onReorder: (reordered: DraftExercise[]) => void;
}

const DraftBlockExercises: React.FC<DraftBlockExercisesProps> = ({ library, exercises, onAdd, onRemove, onReorder }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');

  const libraryById = useMemo(() => new Map(library.map(ex => [ex.id, ex])), [library]);

  const availableToAdd = useMemo(() => {
    const placedIds = new Set(exercises.map(e => e.exerciseId));
    const q = pickerSearch.trim().toLowerCase();
    return library.filter(ex => !placedIds.has(ex.id) && (!q || ex.name.toLowerCase().includes(q)));
  }, [library, exercises, pickerSearch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {exercises.length === 0 && (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises in this block yet.</div>
      )}
      <SortableList items={exercises} onReorder={onReorder}>
        {placement => {
          const exercise = libraryById.get(placement.exerciseId);
          return (
            <SortableRow key={placement.id} id={placement.id}>
              {dragHandle => (
                <SwipeToDelete onDelete={() => onRemove(placement.id)} ariaLabel={`Remove ${exercise?.name ?? 'exercise'}`}>
                  <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dragHandle}
                    <div style={{ flex: 1, fontWeight: '700', color: '#FFFFFF', fontSize: '0.95rem' }}>
                      {exercise?.name ?? '(exercise not found)'}
                    </div>
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
              style={{ ...fieldInputStyle, padding: '8px', fontSize: '0.95rem', paddingLeft: '32px' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '220px', overflowY: 'auto' }}>
            {availableToAdd.length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No matching exercises.</div>
            )}
            {availableToAdd.map(ex => (
              <button
                key={ex.id}
                onClick={() => onAdd(ex.id)}
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

export const NewProgramDrawer: React.FC<NewProgramDrawerProps> = ({ userId, onCreated, onClose }) => {
  const [nameDraft, setNameDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [draftBlocks, setDraftBlocks] = useState<DraftBlock[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [loadingLibrary, setLoadingLibrary] = useState(true);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState(emptyNewBlock());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  useEffect(() => {
    listExercises(userId)
      .then(setLibrary)
      .catch(err => setError(err?.message ?? 'Failed to load exercise library.'))
      .finally(() => setLoadingLibrary(false));
  }, [userId]);

  const isDirty = nameDraft.trim() !== '' || descriptionDraft.trim() !== '' || draftBlocks.length > 0;

  const requestClose = () => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleAddBlock = () => {
    if (!newBlock.title.trim()) {
      setError('Block title is required.');
      return;
    }
    setError(null);
    setDraftBlocks(prev => [
      ...prev,
      {
        id: makeLocalId(),
        title: newBlock.title.trim(),
        subtitle: newBlock.subtitle.trim(),
        blockType: newBlock.blockType,
        durationMinutes: newBlock.durationMinutes,
        exercises: [],
      },
    ]);
    setNewBlock(emptyNewBlock());
    setShowAddBlock(false);
  };

  const handleDeleteBlock = (id: string) => {
    setDraftBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleAddExercise = (blockId: string, exerciseId: string) => {
    setDraftBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, exercises: [...b.exercises, { id: makeLocalId(), exerciseId }] } : b))
    );
  };

  const handleRemoveExercise = (blockId: string, exerciseLocalId: string) => {
    setDraftBlocks(prev =>
      prev.map(b => (b.id === blockId ? { ...b, exercises: b.exercises.filter(e => e.id !== exerciseLocalId) } : b))
    );
  };

  const handleReorderExercises = (blockId: string, reordered: DraftExercise[]) => {
    setDraftBlocks(prev => prev.map(b => (b.id === blockId ? { ...b, exercises: reordered } : b)));
  };

  const canCreate = canCreateProgram(nameDraft, draftBlocks);

  const handleCreate = async () => {
    if (!canCreate || saving) return;
    setSaving(true);
    setError(null);
    try {
      const program = await createProgram(userId, nameDraft.trim(), descriptionDraft.trim());
      for (const draftBlock of draftBlocks) {
        const block = await createBlock(userId, program.id, {
          title: draftBlock.title,
          subtitle: draftBlock.subtitle,
          blockType: draftBlock.blockType,
          badgeColor: '#00F0FF',
          durationMinutes: draftBlock.durationMinutes,
        });
        for (const draftExercise of draftBlock.exercises) {
          await addExerciseToBlock(userId, block.id, draftExercise.exerciseId);
        }
      }
      onCreated(program);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create program.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>New Program</h2>
        <button
          title="Close"
          onClick={requestClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
        >
          <X size={22} />
        </button>
      </div>

      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      <div>
        <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Name
        </label>
        <AutoGrowTextarea
          value={nameDraft}
          onChange={e => setNameDraft(e.target.value)}
          placeholder="Program name"
          style={{ ...fieldInputStyle, fontSize: '1.15rem', fontWeight: '400' }}
        />
      </div>

      <div>
        <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
          Description
        </label>
        <AutoGrowTextarea
          value={descriptionDraft}
          onChange={e => setDescriptionDraft(e.target.value)}
          placeholder="Briefly describe this program..."
          style={{ ...fieldInputStyle, fontSize: '1.15rem', fontWeight: '400', minHeight: '60px' }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={sectionHeadingStyle}>Blocks</h3>
        {draftBlocks.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No blocks yet — add one below.</div>
        )}
        <SortableList items={draftBlocks} onReorder={setDraftBlocks}>
          {block => (
            <SortableRow key={block.id} id={block.id}>
              {dragHandle => (
                <SwipeToDelete onDelete={() => handleDeleteBlock(block.id)} ariaLabel={`Delete ${block.title}`}>
                  <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {dragHandle}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span className="badge" style={{ background: '#00F0FF', color: '#050B14', fontWeight: '800', fontSize: '0.7rem', alignSelf: 'flex-start' }}>
                        {block.blockType}
                      </span>
                      <span style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: '700' }}>{block.title}</span>
                    </div>
                  </div>
                </SwipeToDelete>
              )}
            </SortableRow>
          )}
        </SortableList>
      </div>

      {!showAddBlock ? (
        <button className="btn-primary" onClick={() => setShowAddBlock(true)} style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}>
          <Plus size={18} /> Add Block
        </button>
      ) : (
        <div className="glass-panel" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <input type="text" placeholder="Block title" value={newBlock.title} onChange={e => setNewBlock(b => ({ ...b, title: e.target.value }))} style={fieldInputStyle} />
          <input type="text" placeholder="Subtitle (optional)" value={newBlock.subtitle} onChange={e => setNewBlock(b => ({ ...b, subtitle: e.target.value }))} style={fieldInputStyle} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <select value={newBlock.blockType} onChange={e => setNewBlock(b => ({ ...b, blockType: e.target.value as BlockType }))} style={fieldInputStyle}>
              {BLOCK_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
            <input type="number" min={0} placeholder="Duration (min)" value={newBlock.durationMinutes} onChange={e => setNewBlock(b => ({ ...b, durationMinutes: Number(e.target.value) || 0 }))} style={fieldInputStyle} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn-secondary" onClick={() => { setShowAddBlock(false); setNewBlock(emptyNewBlock()); }} style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}>
              Cancel
            </button>
            <button className="btn-primary" onClick={handleAddBlock} style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: '0.85rem' }}>
              Add
            </button>
          </div>
        </div>
      )}

      {!loadingLibrary && draftBlocks.map(block => (
        <div key={block.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={sectionHeadingStyle}>{capitalize(block.blockType)}</h3>
          <DraftBlockExercises
            library={library}
            exercises={block.exercises}
            onAdd={exerciseId => handleAddExercise(block.id, exerciseId)}
            onRemove={id => handleRemoveExercise(block.id, id)}
            onReorder={reordered => handleReorderExercises(block.id, reordered)}
          />
        </div>
      ))}

      <button
        className="btn-primary"
        onClick={handleCreate}
        disabled={saving || !canCreate}
        style={{
          justifyContent: 'center',
          padding: '12px',
          fontSize: '0.92rem',
          ...((saving || !canCreate) && {
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-dim)',
            boxShadow: 'none',
            cursor: 'not-allowed',
          }),
        }}
      >
        {saving ? 'Creating...' : 'Create Program'}
      </button>
      {!canCreate && (
        <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem', marginTop: '-10px' }}>
          Add a name and at least one block with an exercise to create this program.
        </div>
      )}

      <ConfirmDialog
        isOpen={showDiscardConfirm}
        title="Discard new program?"
        message="You haven't saved this program yet. If you leave now, everything you've entered will be lost."
        onConfirm={onClose}
        onCancel={() => setShowDiscardConfirm(false)}
      />
    </div>
  );
};
