import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import type { Exercise } from '../types/workout';
import { listExercises, deleteExercise } from '../services/exercises';
import { Drawer } from './Drawer';
import { ExerciseEditorDrawer } from './ExerciseEditorDrawer';

interface ExerciseLibraryDrawerProps {
  userId: string;
}

type EditorState = { mode: 'closed' } | { mode: 'new' } | { mode: 'edit'; exercise: Exercise };

export const ExerciseLibraryDrawer: React.FC<ExerciseLibraryDrawerProps> = ({ userId }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState<EditorState>({ mode: 'closed' });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    listExercises(userId)
      .then(setExercises)
      .catch(err => setError(err?.message ?? 'Failed to load exercises.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter(ex => ex.name.toLowerCase().includes(q));
  }, [exercises, search]);

  const handleSaved = () => {
    setEditor({ mode: 'closed' });
    refresh();
  };

  const handleDelete = async (id: string) => {
    setDeleteError(null);
    try {
      await deleteExercise(id);
      setConfirmDeleteId(null);
      refresh();
    } catch (err: any) {
      setDeleteError(err?.message ?? 'Failed to delete exercise.');
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF' }}>Exercise Library</h2>

      <div style={{ position: 'relative' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search exercises..."
          style={{
            width: '100%',
            background: 'rgba(0, 0, 0, 0.3)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '10px 10px 10px 36px',
            color: '#FFFFFF',
            fontSize: '0.9rem',
          }}
        />
      </div>

      <button
        className="btn-primary"
        onClick={() => setEditor({ mode: 'new' })}
        style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}
      >
        <Plus size={18} /> Add Exercise
      </button>

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.9rem' }}>{error}</div>}
      {deleteError && <div style={{ color: '#FF3366', fontSize: '0.85rem' }}>{deleteError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!loading && filtered.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No exercises found.</div>
        )}
        {filtered.map(ex => (
          <div
            key={ex.id}
            className="glass-panel"
            style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '1rem' }}>{ex.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {ex.repsOrTime}{ex.equipment ? ` • ${ex.equipment}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button
                  onClick={() => setEditor({ mode: 'edit', exercise: ex })}
                  style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => { setDeleteError(null); setConfirmDeleteId(ex.id); }}
                  style={{ background: 'rgba(255,0,122,0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#FF3366', cursor: 'pointer' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {confirmDeleteId === ex.id && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(255,0,122,0.08)', border: '1px solid rgba(255,0,122,0.3)', borderRadius: '10px', padding: '10px 12px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>Delete this exercise?</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setConfirmDeleteId(null)}
                    style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(ex.id)}
                    style={{ background: '#FF3366', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Drawer isOpen={editor.mode !== 'closed'} onClose={() => setEditor({ mode: 'closed' })}>
        {editor.mode !== 'closed' && (
          <ExerciseEditorDrawer
            userId={userId}
            exercise={editor.mode === 'edit' ? editor.exercise : null}
            onSaved={handleSaved}
            onCancel={() => setEditor({ mode: 'closed' })}
          />
        )}
      </Drawer>
    </div>
  );
};
