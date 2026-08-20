import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Copy } from 'lucide-react';
import type { Program } from '../types/program';
import { listPrograms, createProgram, duplicateProgram, deleteProgram } from '../services/programs';
import { Drawer } from './Drawer';
import { ProgramEditorDrawer } from './ProgramEditorDrawer';
import { SwipeToDelete } from './SwipeToDelete';

interface ProgramListDrawerProps {
  userId: string;
}

export const ProgramListDrawer: React.FC<ProgramListDrawerProps> = ({ userId }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState('');
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
          <SwipeToDelete key={program.id} onDelete={() => handleDelete(program.id)} ariaLabel={`Delete ${program.name}`}>
            <div className="glass-panel" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                </div>
              </div>
            </div>
          </SwipeToDelete>
        ))}
      </div>

      <Drawer isOpen={!!openProgramId} onClose={() => setOpenProgramId(null)}>
        {openProgramId && <ProgramEditorDrawer userId={userId} programId={openProgramId} />}
      </Drawer>
    </div>
  );
};
