import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Copy, Trash2 } from 'lucide-react';
import type { Program } from '../types/program';
import { listPrograms, createProgram, duplicateProgram, deleteProgram } from '../services/programs';
import { Drawer } from './Drawer';
import { ProgramEditorDrawer } from './ProgramEditorDrawer';

interface ProgramListDrawerProps {
  userId: string;
}

export const ProgramListDrawer: React.FC<ProgramListDrawerProps> = ({ userId }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [openProgramId, setOpenProgramId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  const refresh = () => {
    setLoading(true);
    setError(null);
    listPrograms(userId)
      .then(setPrograms)
      .catch(err => setError(err?.message ?? 'Failed to load programs.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const created = await createProgram(userId, newName.trim());
      setNewName('');
      setShowNewForm(false);
      refresh();
      setOpenProgramId(created.id);
    } catch (err: any) {
      setError(err?.message ?? 'Failed to create program.');
    }
  };

  const handleDuplicate = async (program: Program) => {
    setDuplicatingId(program.id);
    setError(null);
    try {
      await duplicateProgram(userId, program.id, `${program.name} (Copy)`);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to duplicate program.');
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProgram(id);
      setConfirmDeleteId(null);
      refresh();
    } catch (err: any) {
      setError(err?.message ?? 'Failed to delete program.');
    }
  };

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#FFFFFF' }}>Programs</h2>

      {!showNewForm ? (
        <button className="btn-primary" onClick={() => setShowNewForm(true)} style={{ justifyContent: 'center', padding: '12px', fontSize: '0.92rem' }}>
          <Plus size={18} /> New Program
        </button>
      ) : (
        <div className="glass-panel" style={{ padding: '14px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Program name"
            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px', color: '#FFFFFF', fontSize: '0.9rem' }}
          />
          <button className="btn-primary" onClick={handleCreate} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>Create</button>
          <button className="btn-secondary" onClick={() => { setShowNewForm(false); setNewName(''); }} style={{ padding: '10px 16px', fontSize: '0.85rem' }}>Cancel</button>
        </div>
      )}

      {loading && <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Loading...</div>}
      {error && <div style={{ color: '#FF3366', fontSize: '0.9rem' }}>{error}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!loading && programs.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No programs yet — create one above.</div>
        )}
        {programs.map(program => (
          <div key={program.id} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div>
                <div style={{ fontWeight: '700', color: '#FFFFFF', fontSize: '1rem' }}>{program.name}</div>
                {program.description && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>{program.description}</div>
                )}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <button onClick={() => setOpenProgramId(program.id)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '8px', padding: '8px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDuplicate(program)} disabled={duplicatingId === program.id} style={{ background: 'rgba(0,240,255,0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#00F0FF', cursor: 'pointer', opacity: duplicatingId === program.id ? 0.5 : 1 }}>
                  <Copy size={16} />
                </button>
                <button onClick={() => setConfirmDeleteId(program.id)} style={{ background: 'rgba(255,0,122,0.1)', border: 'none', borderRadius: '8px', padding: '8px', color: '#FF3366', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {confirmDeleteId === program.id && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', background: 'rgba(255,0,122,0.08)', border: '1px solid rgba(255,0,122,0.3)', borderRadius: '10px', padding: '10px 12px' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-main)' }}>Delete this program and all its blocks?</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setConfirmDeleteId(null)} style={{ background: 'transparent', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '6px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }}>
                    Cancel
                  </button>
                  <button onClick={() => handleDelete(program.id)} style={{ background: '#FF3366', border: 'none', borderRadius: '8px', padding: '6px 12px', color: '#FFFFFF', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700' }}>
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Drawer isOpen={!!openProgramId} onClose={() => setOpenProgramId(null)}>
        {openProgramId && <ProgramEditorDrawer userId={userId} programId={openProgramId} />}
      </Drawer>
    </div>
  );
};
