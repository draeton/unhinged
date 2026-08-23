import React, { useEffect, useState } from 'react';
import { Plus, Pencil, X } from 'lucide-react';
import type { BlockType, Program, ProgramBlock } from '../types/program';
import { getProgram, renameProgram, listBlocks, createBlock, deleteBlock, reorderBlocks } from '../services/programs';
import { Drawer } from './Drawer';
import { AutoGrowTextarea } from './AutoGrowTextarea';
import { BlockInfoDrawer } from './BlockInfoDrawer';
import { BlockExercisesSection } from './BlockExercisesSection';
import { SwipeToDelete } from './SwipeToDelete';
import { SortableList } from './SortableList';
import { SortableRow } from './SortableRow';

interface ProgramEditorDrawerProps {
  userId: string;
  programId: string;
  onClose: () => void;
}

const BLOCK_TYPES: BlockType[] = ['warmup', 'strength', 'mobility', 'cardio', 'cooldown'];

const fieldInputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.3)',
  border: '1px solid var(--border-subtle)',
  borderRadius: '8px',
  padding: '10px',
  color: '#FFFFFF',
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

export const ProgramEditorDrawer: React.FC<ProgramEditorDrawerProps> = ({ userId, programId, onClose }) => {
  const [program, setProgram] = useState<Program | null>(null);
  const [blocks, setBlocks] = useState<ProgramBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState('');
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [newBlock, setNewBlock] = useState(emptyNewBlock());
  const [editingBlock, setEditingBlock] = useState<ProgramBlock | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    Promise.all([getProgram(programId), listBlocks(programId)])
      .then(([programRow, blockRows]) => {
        setProgram(programRow);
        setNameDraft(programRow?.name ?? '');
        setDescriptionDraft(programRow?.description ?? '');
        setBlocks(blockRows);
      })
      .catch(err => setError(err?.message ?? 'Failed to load program.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programId]);

  const handleNameBlur = async () => {
    if (!program || nameDraft.trim() === program.name || !nameDraft.trim()) return;
    try {
      const updated = await renameProgram(program.id, nameDraft.trim());
      setProgram(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to rename program.');
    }
  };

  const handleDescriptionBlur = async () => {
    if (!program || descriptionDraft.trim() === program.description) return;
    try {
      const updated = await renameProgram(program.id, program.name, descriptionDraft.trim());
      setProgram(updated);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to update program description.');
    }
  };

  const handleAddBlock = async () => {
    if (!newBlock.title.trim()) {
      setError('Block title is required.');
      return;
    }
    try {
      await createBlock(userId, programId, {
        title: newBlock.title,
        subtitle: newBlock.subtitle,
        blockType: newBlock.blockType,
        badgeColor: '#00F0FF',
        durationMinutes: newBlock.durationMinutes,
      });
      setNewBlock(emptyNewBlock());
      setShowAddBlock(false);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to add block.');
    }
  };

  const handleDeleteBlock = async (id: string) => {
    try {
      await deleteBlock(id);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete block.');
    }
  };

  const handleReorder = async (reordered: ProgramBlock[]) => {
    setBlocks(reordered); // optimistic
    try {
      await reorderBlocks(userId, programId, reordered.map(b => b.id));
    } catch (err: any) {
      setError(err?.message ?? 'Failed to reorder blocks.');
      refresh();
    }
  };

  const handleBlockSaved = (updated: ProgramBlock) => {
    setBlocks(prev => prev.map(b => (b.id === updated.id ? updated : b)));
    setEditingBlock(null);
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FFFFFF' }}>Edit Program</h2>
        <button
          title="Close"
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
        >
          <X size={22} />
        </button>
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{error}</div>}

      {program && (
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Name
          </label>
          <AutoGrowTextarea
            value={nameDraft}
            onChange={e => setNameDraft(e.target.value)}
            onBlur={handleNameBlur}
            style={{ ...fieldInputStyle, fontSize: '1.15rem', fontWeight: '400' }}
          />
        </div>
      )}

      {program && (
        <div>
          <label style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Description
          </label>
          <AutoGrowTextarea
            value={descriptionDraft}
            onChange={e => setDescriptionDraft(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Briefly describe this program..."
            style={{ ...fieldInputStyle, fontSize: '1.15rem', fontWeight: '400', minHeight: '60px' }}
          />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <h3 style={sectionHeadingStyle}>Blocks</h3>
        {!loading && blocks.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No blocks yet — add one below.</div>
        )}
        <SortableList items={blocks} onReorder={handleReorder}>
          {block => (
            <SortableRow key={block.id} id={block.id}>
              {dragHandle => (
                <SwipeToDelete onDelete={() => handleDeleteBlock(block.id)} ariaLabel={`Delete ${block.title}`}>
                  <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {dragHandle}

                      <span className="badge" style={{ background: block.badgeColor, color: '#050B14', fontWeight: '800', fontSize: '0.7rem' }}>
                        {block.blockType}
                      </span>
                    </div>

                    <button
                      onClick={() => setEditingBlock(block)}
                      title={`Edit ${block.title}`}
                      style={{ background: 'rgba(0, 240, 255, 0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#00F0FF', cursor: 'pointer' }}
                    >
                      <Pencil size={16} />
                    </button>
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

      {blocks.map(block => (
        <div key={block.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={sectionHeadingStyle}>{capitalize(block.blockType)}</h3>
          <BlockExercisesSection userId={userId} blockId={block.id} />
        </div>
      ))}

      <Drawer isOpen={!!editingBlock} onClose={() => setEditingBlock(null)}>
        {editingBlock && (
          <BlockInfoDrawer
            block={editingBlock}
            onSaved={handleBlockSaved}
            onClose={() => setEditingBlock(null)}
          />
        )}
      </Drawer>
    </div>
  );
};
